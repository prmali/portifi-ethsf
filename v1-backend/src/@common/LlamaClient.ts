import axios from "axios";

export const getProtocols = async () => {
	const { data } = await axios.get("https://api.llama.fi/protocols");
	return data;
};

export const getCurrentPrices = async (addresses: string[]) => {
	const addressString = addresses.reduce(
		(prev, curr) => prev + `,ethereum:${curr}`,
		"coingecko:ethereum"
	);

	const { data } = await axios.get(
		`https://coins.llama.fi/prices/current/${addressString}`
	);

	return data;
};
