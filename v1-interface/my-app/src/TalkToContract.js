import { useContractWrite, usePrepareContractWrite } from "wagmi";

function App() {
	const { config } = usePrepareContractWrite({
		address: "0xecb504d39723b0be0e3a9aa33d646642d1051ee1",
		abi: wagmigotchiABI,
		functionName: "feed",
	});
	const { data, isLoading, isSuccess, write } = useContractWrite(config);

	return (
		<div>
			<button disabled={!write} onClick={() => write?.()}>
				Feed
			</button>
			{isLoading && <div>Check Wallet</div>}
			{isSuccess && <div>Transaction: {JSON.stringify(data)}</div>}
		</div>
	);
}
