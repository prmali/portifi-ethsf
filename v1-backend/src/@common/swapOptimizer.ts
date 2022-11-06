import { BigNumber } from "ethers";
import { ActionEnum, Difference } from "./generatePortfolioDiff";

interface Position {
	address: string;
	balance: BigNumber;
	value: BigNumber;
	delta: BigNumber;
}

export interface SwapBook {
	from: string;
	to: string;
	amount: BigNumber;
}

export default async (
	actual: { [key: string]: Position },
	expected: { [key: string]: Position }
) => {
	let swapBook = [];
	let iteratableActual: Position[] = [];
	let iteratableExpected: Position[] = [];
	let blacklistedMovers: Set<string> = new Set();

	// cleanup deltas
	for (let address in Object.keys(actual)) {
		const pricePerToken = actual[address].value.div(
			actual[address].balance
		);

		if (!expected[address] || blacklistedMovers.has(address)) {
			continue;
		}

		if (actual[address].balance === expected[address].balance) {
			blacklistedMovers.add(address);
			delete expected[address];
		}

		// if the vault has more than whats expected, no longer need to swap into expected and can reallocate remaining resources
		// change delta to reflect updates
		// delta equals remaining tokens times cost per token

		if (actual[address].balance > expected[address].balance) {
			actual[address].balance = actual[address].balance.sub(
				expected[address].balance
			);
			actual[address].value = actual[address].balance.mul(pricePerToken);
			actual[address].delta = actual[address].value;

			delete expected[address];
		}
	}

	for (let address in Object.keys(expected)) {
		const pricePerToken = expected[address].value.div(
			expected[address].balance
		);

		if (!actual[address] || blacklistedMovers.has(address)) {
			continue;
		}

		if (expected[address].balance > actual[address].balance) {
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
		iteratableActual.push({
			address,
			...actual[address],
		});
	}
	for (let address of Object.keys(expected)) {
		iteratableExpected.push({
			address,
			...expected[address],
		});
	}

	let [iActual, iExpected] = [0, 0];
	while (
		iActual < iteratableActual.length &&
		iExpected < iteratableExpected.length
	) {
		const actualAsset = iteratableActual[iActual];
		const aPricePerToken = actualAsset.value.div(actualAsset.balance);
		const expectedAsset = iteratableExpected[iExpected];
		const ePricePerToken = expectedAsset.value.div(expectedAsset.balance);

		if (actualAsset.value >= expectedAsset.delta) {
			const entry = {
				from: actualAsset.address,
				to: expectedAsset.address,
				amount: expectedAsset.delta.div(aPricePerToken),
			};
			swapBook.push(entry);

			actualAsset.balance = actualAsset.balance.sub(entry.amount);
			actualAsset.value = actualAsset.value.sub(expectedAsset.value);

			expectedAsset.balance = BigNumber.from(0);
			expectedAsset.value = BigNumber.from(0);
			expectedAsset.delta = BigNumber.from(0);

			iteratableActual[iActual] = actualAsset;
			iteratableExpected[iExpected] = expectedAsset;

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

		iteratableActual[iActual] = actualAsset;
		iteratableExpected[iExpected] = expectedAsset;

		iActual += 1;
	}

	if (iActual < iteratableActual.length) {
		// create WETH swap
	}

	if (iExpected < iteratableExpected.length) {
		// well shit. this shouldnt happen
	}

	return swapBook;
};
