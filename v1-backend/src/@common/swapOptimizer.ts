import { BigNumber } from "ethers";
import { ActionEnum, Difference } from "./generatePortfolioDiff";

export interface SwapBook {
	from: string;
	to: string;
	amount: BigNumber;
}

export default async (
	changeset: Difference[],
	priceMappings: { [key: string]: BigNumber }
): Promise<SwapBook[]> => {
	let swapBook: SwapBook[] = [];
	let buys: Difference[] = [];
	let sells: Difference[] = [];

	for (let change of changeset) {
		if (change.action === ActionEnum.BUY) {
			buys.push(change);
			continue;
		}

		sells.push(change);
	}

	return swapBook;
};
