import abiDecoder from 'abi-decoder';
import { utils } from 'web3';
import * as csv from 'csv-string';
import fs from 'fs';
import ABI from './abi/fizzy.json';

const States = Object.freeze({
  ONGOING: 0,
  FLIGHT_ON_TIME: 1,
  FLIGHT_LATE: 2,
  USER_CANCELLED: 3,
  FLIGHT_CANCELLED: 4,
  FLIGHT_REDIRECTED: 5,
  FLIGHT_DIVERTED: 6,
});

function extractDataFromInsuranceCreationLog(log) {
  const flightId = utils.toAscii(log.events[0].value);
  const premium = utils.toDecimal(log.events[1].value);
  const indemnity = utils.toDecimal(log.events[2].value);
  const productId = utils.toAscii(log.events[3].value);
  return {
    name: log.name,
    blockNumber: log.blockNumber,
    timestamp: log.timestamp,
    flightId,
    premium,
    indemnity,
    productId,
  };
}

function extractDataFromInsuranceUpdateLog(log) {
  const productId = utils.toAscii(log.events[0].value);
  const flightId = utils.toAscii(log.events[1].value);
  const premium = utils.toDecimal(log.events[2].value);
  const indemnity = utils.toDecimal(log.events[3].value);
  const status = utils.toDecimal(log.events[4].value);
  return {
    name: log.name,
    blockNumber: log.blockNumber,
    timestamp: log.timestamp,
    flightId,
    premium,
    indemnity,
    productId,
    status,
  };
}

function decodeAndExtractLogs(logs) {
  abiDecoder.addABI(ABI);
  const decodedLogs = logs.map(e => ({
    ...abiDecoder.decodeLogs([e])[0],
    blockNumber: e.blockNumber,
    timestamp: e.timestamp,
  }));

  const insuranceUpdates = decodedLogs
    .filter(e => e.name === 'InsuranceUpdate')
    .map(extractDataFromInsuranceUpdateLog);

  const insuranceCreations = decodedLogs
    .filter(e => e.name === 'InsuranceCreation')
    .map(extractDataFromInsuranceCreationLog);

  return { insuranceCreations, insuranceUpdates };
}

function getFlighIdDistribution(insuranceCreations, companyOnly) {
  return insuranceCreations
    .map(log => log.flightId
      .split('.')
      .slice(0, companyOnly ? 1 : 2)
      .join(''))
    .reduce((acc, flightId) => {
      acc[flightId] = acc[flightId] ? acc[flightId] + 1 : 1;
      return acc;
    }, {});
}

function july26Mystery(insuranceCreations) {
  // Approx start: 1532609291 and end: 1532645931 ~10 hours
  const startDate = 1532609291;
  const endDate = 1532645931;
  const july26Creations = insuranceCreations.filter(
    log => log.timestamp >= startDate && log.timestamp <= endDate,
  );

  const flightDistributionPerCompany = getFlighIdDistribution(july26Creations, true);
  const beforeJuly26Creations = insuranceCreations.filter(log => log.timestamp < startDate);
  const before2018PerCompany = getFlighIdDistribution(beforeJuly26Creations, true);
  return { flightDistributionPerCompany, before2018PerCompany };
}

function getCreationPerTimestamp(insuranceCreations, groupBy) {
  return insuranceCreations
    .map(log => (groupBy ? Math.round(log.timestamp / groupBy) : log.timestamp))
    .reduce((acc, timestamp) => {
      acc[timestamp] = acc[timestamp] ? acc[timestamp] + 1 : 1;
      return acc;
    }, {});
}

function getPremiumDistribution(insuranceCreations) {
  return insuranceCreations
    .map(log => Math.round((100 * log.premium) / log.indemnity))
    .reduce((acc, perc) => {
      acc[perc] = acc[perc] ? acc[perc] + 1 : 1;
      return acc;
    }, {});
}

