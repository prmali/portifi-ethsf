import React from "react";
import ReactDOM from "react-dom/client";
import { Provider as UrqlProvider } from "urql";
import "@rainbow-me/rainbowkit/styles.css";
import {
	getDefaultWallets,
	RainbowKitProvider,
	darkTheme,
	midnightTheme,
} from "@rainbow-me/rainbowkit";
import { chain, configureChains, createClient, WagmiConfig } from "wagmi";
import { infuraProvider } from "wagmi/providers/infura";
import { publicProvider } from "wagmi/providers/public";

import "./index.css";
import "./daisy.css";
import UrqlClient from "./utils/UrqlClient";

import { VAULT_CONTRACT_ABI, VAULT_CONTRACT_ADDRESS } from "./constants";
import { Fragment } from "react";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { Bars3Icon, BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Chart from "react-apexcharts";
import { Tabs, InputNumber } from "antd";
import "./App.css";
import ConnectWallet from "./ConnectWallet";

const { chains, provider } = configureChains(
	[chain.localhost],
	[infuraProvider({ apiKey: "yourInfuraApiKey" }), publicProvider()]
);

const { connectors } = getDefaultWallets({
	appName: "PortiFi",
	chains,
});

const wagmiClient = createClient({
	autoConnect: true,
	connectors,
	provider,
});

const onChange = (value) => {
	console.log("changed", value);
};

const user = {
	name: "Tom Cook",
	email: "tom@example.com",
	imageUrl:
		"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
};
const navigation = [
	{ name: "Dashboard", href: "#", current: true },
	{ name: "Team", href: "#", current: false },
	{ name: "Projects", href: "#", current: false },
	{ name: "Calendar", href: "#", current: false },
	{ name: "Reports", href: "#", current: false },
];

const features = [
	{
		name: "VAULT RECEIVES DEPOSITS",
		description:
			"The vault receives wETH from depositors and invests 100% of its wETH balance in its weekly options strategy.",
	},
	{
		name: "ALGORITHMIC STRIKE SELECTION",
		description:
			"The vault algorithmically selects the optimal strike price for the ETH call options.",
	},
	{
		name: "VAULT MINTS OPTIONS",
		description:
			"Every Friday at 11am UTC, the vault mints European ETH call options by depositing its wETH balance as collateral in an Opyn vault. The vault sets the strike price to the value determined by its selection algorithm and the expiry date to the following Friday. In return, the vault receives oTokens from the Opyn vault, each of which represent an ETH call option.",
	},
	{
		name: "VAULT SELLS OPTIONS VIA GNOSIS AUCTION",
		description:
			"The vault sells the newly minted options via a Gnosis batch auction. The vault first sets a minimum price for the options and then opens up bidding to anyone in the world. Participants whose bid is greater than or equal to the final clearing price receive the auctioned oTokens.",
	},
	{
		name: "VAULT COLLECTS YIELDS",
		description:
			"The wETH earned from the Gnosis Auction is collected by the vault and represents the yield on this strategy.",
	},
	{
		name: "OPTIONS EXPIRE OTM",
		description:
			"At expiry, if the strike price is higher than the market price of ETH, the options expire out-of-the-money. In this situation the oTokens held by the option buyers expire worthless.",
	},
];

const userNavigation = [
	{ name: "Your Profile", href: "#" },
	{ name: "Settings", href: "#" },
	{ name: "Sign out", href: "#" },
];

/*Bar Graph*/
const options = {
	chart: {
		id: "basic-bar",
	},
	xaxis: {
		categories: [
			"Oct 31",
			"Nov 1",
			"Nov 2",
			"Nov 3",
			"Nov 4",
			"Nov 5",
			"Nov 6",
			"Nov 7",
		],
	},
};
const series = [
	{
		name: "Vault Balance",
		data: [20000, 19000, 22000, 28000, 33000, 27000, 29000, 34000],
		theme: {
			monochrome: {
				enabled: true,
				color: "#255aee",
				shadeTo: "light",
				shadeIntensity: 0.65,
			},
		},
	},
];

/*Donut Graph*/
const options2 = {
	labels: ["BTC", "ETH", "MATIC", "AVAX"],
	colors: ["#F7931A", "#5E78DE", "#7E43DA", "#DC3E3E"],
};
const series2 = [44, 55, 41, 17];
const labels2 = ["BTC", "ETH", "MATIC", "AVAX"];

function classNames(...classes) {
	return classes.filter(Boolean).join(" ");
}

/**
 * getEtherBalance: Retrieves the ether balance of the user or the contract
 */
export const getEtherBalance = async (provider, address, contract = false) => {
	try {
		// If the caller has set the `contract` boolean to true, retrieve the balance of
		// ether in the `exchange contract`, if it is set to false, retrieve the balance
		// of the user's address
		if (contract) {
			const balance = await provider.getBalance(VAULT_CONTRACT_ADDRESS);
			return balance;
		} else {
			const balance = await provider.getBalance(address);
			return balance;
		}
	} catch (err) {
		console.error(err);
		return 0;
	}
};

export default function Example() {
	return (
		<WagmiConfig client={wagmiClient}>
			<RainbowKitProvider
				chains={chains}
				initialChain={chain.goerli}
				theme={darkTheme()}
			>
				<UrqlProvider value={UrqlClient}>
					<div className="min-h-full">
						<Disclosure as="nav" className="bg-indigo-900">
							{({ open }) => (
								<>
									<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
										<div className="flex h-16 items-center justify-between">
											<div className="flex items-center">
												<div className="flex-shrink-0">
													<img
														className="h-8 w-8"
														src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=500"
														alt="PortiFi EthSf"
													/>
												</div>
												<div className="hidden md:block">
													<div className="ml-10 flex items-baseline space-x-4">
														{navigation.map(
															(item) => (
																<a
																	key={
																		item.name
																	}
																	href={
																		item.href
																	}
																	className={classNames(
																		item.current
																			? "bg-indigo-900 text-white"
																			: "text-gray-300 hover:bg-gray-700 hover:text-white",
																		"px-3 py-2 rounded-md text-sm font-medium"
																	)}
																	aria-current={
																		item.current
																			? "page"
																			: undefined
																	}
																>
																	{item.name}
																</a>
															)
														)}
													</div>
												</div>
											</div>
											<div className="hidden md:block">
												<div className="ml-4 flex items-center md:ml-6">
													<button
														type="button"
														className="rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
													>
														<span className="sr-only">
															View notifications
														</span>
														<BellIcon
															className="h-6 w-6"
															aria-hidden="true"
														/>
													</button>

													{/* Profile dropdown */}
													<Menu
														as="div"
														className="relative ml-3"
													>
														<div>
															<Menu.Button className="flex max-w-xs items-center rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
																<span className="sr-only">
																	Open user
																	menu
																</span>
																<img
																	className="h-8 w-8 rounded-full"
																	src={
																		user.imageUrl
																	}
																	alt=""
																/>
															</Menu.Button>
														</div>
														<Transition
															as={Fragment}
															enter="transition ease-out duration-100"
															enterFrom="transform opacity-0 scale-95"
															enterTo="transform opacity-100 scale-100"
															leave="transition ease-in duration-75"
															leaveFrom="transform opacity-100 scale-100"
															leaveTo="transform opacity-0 scale-95"
														>
															<Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
																{userNavigation.map(
																	(item) => (
																		<Menu.Item
																			key={
																				item.name
																			}
																		>
																			{({
																				active,
																			}) => (
																				<a
																					href={
																						item.href
																					}
																					className={classNames(
																						active
																							? "bg-gray-100"
																							: "",
																						"block px-4 py-2 text-sm text-gray-700"
																					)}
																				>
																					{
																						item.name
																					}
																				</a>
																			)}
																		</Menu.Item>
																	)
																)}
															</Menu.Items>
														</Transition>
													</Menu>
												</div>
											</div>
											<div className="-mr-2 flex md:hidden">
												{/* Mobile menu button */}
												<Disclosure.Button className="inline-flex items-center justify-center rounded-md bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
													<span className="sr-only">
														Open main menu
													</span>
													{open ? (
														<XMarkIcon
															className="block h-6 w-6"
															aria-hidden="true"
														/>
													) : (
														<Bars3Icon
															className="block h-6 w-6"
															aria-hidden="true"
														/>
													)}
												</Disclosure.Button>
											</div>
										</div>
									</div>

									<Disclosure.Panel className="md:hidden">
										<div className="space-y-1 px-2 pt-2 pb-3 sm:px-3">
											{navigation.map((item) => (
												<Disclosure.Button
													key={item.name}
													as="a"
													href={item.href}
													className={classNames(
														item.current
															? "bg-gray-900 text-white"
															: "text-gray-300 hover:bg-gray-700 hover:text-white",
														"block px-3 py-2 rounded-md text-base font-medium"
													)}
													aria-current={
														item.current
															? "page"
															: undefined
													}
												>
													{item.name}
												</Disclosure.Button>
											))}
										</div>
										<div className="border-t border-gray-700 pt-4 pb-3">
											<div className="flex items-center px-5">
												<div className="flex-shrink-0">
													<img
														className="h-10 w-10 rounded-full"
														src={user.imageUrl}
														alt=""
													/>
												</div>
												<div className="ml-3">
													<div className="text-base font-medium leading-none text-white">
														{user.name}
													</div>
													<div className="text-sm font-medium leading-none text-gray-400">
														{user.email}
													</div>
												</div>
												<button
													type="button"
													className="ml-auto flex-shrink-0 rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
												>
													<span className="sr-only">
														View notifications
													</span>
													<BellIcon
														className="h-6 w-6"
														aria-hidden="true"
													/>
												</button>
											</div>
											<div className="mt-3 space-y-1 px-2">
												{userNavigation.map((item) => (
													<Disclosure.Button
														key={item.name}
														as="a"
														href={item.href}
														className="block rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-gray-700 hover:text-white"
													>
														{item.name}
													</Disclosure.Button>
												))}
											</div>
										</div>
									</Disclosure.Panel>
								</>
							)}
						</Disclosure>

						{/*Dashboard Starts */}

						<main className="bg-gradient-to-r from-black to-indigo-900 md:grid-col-2 flex flex-row px-14 py-20">
							<div className="mx-auto my-auto w-screen h-screen max-w-7xl py-20 flex flex-row">
								{/* Replace with your content */}
								<div className="text-white px-4 py-10 sm:px-0 w-full">
									{/*Type of Strategy Header*/}
									<div className="container-sm rounded-lg w-36 h-14 border-4 py-3 my-3 text-center text-md">
										Type of Strategy
									</div>

									{/*Strategy Title*/}
									<div className="container-sm text-6xl py-4">
										WH4LE-W4TCHING
									</div>

									{/*Vault Deposits and Bar*/}
									<div className="py-4">
										<div className="flex col-2">
											<div className=" text-lg mr-auto">
												Current Vault Deposits
											</div>
											<div className="space-x-reverse">
												626.42 wETH
											</div>
										</div>

										<br></br>
										<progress
											className="progress progress-info bg-gray-600 w-5/6 h-4 my-3"
											value="80"
											max="100"
										></progress>
										<br></br>
										<div className="flex col-2">
											<div className=" text-lg mr-auto">
												Max Vault Capacity
											</div>
											<div className="flex">
												5,000.00 wETH
											</div>
										</div>
									</div>
								</div>

								{/* /End replace */}
							</div>

							{/*Deposit and Withdraw (check the constants at the top to edit contents of tabs)*/}
							<div className="flex flex-row rounded-xl m-auto w-2/3 h-7/8 my-0 items-center gap-y-16 gap-x-8 mx-10 my-12 sm:px-6 sm:py-20 items-center justify-center">
								<Tabs className="text-white content-center place-content-center justify-self-center bg-gray-900 border-4 border-cyan-400 backdrop-opacity-70 bg-blend-soft-light rounded-md w-full h-full">
									{/*Deposit Function*/}
									<Tabs.TabPane
										className="text-xl text-white w-full content-center px-10"
										tab="DEPOSIT"
										key="deposit"
									>
										<div className="d-flex flex-column p-4 w-100">
											<div className="font-bold">
												AMOUNT (ETH)
											</div>
											<div class="my-4 w-full">
												<InputNumber
													className="w-5/6"
													min={1}
													max={10000}
													defaultValue={3}
													onChange={onChange}
												/>
											</div>
											<div className="flex col-2">
												<div className="text-lg mr-auto">
													Wallet Balance{" "}
												</div>
												<div className="text-lg space-x-reverse">
													0 ETH
												</div>
											</div>
											<button
												type="button"
												class="w-full mt-4 btn py-3 mb-0 hover:bg-white hover:text-cyan-500"
											>
												Connect Wallet
											</button>
											<div className="w-full mt-4 btn py-3 mb-0 hover:bg-white hover:text-cyan-500">
												<a>CONTRACT: 0XA1DA...5EDF</a>
											</div>
										</div>
									</Tabs.TabPane>

									{/*Withdraw Function*/}
									<Tabs.TabPane
										className="text-xl text-white w-full content-center px-10"
										tab="WITHDRAW"
										key="withdraw"
									>
										<div class=" text-white d-flex flex-column p-4 w-100 content-center justify-center">
											<div>
												<div className="text-xl font-bold">
													AMOUNT (wETH)
												</div>
												<div class="my-4 w-full">
													<InputNumber
														min={1}
														max={10000}
														defaultValue={3}
														onChange={onChange}
													/>
												</div>
												<button
													type="button"
													className="w-full mt-4 btn py-3 mb-0 hover:bg-white hover:text-cyan-500"
												>
													Connect Wallet
												</button>
											</div>
											<div className="w-full mt-4 btn py-3 mb-0 hover:bg-white hover:text-cyan-500">
												<a>CONTRACT: 0XA1DA...5EDF</a>
											</div>
										</div>
									</Tabs.TabPane>
								</Tabs>
							</div>
						</main>
					</div>

					{/*Body Section*/}

					<div className="bg-white">
						{/*Vault Strategy*/}
						<div className="mx-auto px-40 md:grid-col-2 flex flex-row px-14">
							<div className="mx-auto w-screen h-screen max-w-7xl py-20">
								<h2 className="py-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
									Vault Strategy
								</h2>
								<p className="mt-4 text-gray-500">
									The vault earns yield on its wETH deposits
									by running a weekly automated wETH covered
									call strategy where it stakes its wETH
									deposits in and then uses its to
									collateralize weekly out-of-money wETH call
									options. The yield earned from both the
									covered call strategy and the wETH staking
									rewards are reinvested weekly, effectively
									compounding the yields for depositors over
									time.
								</p>

								<dl className="mt-16 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 sm:gap-y-16 lg:gap-x-8">
									{features.map((feature) => (
										<div
											key={feature.name}
											className="border-t border-gray-200 pt-4"
										>
											<dt className="font-medium text-gray-900">
												{feature.name}
											</dt>
											<dd className="mt-2 text-sm text-gray-500">
												{feature.description}
											</dd>
										</div>
									))}
								</dl>
							</div>

							{/*Charts*/}
							<div className="mx-auto my-auto w-screen h-full max-w-7xl py-20 px-20 grid-rows-2 gap-4 sm:gap-6 lg:gap-8">
								<div className="container-lg">
									<div className="app">
										<div className="col-2">
											<div className="mixed-chart py-20">
												<div className="text-lg font-bold py-4">
													Vault Balance (last 7 days)
												</div>
												<Chart
													className="color-cyan-500"
													options={options}
													series={series}
													type="area"
													width="500"
												/>
											</div>
											<div className="donut">
												<div className="text-lg font-bold py-4">
													Asset Allocation
												</div>
												<Chart
													options={options2}
													series={series2}
													labels={labels2}
													type="donut"
													width="380"
												/>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</UrqlProvider>
			</RainbowKitProvider>
		</WagmiConfig>
	);
}
