'use strict';
require('colors');
const BigNumber = require('bignumber.js');
const fetch = require('node-fetch');
const process = require('process');
const ethers = require('ethers');
const { createQueryString } = require('./utils');

const API_QUOTE_URL = 'https://api.0x.org/swap/v1/quote';
const { abi: ERC20_ABI } = require('../out/IERC20.sol/IERC20.json');

const dotenv = require('dotenv');

dotenv.config();
const { RPC_URL, LOCAL_RPC_URL, TAKER_PRIVATE_KEY, FORKED } = process.env;

require('yargs')
  .parserConfiguration({ 'parse-numbers': false })
  .command(
    '*',
    'directly fill a token0 -> token1 swap quote from 0x API',
    (yargs) => {
      return yargs
        .option('token0', {
          alias: 't0',
          type: 'string',
          describe: 'address of the token0 contract',
          default: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
        })
        .option('token1', {
          alias: 't1',
          type: 'string',
          describe: 'address of the token1 contract',
          default: '0x514910771AF9Ca656af840dff83E8264EcF986CA', // LDO
        })
        .option('sellAmount', {
          alias: 'sA',
          type: 'number',
          describe: 'Amount of token0 to sell (in token units)',
          default: 2000000000,
        });
    },
    async (argv) => {
      try {
        await swap(argv);
        process.exit(0);
      } catch (err) {
        console.error(err);
        process.exit(1);
      }
    }
  ).argv;

async function swap(argv) {
  console.log('argv', argv);

  const signer = new ethers.Wallet(TAKER_PRIVATE_KEY).connect(new ethers.providers.JsonRpcProvider(RPC_URL));

  const token0 = new ethers.Contract(argv.token0, ERC20_ABI, signer);
  const token1 = new ethers.Contract(argv.token1, ERC20_ABI, signer);

  const vault = new ethers.Contract(argv.token0, ERC20_ABI, signer);

  console.info(`Deposit ${argv.sellAmount} of token0 from the vault`);

  // Track our token1 balance.
  const t1StartingBal = await token1.balanceOf(signer.address);
  const t0symbol = await token0.symbol();
  const t1symbol = await token1.symbol();
  console.log(t1symbol, 'with starting balance: ', t1StartingBal);

  // Get a quote from 0x-API to sell the WETH we just minted.
  console.info(`Fetching swap quote from 0x-API to sell ${argv.sellAmount} ${t0symbol} for ${t1symbol}...`);
  const qs = createQueryString({
    sellToken: argv.token0,
    buyToken: argv.token1,
    sellAmount: argv.sellAmount,
    // 0x-API cannot perform taker validation in forked mode.
    ...(FORKED ? {} : { takerAddress: vault.address }),
  });
  const quoteUrl = `${API_QUOTE_URL}?${qs}`;
  console.info(`Fetching quote ${quoteUrl.bold}...`);
  const response = await fetch(quoteUrl);
  const quote = await response.json();
  console.info(`Received a quote with price ${quote.price}`);

  // Grant the allowance target an allowance to spend our token0.
  const approveTx = await (
    await token0.approve(quote.allowanceTarget, quote.sellAmount, {
      gasLimit: 1000000,
    })
  ).wait();

  // Fill the quote.
  console.info(`Filling the quote directly...`);
  const tx = {
    from: signer.address,
    to: quote.to,
    data: quote.data,
    value: quote.value,
    gasPrice: quote.gasPrice,
    // 0x-API cannot estimate gas in forked mode.
    ...(FORKED ? {} : { gas: quote.gas }),
  };

  // 6. Sign and send tx - wait for receipt
  const createReceipt = await signer.sendTransaction(tx);

  // Detect balances changes.
  const boughtAmount = weiToEther(new BigNumber(await dai.methods.balanceOf(taker).call()).minus(daiStartingBalance));
  console.info(
    `${'✔'.bold.green} Successfully sold ${argv.sellAmount.toString().bold} ${t0symbol} for ${
      boughtAmount.bold.green
    } ${t1symbol}!`
  );
  // The taker now has `boughtAmount` of token1!
}
