# Setup

Copy the default config file, eventually edit it (point to the Ethereum node, you're going to use):

```sh
$ cp config-example.js config.js
```

Install dependencies

```sh
$ yarn
```

Then you can run the analysis with:

```sh
$ yarn start
```

It takes some time the first time to fetch the logs and cache them.

# Documentation

## Addresses

- Ropsten: 0x0416A52319Be3F368d27d3a0086Fa7ADaEc8a7fA
  https://ropsten.etherscan.io/address/0x0416a52319be3f368d27d3a0086fa7adaec8a7fa

- Mainnet: 0xe083515D1541F2a9Fd0ca03f189F5D321C73B872
  https://etherscan.io/address/0xe083515d1541f2a9fd0ca03f189f5d321c73b872

## Smart contract struct and events

```solidity
  /*
  * Potential statuses for the Insurance struct
  * 0: ongoing
  * 1: insurance contract resolved normally and the flight landed before the limit
  * 2: insurance contract resolved normally and the flight landed after the limit
  * 3: insurance contract resolved because cancelled by the user
  * 4: insurance contract resolved because flight cancelled by the air company
  * 5: insurance contract resolved because flight redirected
  * 6: insurance contract resolved because flight diverted
  */
  struct Insurance {          // all the infos related to a single insurance
    bytes32 productId;           // ID string of the product linked to this insurance
    uint limitArrivalTime;    // maximum arrival time after which we trigger compensation (timestamp in sec)
    uint32 premium;           // amount of the premium
    uint32 indemnity;         // amount of the indemnity
    uint8 status;             // status of this insurance contract. See comment above for potential values
  }

  event InsuranceCreation(    // event sent when a new insurance contract is added to this smart contract
    bytes32 flightId,         // <carrier_code><flight_number>.<timestamp_in_sec_of_departure_date>
    uint32 premium,           // amount of the premium paid by the user
    uint32 indemnity,         // amount of the potential indemnity
    bytes32 productId            // ID string of the product linked to this insurance
  );

  /*
   * Potential statuses for the InsuranceUpdate event
   * 1: flight landed before the limit
   * 2: flight landed after the limit
   * 3: insurance contract cancelled by the user
   * 4: flight cancelled
   * 5: flight redirected
   * 6: flight diverted
   */
  event InsuranceUpdate(      // event sent when the situation of a particular insurance contract is resolved
    bytes32 productId,           // id string of the user linked to this account
    bytes32 flightId,         // <carrier_code><flight_number>.<timestamp_in_sec_of_departure_date>
    uint32 premium,           // amount of the premium paid by the user
    uint32 indemnity,         // amount of the potential indemnity
    uint8 status              // new status of the insurance contract. See above comment for potential values
  );
```
