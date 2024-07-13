/* eslint-disable no-unused-vars */
const axios = require('axios');
const dotenv = require('dotenv')
dotenv.config();





async function sushiswapSubgraph_Api(query) {
  try {
    const url = 'https://gateway-arbitrum.network.thegraph.com/api/${process.env.THEGRAPH_API_KEY}/subgraphs/id/CKaCne3uUUEqT7Ei9jjZbQqTLntEno9LnFa4JnsqqBma';
    const { data } = await axios.post(url, query);

    return data.data;
  } catch (error) {
    console.error('there was an issue with calling uniswap subGraph', error);
  }
}

module.exports = { sushiswapSubgraph_Api };






async function axios_call(query) {
  try {
    const url = 'end point here';
    const { data } = await axios.post(url, query);

    return data
  } catch (error) {
    console.error(error);
  }
}