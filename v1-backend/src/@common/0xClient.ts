import axios from "axios";

export const getPrice = async (address): Promise<string> => {
	if (address === "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48") return "1";

	const { data } = await axios.get(
		`https://api.0x.org/swap/v1/price?sellToken=${address}&buyToken=USDC&sellAmount=1000000000000000000`
	);

	return data.price;
};
