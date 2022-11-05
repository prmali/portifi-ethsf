import "source-map-support/register";

import { getProtocols } from "../@common/LlamaClient";

export const lambdaHandler = async (event, context) => {
	return await getProtocols();
};
