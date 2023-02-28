/**
 * The following two functions create a query to be passed into uniswaps_V2 subgraph api to collect
 * all pools from a given time to the present.
 * The first query calls for the transaction volume in decdending order.
 * The second query calls for volume caluated in USD in decdending order.
 *
 * the last function makes a call for a single pool.
 */

function get_sushi_swap_transactions_volume_by_the_hour({ setHours: time }) {
  let curr = new Date();
  curr.setHours(curr.getHours() - time);
  const hour = Math.floor(curr.getTime() / 1000);
  const queryStr = `{
    pairHourDatas(first: 1000, orderBy: txCount,orderDirection: desc, where: {date_gte: ${hour}}){
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

function get_sushi_swap_usd_volume_by_the_hour({ setHours: time }) {
  let curr = new Date();
  curr.setHours(curr.getHours() - time);
  const hour = Math.floor(curr.getTime() / 1000);

  const queryStr = `{
    pairHourDatas(first: 1000, orderBy: volumeUSD,orderDirection: desc, where: {date_gte: ${hour}}){
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

module.exports = {
  get_sushi_swap_usd_volume_by_the_hour,
  get_sushi_swap_transactions_volume_by_the_hour,
};