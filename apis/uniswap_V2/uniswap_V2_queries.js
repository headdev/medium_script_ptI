/**
 * The following two functions create a query to be passed into uniswaps_V2 subgraph api to collect
 * all pools from a given time to the present.
 * The first query calls for the transaction volume in decdending order.
 * The second query calls for volume caluated in USD in decdending order.
 *
 * the last function makes a call for a single pool.
 */

function get_uniswap_transactions_volume_by_the_hour_V2({ setHours: time }) {
  let curr = new Date();
  curr.setHours(curr.getHours() - time);
  const hour = Math.floor(curr.getTime() / 1000);
  const queryStr = `{
    pairHourDatas(first: 1000, orderBy: hourlyTxns, orderDirection: desc, where: {hourStartUnix_gte:${hour}}){
      pair{
      id
      reserve0
      reserve1
      token0Price
      token1Price
      token0{
      symbol
      id
      decimals
      derivedETH
    }
    token1{
      symbol
      id
      decimals
      derivedETH
    }
    }
  }
  }`;

  const queryObj = {
    query: queryStr,
  };
  return queryObj;
}

function get_uniswap_usd_volume_by_the_hour_V2({ setHours: time }) {
  let curr = new Date();
  curr.setHours(curr.getHours() - time);
  const hour = Math.floor(curr.getTime() / 1000);

  const queryStr = `{
    pairHourDatas(first: 1000, orderBy: hourlyVolumeUSD, orderDirection: desc, where: {date_gte: ${hour}, volumeUSD_gt: 100000, reserveUSD_gt: 100000}){
      pair{
      id
      reserve0
      reserve1
      token0Price
      token1Price
      token0{
      symbol
      id
      decimals
      derivedETH
    }
    token1{
      symbol
      id
      decimals
      derivedETH
    }
    }
  }
  }`;

  const queryObj = {
    query: queryStr,
  };
  return queryObj;
}

function get_uniswap_last_swap_information_V2(address) {
  const queryStr = `
  {
    {
    swaps(first: 1, orderBy: timestamp, orderDirection: desc, where: { pair: "${address}" } ) {
      pair {
        token0 {
          symbol
          id
          decimals
        }
        token1 {
          symbol
          id
          decimals
        }
        token0Price
        token1Price
        reserve0
        reserve1
        id
      }
      amount0In
      amount0Out
      amount1In
      amount1Out
      amountUSD
      to
      timestamp
    }
  }
}
 `;
  const queryObj = {
    query: queryStr,
  };
  return queryObj;
}
function get_most_profitable_loan_pools_for_path_V2({
  tokenID: tokenID,
  poolAddress: poolAddress,
  poolAddress2: poolAddress2,
  poolAddress3: poolAddress3,
  token_number: token_number,
}) {
  const queryStr = `{
    pairs(first: 1, orderBy: reserveUSD, orderDirection: desc, where :{${token_number}:"${tokenID}", id_not_in: ["${poolAddress}", "${poolAddress2}", "${poolAddress3}"], reserveUSD_gt: 0}) { 
    id
    reserve0
    reserve1
    reserveUSD
    token0Price
    token1Price
    token0{
      symbol
      id
      decimals
      derivedETH
    }
    token1 {
      symbol
      id
      decimals
      derivedETH
    }
  }
  }`;

  const queryObj = {
    query: queryStr,
  };
  return queryObj;
}

module.exports = {
  get_uniswap_usd_volume_by_the_hour_V2,
  get_uniswap_transactions_volume_by_the_hour_V2,
  get_most_profitable_loan_pools_for_path_V2,
  get_uniswap_last_swap_information_V2,
};