function profitability(insuranceCreations, insuranceUpdates) {
  const totalPremium = insuranceUpdates.reduce((acc, data) => acc + data.premium, 0);
  const totalPaidIndemnity = insuranceUpdates.reduce((acc, data) => {
    if (data.status === States.FLIGHT_LATE) {
      return acc + data.indemnity;
    }
    return acc;
  }, 0);
  const totalReimbursedPremium = insuranceUpdates.reduce((acc, data) => {
    if (
      data.status === States.FLIGHT_CANCELLED
      || data.status === States.FLIGHT_DIVERTED
      || data.status === States.FLIGHT_REDIRECTED
    ) {
      return acc + data.premium;
    }
    return acc;
  }, 0);
  return { totalPremium, totalPaidIndemnity, totalReimbursedPremium };
}

function numberOfXFlights(insuranceUpdates, status) {
  return insuranceUpdates.reduce((acc, data) => (data.status === status ? acc + 1 : acc), 0);
}

function showProfitability(insuranceCreations, insuranceUpdates) {
  const { totalPremium, totalPaidIndemnity, totalReimbursedPremium } = profitability(
    insuranceCreations,
    insuranceUpdates,
  );
  console.log(`Total premium received (revenue): ${totalPremium}€`);
  console.log(`Total indemnity paid (expense): ${totalPaidIndemnity}€`);
  console.log(`Total premium reimbursed (expense): ${totalReimbursedPremium}€`);
  console.log(`Gross profit: ${totalPremium - totalPaidIndemnity - totalReimbursedPremium}€`);
}

function showJuly26Info(insuranceCreations) {
  const { flightDistributionPerCompany, before2018PerCompany } = july26Mystery(insuranceCreations);
  console.log('Flight distributions before July 26th:');
  console.log(before2018PerCompany);
  console.log('Flight distributions on July 26th:');
  console.log(flightDistributionPerCompany);
}

function showTotals(insuranceCreations, insuranceUpdates) {
  const numberOfFlightsOnTime = numberOfXFlights(insuranceUpdates, States.FLIGHT_ON_TIME);
  const numberOfOnGoingFlights = numberOfXFlights(insuranceUpdates, States.ONGOING);
  const numberOfLateFlights = numberOfXFlights(insuranceUpdates, States.FLIGHT_LATE);
  const numberOfCancelledInsurances = numberOfXFlights(insuranceUpdates, States.USER_CANCELLED);
  const numberOfCancelledFlights = numberOfXFlights(insuranceUpdates, States.FLIGHT_CANCELLED);
  const numberOfRedirectedFlights = numberOfXFlights(insuranceUpdates, States.FLIGHT_REDIRECTED);
  const numberOfDivertedFlights = numberOfXFlights(insuranceUpdates, States.FLIGHT_DIVERTED);
  console.log(`Number of insurances resolved: ${insuranceUpdates.length}`);
  console.log(`Number of insurances resolved by a flight ontime: ${numberOfFlightsOnTime}`);
  console.log(`Number of insurances resolved by a late flight: ${numberOfLateFlights}`);
  console.log(`Number of insurances resolved by a flight cancelled: ${numberOfCancelledFlights}`);
  console.log(`Number of insurances resolved by a flight redirected: ${numberOfRedirectedFlights}`);
  console.log(`Number of insurances resolved by a flight diverted: ${numberOfDivertedFlights}`);
  console.log(`Number of insurances resolved by a flight ongoing: ${numberOfOnGoingFlights}`);
  console.log(`Number of insurances cancelled by user: ${numberOfCancelledInsurances}`);
}

function writeDistributionCSV(filename, distribution) {
  const data = csv.stringify(Object.keys(distribution).map(e => [e, distribution[e]]));
  fs.writeFile(filename, data, (err) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(`${filename} saved.`);
  });
}

export default function showFizzyAnalysisForLogs(logs) {
  const { insuranceCreations, insuranceUpdates } = decodeAndExtractLogs(logs);
  showTotals(insuranceCreations, insuranceUpdates);
  showProfitability(insuranceCreations, insuranceUpdates);
  // Generate CSV files, will be plotted via spreadsheet software or gnuplot
  writeDistributionCSV('premium-distribution.csv', getPremiumDistribution(insuranceCreations));
  writeDistributionCSV('updates-by-time.csv', getCreationPerTimestamp(insuranceUpdates));
  writeDistributionCSV('creations-by-time.csv', getCreationPerTimestamp(insuranceCreations));

  // Info about july 26
  showJuly26Info(insuranceCreations);
}
