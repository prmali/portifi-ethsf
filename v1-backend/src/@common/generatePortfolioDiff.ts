import { BigNumber } from "ethers";
import { Alchemy, NftExcludeFilters, NftTokenType } from "alchemy-sdk";

export type Portfolio = {
	[key: string]: {
		tokenType: TokenTypeEnum;
		tokenIds?: string[];
		balance: BigNumber;
	};
};

enum TokenTypeEnum {
	ERC20,
	ERC721,
	ERC1155,
}

enum ActionEnum {
	BUY,
	SELL,
}

interface PreDiffEntry {
	tokenType: TokenTypeEnum;
	balance: BigNumber;
}

interface Difference {
	tokenType: TokenTypeEnum;
	balance: BigNumber;
	action: ActionEnum;
}

interface SwapBook {
	from: string;
	to: string;
	amount: BigNumber;
}

// load assets from an account and standardize
const standardizePortfolio = async (
	account: string,
	alchemyClient: Alchemy
): Promise<Portfolio> => {
	let portfolio: Portfolio = {};
	(await alchemyClient.core.getTokenBalances(account)).tokenBalances.map(
		(asset) => {
			portfolio[asset.contractAddress] = {
				tokenType: TokenTypeEnum.ERC20,
				balance: BigNumber.from(asset.tokenBalance),
			};
		}
	);
	// pagination. Maybe take most valuable NFTs and ^. idfk
	// ^ is this really even an issue
	// hover a fn and cmd + left click to nav to type def
	const nfts = (
		await alchemyClient.nft.getNftsForOwner(account, {
			// we dont want nfts marked as spam
			excludeFilters: [NftExcludeFilters.SPAM],
		})
	).ownedNfts;

	for (let nft of nfts) {
		if (nft.contract.tokenType !== NftTokenType.ERC721) {
			continue;
		}

		if (!portfolio[nft.contract.address]) {
			portfolio[nft.contract.address] = {
				tokenType: TokenTypeEnum.ERC721,
				tokenIds: [],
				balance: BigNumber.from(0),
			};
		}

		portfolio[nft.contract.address].tokenIds.push(nft.tokenId);
		portfolio[nft.contract.address].balance.add(BigNumber.from(1));
	}

	return portfolio;
};

// transform on proportion
// minimum proporation -> jump trading must have at least x % of asset in order for us to consider
// margin of error -> if jump street position increases or decreases within range, no action

export default async (
	account1: string, // account we build strategy around
	account2: string, // vault
	alchemyClient: Alchemy
): Promise<Difference[]> => {
	let preDiffSet: {
		[key: string]: PreDiffEntry;
	} = {};
	let diffSet: Difference[] = [];
	const account1Portfolio = await standardizePortfolio(
		account1,
		alchemyClient
	);
	const account2Portfolio = await standardizePortfolio(
		account2,
		alchemyClient
	);

	// 2 things we can do here. 1) we can call it a done deal and bundle up account1 portfolio and submit that to our strategy
	// I went ahead and implemented option 2, which - indifferent. Option 2 lays out explicit actions the contract needs to take. super robotic

	// load positions
	for (let address of Object.keys(account1Portfolio)) {
		preDiffSet[address] = {
			tokenType: account1Portfolio[address].tokenType,
			balance: account1Portfolio[address].balance,
		};
	}

	for (let address of Object.keys(account2Portfolio)) {
		// sell aaaaallllllllll
		if (!preDiffSet[address]) {
			diffSet.push({
				tokenType: account2Portfolio[address].tokenType,
				balance: account2Portfolio[address].balance,
				action: ActionEnum.SELL,
			});

			continue;
		}

		// no change. perpect
		if (
			preDiffSet[address].balance.eq(account2Portfolio[address].balance)
		) {
			continue;
		}

		// must get more assets in vault
		if (
			preDiffSet[address].balance.gt(account2Portfolio[address].balance)
		) {
			diffSet.push({
				tokenType: preDiffSet[address].tokenType,
				balance: preDiffSet[address].balance.sub(
					account2Portfolio[address].balance
				),
				action: ActionEnum.BUY,
			});

			continue;
		}

		// need to release some assets in vault /shrug
		diffSet.push({
			tokenType: preDiffSet[address].tokenType,
			balance: account2Portfolio[address].balance.sub(
				preDiffSet[address].balance
			),
			action: ActionEnum.SELL,
		});
	}

	return diffSet;
};
