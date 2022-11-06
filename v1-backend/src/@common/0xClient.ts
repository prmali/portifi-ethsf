import axios from "axios";

export const getPrice = async (address): Promise<string> => {
	const { data } = await axios.get(
		`https://api.0x.org/swap/v1/price?sellToken=${address}&buyToken=USDC&sellAmount=1000000000000000000`
	);

	return data.price;
};
