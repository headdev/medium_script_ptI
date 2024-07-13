const axios = require('axios');

async function uniswapSubgraph_V2_Api(query) {
  try {

    const url = 'https://api.studio.thegraph.com/query/70625/uniswapv2/v0.0.1';
    const { data } = await axios.post(url, query);

    return data.data;
  } catch (error) {
    console.error('there was an issue with calling uniswap_v2 subGraph', error);
  }
}

module.exports = {
  uniswapSubgraph_V2_Api,
};
