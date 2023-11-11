import process from "process";

function createQueryString(params) {
	return Object.entries(params)
		.map(([k, v]) => `${k}=${v}`)
		.join("&");
}

export { createQueryString };
