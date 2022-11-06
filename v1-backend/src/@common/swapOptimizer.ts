import { BigNumber, utils } from "ethers";
import { ActionEnum, Difference } from "./generatePortfolioDiff";

interface Position {
	address: string;
	balance: BigNumber;
	value: BigNumber;
	delta: BigNumber;
	price: BigNumber;
}

export interface SwapBook {
	from: string;
	to: string;
	amount: BigNumber;
}

export default (
	actual: { [key: string]: Position },
	expected: { [key: string]: Position }
) => {
	let swapBook = [];
	let iterableActual: Position[] = [];
	let iterableExpected: Position[] = [];
	let blacklistedMovers: Set<string> = new Set();

	// cleanup deltas
	for (let address of Object.keys(actual)) {
		const pricePerToken = utils
			.parseEther(actual[address].value.toString())
			.div(utils.parseEther(actual[address].balance.toString()));

		if (!expected[address] || blacklistedMovers.has(address)) {
			continue;
		}

		if (actual[address].balance.eq(expected[address].balance)) {
			blacklistedMovers.add(address);
			delete expected[address];
		}

		// if the vault has more than whats expected, no longer need to swap into expected and can reallocate remaining resources
		// change delta to reflect updates
		// delta equals remaining tokens times cost per token

		if (actual[address].balance.gt(expected[address].balance)) {
			actual[address].balance = actual[address].balance.sub(
				expected[address].balance
			);
			actual[address].value = actual[address].balance.mul(pricePerToken);
			actual[address].delta = actual[address].value;

			delete expected[address];
		}
	}

	for (let address of Object.keys(expected)) {
		const pricePerToken = expected[address].value.div(
			expected[address].balance
		);

		if (!actual[address] || blacklistedMovers.has(address)) {
			continue;
		}

		if (expected[address].balance.gt(actual[address].balance)) {
			expected[address].balance = expected[address].balance.sub(
				actual[address].balance
			);
			expected[address].value =
				expected[address].balance.mul(pricePerToken);
			expected[address].delta = expected[address].value;

			delete actual[address];
		}
	}

	// more cleanup
	for (let address of Object.keys(actual)) {
		iterableActual.push({
			address,
			...actual[address],
		});
	}
	for (let address of Object.keys(expected)) {
		iterableExpected.push({
			address,
			...expected[address],
		});
	}

	let [iActual, iExpected] = [0, 0];

	while (
		iActual < iterableActual.length &&
		iExpected < iterableExpected.length
	) {
		const actualAsset = iterableActual[iActual];
		console.log("actualAsset Value:", utils.formatEther(actualAsset.value));
		// const aPricePerToken = utils
		// 	.parseEther(actualAsset.value.toString())
		// 	.div(utils.parseEther(actualAsset.balance.toString()));
		const aPricePerToken = actualAsset.price;
		const expectedAsset = iterableExpected[iExpected];
		// const ePricePerToken = utils
		// 	.parseEther(expectedAsset.value.toString())
		// 	.div(utils.parseEther(expectedAsset.balance.toString()));

		if (actualAsset.value.gte(expectedAsset.delta)) {
			const entry = {
				from: actualAsset.address,
				to: expectedAsset.address,
				amount: utils
					.parseEther(expectedAsset.delta.toString())
					.div(aPricePerToken),
			};
			swapBook.push(entry);

			console.log(
				actualAsset.balance.toString(),
				utils.formatEther(entry.amount)
			);
			actualAsset.balance = utils
				.parseEther(actualAsset.balance.toString())
				.sub(utils.parseEther(utils.formatEther(entry.amount)));
			actualAsset.value = actualAsset.value.sub(expectedAsset.delta);

			expectedAsset.balance = BigNumber.from(0);
			expectedAsset.value = BigNumber.from(0);
			expectedAsset.delta = BigNumber.from(0);

			iterableActual[iActual] = actualAsset;
			iterableExpected[iExpected] = expectedAsset;

			iExpected += 1;
			continue;
		}

		const entry = {
			from: actualAsset.address,
			to: expectedAsset.address,
			amount: actualAsset.balance,
		};
		swapBook.push(entry);

		expectedAsset.delta = expectedAsset.delta.sub(actualAsset.value);

		actualAsset.balance = BigNumber.from(0);
		actualAsset.value = BigNumber.from(0);
		actualAsset.delta = BigNumber.from(0);

		iterableActual[iActual] = actualAsset;
		iterableExpected[iExpected] = expectedAsset;

		iActual += 1;
	}

	if (iActual < iterableActual.length) {
		console.log("extra liquidity");
		// create WETH swap
	}

	if (iExpected < iterableExpected.length) {
		// well shit. this shouldnt happen
	}

	return swapBook;
};
