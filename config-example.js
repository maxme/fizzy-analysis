export default {
  USE_INFURA: true,
  // Infura private token
  INFURA_TOKEN: 'REPLACE_THIS_BY_YOUR_INFURA_TOKEN',
  // Using infura, 5000 seems fine. This can be increased when using with a local node
  BLOCK_CHUNK: 5000,
  // Node RPC endpoint if you're not using Infura
  NODE_ENDPOINT: 'http://localhost:8545',
  // Fizzy contract addresses
  // Mainnet: 0xe083515D1541F2a9Fd0ca03f189F5D321C73B872
  // Ropsten: 0x0416A52319Be3F368d27d3a0086Fa7ADaEc8a7fA
  FIZZY_CONTRACT_ADDRESS: '0xe083515D1541F2a9Fd0ca03f189F5D321C73B872',
};
