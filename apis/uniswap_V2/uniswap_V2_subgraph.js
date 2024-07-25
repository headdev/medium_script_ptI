const axios = require('axios');

async function uniswapSubgraph_V2_Api(query) {
  try {

    const url = 'https://gateway-arbitrum.network.thegraph.com/api/6842087090c3e66bac508150e15a17a9/deployments/id/QmPzNmPLM9jM5AxPoAGJ37ZYF1NLrGopSVYzZz5FE6UDQw';
    const { data } = await axios.post(url, query);

    return data.data;
  } catch (error) {
    console.error('there was an issue with calling uniswap_v2 subGraph', error);
  }
}

module.exports = {
  uniswapSubgraph_V2_Api,
};
