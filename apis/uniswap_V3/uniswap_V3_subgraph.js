const axios = require('axios');


async function uniswapSubgraph_V3_Api(query) {
  try {
    const url = 'https://api.thegraph.com/subgraphs/id/QmdAaDAUDCypVB85eFUkQMkS5DE1HV4s7WJb6iSiygNvAw';
    const { data } = await axios.post(url, query);

    return data.data;
  } catch (error) {
    console.error('there was an issue with calling uniswap_v3 subGraph', error);
  }
}

module.exports = {
  uniswapSubgraph_V3_Api,
};
