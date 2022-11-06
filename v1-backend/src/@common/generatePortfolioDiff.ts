import { BigNumber, utils } from "ethers";
import { Alchemy, NftExcludeFilters, NftTokenType } from "alchemy-sdk";
import { getPrice } from "./0xClient";
import estimateValue from "./estimateValue";
import swapOptimizer from "./swapOptimizer";
import sleep from "./sleep";

const MIN_COMP = utils.parseEther("0.04"); // Must be at least 4%

export type Portfolio = {
	[key: string]: {
		tokenType: TokenTypeEnum;
		tokenIds?: string[];
		balance: BigNumber;
		value?: BigNumber;
		ratio?: BigNumber;
	};
};

enum TokenTypeEnum {
	ERC20,
	ERC721,
	ERC1155,
}

export enum ActionEnum {
	BUY,
	SELL,
}

interface PreDiffEntry {
	tokenType: TokenTypeEnum;
	balance: BigNumber;
}

export interface Difference {
	tokenType: TokenTypeEnum;
	delta: BigNumber;
	action: ActionEnum;
	price?: BigNumber;
	address: string;
}

interface Expected {
	tokenType: TokenTypeEnum;
	balance: BigNumber;
	value: BigNumber;
	delta: BigNumber;
}

let priceMappings: { [key: string]: BigNumber } = {};

// load assets from an account and standardize
const standardizePortfolio = async (
	account: string,
	alchemyClient: Alchemy
): Promise<{ portfolio: Portfolio; networth: BigNumber }> => {
	let portfolio: Portfolio = {};
	let networth: BigNumber = BigNumber.from(0);
	const tokenBalances = (
		await alchemyClient.core.getTokenBalances(account)
	).tokenBalances.filter((token) => token.tokenBalance !== "0");

	await Promise.all(
		tokenBalances.map(async (token) => {
			console.log(`Processing ${token.contractAddress}`);
			let balance: any = token.tokenBalance;

			// Get metadata of token
			const metadata = await alchemyClient.core.getTokenMetadata(
				token.contractAddress
			);

			// Compute token balance in human-readable format
			balance = balance / Math.pow(10, metadata.decimals);
			balance = balance.toFixed(2);

			try {
				const price = await getPrice(token.contractAddress);
				if (price === "0" || balance == 0 || token.error) {
					return;
				}

				priceMappings[token.contractAddress] = utils.parseEther(price);

				const value = estimateValue(
					priceMappings[token.contractAddress],
					balance
				);

				portfolio[token.contractAddress] = {
					tokenType: TokenTypeEnum.ERC20,
					value,
					balance,
				};

				networth = networth.add(value);
			} catch (error) {
				if (error.statusCode === 400) {
					console.error(error.message);
				} else {
					//return error;
				}
			} finally {
				await sleep(500);
			}
		})
	);

	// wipe small token comp
	for (let contractAddress of Object.keys(portfolio)) {
		const ratio = utils
			.parseUnits(portfolio[contractAddress].value.toString(), 18)
			.div(networth);

		if (ratio.lt(MIN_COMP)) {
			delete portfolio[contractAddress];
			continue;
		}

		portfolio[contractAddress].ratio = ratio;
	}

	return { portfolio, networth };
};

const correlatePortfolio = (
	basePortfolio,
	vaultPortfolio
): { [key: string]: Expected } => {
	let expectedPortfolio = {};

	for (let tokenAddress of Object.keys(basePortfolio.portfolio)) {
		const dataObj = {
			tokenType: basePortfolio.portfolio[tokenAddress].tokenType,
			// token count
			balance: utils.formatEther(
				BigNumber.from(
					vaultPortfolio.networth
						.mul(basePortfolio.portfolio[tokenAddress].ratio)
						.div(utils.parseEther("1"))
				)
			),
			// in usd
			value: null,
			delta: null,
		};

		dataObj.value = utils.formatEther(
			estimateValue(
				priceMappings[tokenAddress],
				dataObj.balance.toString()
			)
		);

		dataObj.delta = dataObj.value;

		expectedPortfolio[tokenAddress] = { ...dataObj };
	}

	return expectedPortfolio;
};

// transform on proportion
// margin of error -> if jump street position increases or decreases within range, no action

interface StandardizedPortfolio {
	portfolio: Portfolio;
	networth: BigNumber;
}

export default async (
	baseAddress: string, // account we build strategy around
	vaultAddress: string, // vault
	alchemyClient: Alchemy
): Promise<any> => {
	const account1Portfolio: StandardizedPortfolio = await standardizePortfolio(
		baseAddress,
		alchemyClient
	);

	const account2Portfolio: StandardizedPortfolio = await standardizePortfolio(
		vaultAddress,
		alchemyClient
	);

	const expectedPortfolio = correlatePortfolio(
		account1Portfolio,
		account2Portfolio
	);

	// let x = {};

	// for (let key of Object.keys(expectedPortfolio)) {
	// 	x[key] = {
	// 		balance: expectedPortfolio[key].balance.toString(),
	// 		value: expectedPortfolio[key].value.toString(),
	// 		delta: expectedPortfolio[key].delta.toString(),
	// 	};
	// }

	// return x;

	return swapOptimizer(
		account2Portfolio.portfolio as any,
		expectedPortfolio as any
	);
};

/* 
get portfolio of stalk account (ST) ✔️
get portfolio of vault (V) ✔️

find ratio of ST tokens, pick top ✔️
Add ST ratio to V ✔️
Add delta in USD ✔️
Move V tokens not in ST ratio to ST ratio tokens
*/
