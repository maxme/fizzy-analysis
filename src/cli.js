import Web3 from 'web3';
import toolbox from 'eth-toolbox';
import config from '../config';
import showFizzyAnalysisForLogs from './fizzyAnalysis';

let web3;
if (config.USE_INFURA) {
  web3 = new Web3(
    new Web3.providers.HttpProvider(`https://mainnet.infura.io/v3/${config.INFURA_TOKEN}`),
  );
} else {
  web3 = new Web3(new Web3.providers.HttpProvider(config.NODE_ENDPOINT));
}

async function main() {
  toolbox.setup(web3);
  const logs = await toolbox.logs.getAllLogsForAddress(
    config.FIZZY_CONTRACT_ADDRESS,
    new toolbox.cache.FileCacheManager(`${config.FIZZY_CONTRACT_ADDRESS}-logs.cache`),
  );
  const logArray = Object.values(logs);
  console.log(`Number of events: ${logArray.length}`);
  showFizzyAnalysisForLogs(logArray);
}

main();
