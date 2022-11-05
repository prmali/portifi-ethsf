import { Network } from "alchemy-sdk";
import { ethers } from "ethers";

import AlchemyClient from "../@common/AlchemyClient";
import EthersClient from "../@common/EthersClient";
import generatePortfolioDiff from "../@common/generatePortfolioDiff";
import getSecrets, { Secrets } from "../@common/getSecrets";

const address = "0xbA842b7DA417Ba762D75e8F99e11c2980a8F8051";
const vaultAddress = "0xbA842b7DA417Ba762D75e8F99e11c2980a8F8051";

export const lambdaHandler = async (event, context) => {
	const creds = await getSecrets(process.env.MAIN_SECRETS);

	EthersClient.setConfig({
		pk: creds.PRIVATE_KEY,
		alchemyApiKey: creds.ALCHEMY_API_KEY,
	});

	AlchemyClient.setConfig({
		network: Network.ETH_MAINNET,
		apiKey: creds.ALCHEMY_API_KEY,
	});

	const [provider, wallet] = [EthersClient.provider, EthersClient.wallet];
	const alchemyClient = AlchemyClient.client;

	// const balances = await alchemyClient.core.getTokenBalances(address);
	// return balances;

	const diffSet = await generatePortfolioDiff(
		address,
		vaultAddress,
		alchemyClient
	);

	if (diffSet.length === 0) {
		return;
	}

	// get vault mapping to strat n create contract instance
	const contract = new ethers.Contract(vaultAddress, "abi", wallet);
	// invoke strat
	const executeTxn = await contract.execute(
		ethers.utils.AbiCoder.prototype.encode(
			["tuple(string, uint256, string)[]"],
			[diffSet]
		),
		{
			// value, gasPrice
		}
	);

	console.log("[SUBMITTED TXN]", executeTxn);
	await executeTxn.wait();
	console.log("[PROCESSED TXN]", executeTxn);
};
