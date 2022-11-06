import 'source-map-support/register';

import { Network } from 'alchemy-sdk';
import { ethers } from 'ethers';

import AlchemyClient from '../@common/AlchemyClient';
import EthersClient from '../@common/EthersClient';
import generatePortfolioDiff, {
    standardizePortfolio,
} from '../@common/generatePortfolioDiff';
import getSecrets, { Secrets } from '../@common/getSecrets';

const vaultAddress = '0xbA842b7DA417Ba762D75e8F99e11c2980a8F8051';

import {
    getProtocols,
    getCurrentPrices,
    getHistoricalPrices,
} from '../@common/LlamaClient';
import { ConfigurationServicePlaceholders } from 'aws-sdk/lib/config_service_placeholders';
import { PublicGalleryAuthorizationToken } from 'aws-cdk-lib/aws-ecr';

const topTen = [
    '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
    '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
    '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
    '0x514910771af9ca656af840dff83e8264ecf986ca',
    '0x5a98fcbea516cf06857215779fd812ca3bef1b32',
    '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
    '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
    '0xc944e90c64b2c07662a292be6244bdf05cda44a7',
    '0xd533a949740bb3306d119cc777fa900ba034cd52',
    '0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0',
    '0xc18360217d8f7ab5e7c516566761ea12ce7f9d72',
];

export const lambdaHandler = async (event, context) => {
    const creds = await getSecrets(process.env.MAIN_SECRETS);

    EthersClient.setConfig({
        pk: creds.PRIVATE_KEY,
        alchemyApiKey: creds.ALCHEMY_API_KEY,
    });

    AlchemyClient.setConfig({
        network: Network.ETH_MAINNET,
        apiKey: creds.ALCHEMY_API_KEY,
    });

    const [provider, wallet] = [EthersClient.provider, EthersClient.wallet];
    const alchemyClient = AlchemyClient.client;

    const samples = 10;
    const current = await getCurrentPrices(topTen);
    const historical = await getHistoricalPrices(
        topTen,
        10 /* days */,
        samples
    );
    const threshold = 0.1;
    const swapAmounts = await getSwapAmounts(
        historical,
        current,
        samples,
        threshold,
        alchemyClient
    );

    // get vault mapping to strat n create contract instance
    const contract = new ethers.Contract(vaultAddress, 'abi', wallet);
    // invoke strat
    const executeTxn = await contract
        .execute
        // ethers.utils.AbiCoder.prototype.encode(
        //     ['tuple(string, uint256, string)[]'],
        //     [diffSet]
        // ),
        // {
        //     // value, gasPrice
        // }
        ();

    console.log('[SUBMITTED TXN]', executeTxn);
    await executeTxn.wait();
    console.log('[PROCESSED TXN]', executeTxn);
};

const getSwapAmounts = async (
    historical,
    current,
    samples,
    threshold,
    alchemyClient
) => {
    // Get price window average
    let averagePrices = new Map();
    for (let token in current) {
        averagePrices[token] = 0;
    }

    for (let entry in historical) {
        for (let symbol in historical[entry]) {
            let obj = historical[entry][symbol];
            averagePrices[obj['symbol']] += obj['price'];
        }
    }

    // Create percentage delta map between MA window and current
    let assetDeltas = [];
    for (let token in averagePrices) {
        averagePrices[token] /= samples;
        console.log(current[token]);
        const currentPrice = current[token]['price'];
        assetDeltas.push([
            (averagePrices[token] - currentPrice) / averagePrices[token],
            token,
        ]);
    }
    assetDeltas.sort(sortByFirst);

    console.log(assetDeltas);
    const averageReturn =
        assetDeltas.reduce((prev, curr) => {
            return (prev += curr[0]);
        }, 0) / assetDeltas.length;
    console.log('average return: ', averageReturn);

    if (Math.abs(assetDeltas[0] - assetDeltas[assetDeltas.length - 1]))
        return [];

    // TODO: revisit mean reversion algo

    /*
      diff = (return - averageReturn)/(1+return)
      amountNeeded = diff * price

      trivial approach is to swap excess to usdc, then swap those to relevant assets
    */
    const account = '';
    const accountPortfolio = await standardizePortfolio(account, alchemyClient);
    assetDeltas.map((entry) => {
        const ret = entry[0];
        const ticker = entry[1];
        const usdcOutPer: number =
            ((ret - averageReturn) / (1 + ret)) * current[ticker]['price'];
        const usdcOut = usdcOutPer * accountPortfolio[ticker]['balance'];
        return [usdcOut, ticker];
    });
    assetDeltas.sort(sortByFirst);
    console.log(assetDeltas);

    let totalTrades = [];
    assetDeltas.forEach((entry) => {
        totalTrades.push([entry[1], 'USDC', entry[0]]);
    });

    console.log(totalTrades);

    return totalTrades;
};

const sortByFirst = (first, second) => {
    if (first[0] < second[0]) return -1;
    else if (first[0] > second[0]) return 1;
    else return 0;
};
