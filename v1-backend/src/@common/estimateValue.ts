import { BigNumber, utils } from "ethers";

export default (price: BigNumber, balance: string): BigNumber => {
	const amount = utils.formatEther(price.mul(utils.parseEther(balance)));

	return BigNumber.from(amount.slice(0, amount.indexOf(".") - amount.length));
};
