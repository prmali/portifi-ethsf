import { createClient } from "urql";

import { SUBGRAPH_URL } from "constants/urls.js";

const Client = createClient({
	url: SUBGRAPH_URL,
});

export default Client;
