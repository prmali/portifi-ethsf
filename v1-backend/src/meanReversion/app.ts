import "source-map-support/register";

import { getProtocols, getCurrentPrices } from "../@common/LlamaClient";

export const lambdaHandler = async (event, context) => {
	return await getCurrentPrices([
		"0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
	]);
	//return await getProtocols();
};
