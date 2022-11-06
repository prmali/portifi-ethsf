import { Network, Alchemy } from "alchemy-sdk";

interface Config {
	apiKey: string;
	network: Network;
}

export default class AlchemyClient {
	private static _client: Alchemy;
	private static _config: Config;

	private constructor(config: Config) {
		AlchemyClient._client = new Alchemy(AlchemyClient._config);
	}

	public static setConfig(config: Config) {
		AlchemyClient._config = config;
	}

	public static get client() {
		if (!AlchemyClient._config) throw "No config";
		return (
			AlchemyClient._client ??
			(AlchemyClient._client = new Alchemy(AlchemyClient._config))
		);
	}
}
