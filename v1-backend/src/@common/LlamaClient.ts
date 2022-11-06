import axios from 'axios';

export const getProtocols = async () => {
  const { data } = await axios.get('https://api.llama.fi/protocols');
  return data;
};

export const getCurrentPrices = async (addresses: string[]) => {
  const addressString = addresses.reduce(
    (prev, curr) => prev + `,ethereum:${curr}`,
    'coingecko:ethereum'
  );

  const { data } = await axios.get(
    `https://coins.llama.fi/prices/current/${addressString}`
  );
  let mapElem = {};
  for (let key in data['coins'])
    mapElem[data['coins'][key]['symbol']] = data['coins'][key];

  return mapElem;
};

export const getHistoricalPrices = async (
  addresses: string[],
  lookback: number,
  samples: number
) => {
  const addressString = addresses.reduce(
    (prev, curr) => prev + `,ethereum:${curr}`,
    'coingecko:ethereum'
  );

  const timestamp = Date.now() / 1000;
  const interval = (lookback * 86400) / samples;
  console.log(timestamp);

  let result = [];

  for (let i = 1; i < samples + 1; i++) {
    const { data } = await axios.get(
      `https://coins.llama.fi/prices/historical/${
        timestamp - i * interval
      }/${addressString}`
    );
    let mapElem = {};
    for (let key in data['coins'])
      mapElem[data['coins'][key]['symbol']] = data['coins'][key];
    result.push(mapElem);
  }

  return result;
};
