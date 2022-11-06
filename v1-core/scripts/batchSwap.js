const { swap } = require('./singleSwap');

async function batchSwap(argv) {
  for (pairs in swaps) {
    console.log(`FOR ${pairs.token0}-${pairs.token1} PAIR:`);
    await swap(pairs);
  }
}
