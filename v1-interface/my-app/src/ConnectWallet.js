import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const ConnectWallet = () => {
	return <ConnectButton label="Connect" showBalance={false} />;
};

export default ConnectWallet;
