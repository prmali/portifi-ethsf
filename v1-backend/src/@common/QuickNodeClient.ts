import { ethers } from "ethers";

interface Config {
	endpointName: string;
	token: string;
}

export default class QuickNodeClient {
	private static _client: ethers.providers.JsonRpcProvider;
	private static _config: Config;

	private constructor(config: Config) {
		QuickNodeClient._config = config;
		QuickNodeClient._client = new ethers.providers.JsonRpcProvider(
			`http://${config.endpointName}.network.quiknode.pro/${config.token}/`
		);
	}

	public static setConfig(config: Config) {
		QuickNodeClient._config = config;
	}

	public static get client() {
		if (!QuickNodeClient._config) throw "No config";
		return (
			QuickNodeClient._client ??
			(QuickNodeClient._client = new ethers.providers.JsonRpcProvider(
				`http://${QuickNodeClient._config.endpointName}.network.quiknode.pro/${QuickNodeClient._config.token}/`
			))
		);
	}
}
