const { swap } = require('./singleSwap');

const target = JSON.parse(fs.readFileSync('./src/scripts/test-portfolio.json').toString());

require('yargs')
  .parserConfiguration({ 'parse-numbers': false })
  .command(
    '*',
    'directly fill mulitple pairs (token0, token1) with quote from 0x API',
    (yargs) => {
      return yargs.option('Portfolio', {
        alias: 't0',
        type: 'string',
        describe: 'address of the token0 contract',
        default: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
      });
    },
    async (argv) => {
      try {
        await batchSwap(target);
        process.exit(0);
      } catch (err) {
        console.error(err);
        process.exit(1);
      }
    }
  ).argv;

async function batchSwap(argv) {
  console.log(argv);
  for (pairs in swaps) {
    console.log(`FOR ${pairs.token0}-${pairs.token1} PAIR:`);
    await swap(pairs);
  }
}

module.exports = batchSwap;
