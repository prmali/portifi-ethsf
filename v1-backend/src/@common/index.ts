import axios from "axios";

export const getProtocols = async () => {
	const { data } = await axios.get("https://api.llama.fi/protocols");
	return data;
};
