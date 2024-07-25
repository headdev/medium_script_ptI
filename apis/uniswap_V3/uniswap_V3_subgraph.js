const axios = require('axios');
const dotenv = require('dotenv')
dotenv.config();

async function uniswapSubgraph_V3_Api(query) {
  try {
    const url = 'https://gateway-arbitrum.network.thegraph.com/api/6842087090c3e66bac508150e15a17a9/deployments/id/QmdAaDAUDCypVB85eFUkQMkS5DE1HV4s7WJb6iSiygNvAw';
    const { data } = await axios.post(url, query);

    return data.data;
  } catch (error) {
    console.error('there was an issue with calling uniswap_v3 subGraph', error);
  }
}

module.exports = {
  uniswapSubgraph_V3_Api,
};
