function get_sushi_swap_transactions_volume_by_the_hour({ setHours: time }) {
  let curr = new Date();
  curr.setHours(curr.getHours() - time);
  const hour = Math.floor(curr.getTime() / 1000);
  const queryStr = `{
    pairHourDatas(first: 1000, orderBy: txCount, orderDirection: desc, where: {date_gte: ${hour}, volumeUSD_gt: 50000, reserveUSD_gt: 50000}) {
      pair {
        id
        reserve0
        reserve1
        token0Price
        token1Price
        token0 {
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
    }
  }`;

  const queryObj = {
    query: queryStr,
  };
  return queryObj;
}

function get_sushi_swap_usd_volume_by_the_hour({ setHours: time }) {
  let curr = new Date();
  curr.setHours(curr.getHours() - time);
  const hour = Math.floor(curr.getTime() / 1000);

  const queryStr = `{
    pairHourDatas(first: 1000, orderBy: volumeUSD, orderDirection: desc, where: {date_gte: ${hour}, volumeUSD_gt: 100000, reserveUSD_gt: 100000}) {
      pair {
        id
        reserve0
        reserve1
        token0Price
        token1Price
        token0 {
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
    }
  }`;

  const queryObj = {
    query: queryStr,
  };
  return queryObj;
}

function get_sushi_swap_most_profitable_loan_pools_for_path({
  tokenID: tokenID,
  poolAddress: poolAddress,
  poolAddress2: poolAddress2,
  poolAddress3: poolAddress3,
  token_number: token_number,
}) {
  const queryStr = `{
    pairs(first: 1, orderBy: reserveUSD, orderDirection: desc, where :{
      ${token_number}:"${tokenID}",
      id_not_in: ["${poolAddress}", "${poolAddress2}", "${poolAddress3}"],
      reserveUSD_gt: 50000,
      volumeUSD_gt: 50000
    }) {
      id
      reserve0
      reserve1
      reserveUSD
      token0Price
      token1Price
      token0 {
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

function get_sushi_swap_last_swap_information(address) {
  const queryStr = `{
    swaps(first: 1, orderBy: timestamp, orderDirection: desc, where:
      { pair: "${address}" } ) {
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
  }`;
  const queryObj = {
    query: queryStr,
  };
  return queryObj;
}

module.exports = {
  get_sushi_swap_usd_volume_by_the_hour,
  get_sushi_swap_transactions_volume_by_the_hour,
  get_sushi_swap_last_swap_information,
  get_sushi_swap_most_profitable_loan_pools_for_path,
};