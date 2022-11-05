import "source-map-support/register";

import { getProtocols } from "../@common";

export const lambdaHandler = async (event, context) => {
	return await getProtocols();
};
