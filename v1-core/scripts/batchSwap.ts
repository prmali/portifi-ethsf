import { swap } from "./singleSwap";
import { BigNumber } from "ethers";

interface Swap {
	token0: string;
	token1: string;
	sellAmount: BigNumber;
}

async function batchSwap(swaps: Swap[]) {
	for (let pairs of swaps) {
		console.log(`FOR ${pairs.token0}-${pairs.token1} PAIR:`);
		await swap(pairs);
	}
}

export default batchSwap;
