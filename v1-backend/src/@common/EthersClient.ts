import { ethers } from "ethers";

interface Config {
	pk: string;
	alchemyApiKey: string;
}

export default class EthersClient {
	private static _provider;
	private static _wallet;
	private static _config: Config;

	private constructor(config: Config) {
		EthersClient._provider = new ethers.providers.AlchemyProvider(
			null,
			config.alchemyApiKey
		);
		EthersClient._wallet = new ethers.Wallet(
			config.pk,
			EthersClient._provider
		);
	}

	public static setConfig(config: Config) {
		EthersClient._config = config;
	}

	public static get provider() {
		if (!EthersClient._config) throw "No provider";
		return (
			EthersClient._provider ??
			(EthersClient._provider = new ethers.providers.AlchemyProvider(
				null,
				EthersClient._config.alchemyApiKey
			))
		);
	}

	public static get wallet() {
		if (!EthersClient._config) throw "No provider";
		return (
			EthersClient._wallet ??
			(EthersClient._wallet = new ethers.Wallet(
				EthersClient._config.pk,
				EthersClient.provider
			))
		);
	}
}
