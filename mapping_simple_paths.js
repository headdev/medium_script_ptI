const Graph = require('./graph_library/Graph').default;
const GraphVertex = require('./graph_library/GraphVertex').default;
const GraphEdge = require('./graph_library/GraphEdge').default;
const bellmanFord = require('./dist/bellman-ford').default;

const { FEE_TEIR_PERCENTAGE_OBJECT, MIN_PROFIT_TO_CONSIDER_FOR_ON_CHAIN_CALL } = require('./constants');

function get_multiple_objects_for_mapping(
  exchangeObject,
  pairUUID = {},
  poolAddresses = {},
  poolInfo = {}
) {
  for (const pair of exchangeObject) {
    if (!pair || !pair.token0 || !pair.token1) {
      console.warn('Skipping invalid pair:', pair);
      continue;
    }

    const key1 = `${pair.token0.id}-${pair.token1.id}`;
    const key2 = `${pair.token1.id}-${pair.token0.id}`;

    pairUUID[pair.token0.id] = pairUUID[pair.token0.id] || new Set();
    pairUUID[pair.token0.id].add(pair.token1.id);
    pairUUID[pair.token1.id] = pairUUID[pair.token1.id] || new Set();
    pairUUID[pair.token1.id].add(pair.token0.id);

    poolAddresses[key1] = poolAddresses[key1] || new Set();
    poolAddresses[key1].add(pair.id);
    poolAddresses[key2] = poolAddresses[key2] || new Set();
    poolAddresses[key2].add(pair.id);

    poolInfo[pair.id] = pair;
  }

  return [pairUUID, poolAddresses, poolInfo];
}

function build_graph(poolAddresses, poolInfo) {
  const graph = new Graph();
  let edgeCount = 0;

  for (const key in poolAddresses) {
    const [from, to] = key.split('-');
    if (!from || !to) {
      console.warn('Invalid key:', key);
      continue;
    }
    if (!graph.getVertexByKey(from)) graph.addVertex(new GraphVertex(from));
    if (!graph.getVertexByKey(to)) graph.addVertex(new GraphVertex(to));

    poolAddresses[key].forEach(poolId => {
      const pool = poolInfo[poolId];
      if (!pool || !pool.token1Price) {
        console.warn('Invalid pool:', poolId);
        return;
      }

      const fromVertex = graph.getVertexByKey(from);
      const toVertex = graph.getVertexByKey(to);
      
      const weight = -Math.log(parseFloat(pool.token1Price));
      
      const edge = new GraphEdge(
        fromVertex,
        toVertex,
        weight,
        parseFloat(pool.token1Price),
        { exchange: pool.exchange, fee: pool.fee, poolId: poolId }
      );

      try {
        graph.addEdge(edge);
        edgeCount++;
      } catch (error) {
        console.warn(`Failed to add edge from ${from} to ${to}: ${error.message}`);
      }
    });
  }

  console.log(`Grafo construido con ${graph.getAllVertices().length} vértices y ${edgeCount} edges`);
  return graph;
}

function findArbitrageOpportunities(graph) {
  const vertices = graph.getAllVertices();
  const allCyclePaths = new Set();
  const maxCycles = 1000;
  
  for (const startVertex of vertices) {
    if (allCyclePaths.size >= maxCycles) break;
    
    const cycles = findCyclesFromVertex(graph, startVertex, 3, 6);
    for (const cycle of cycles) {
      if (allCyclePaths.size >= maxCycles) break;
      
      const cycleKey = cycle.join('_');
      if (!allCyclePaths.has(cycleKey)) {
        allCyclePaths.add(cycleKey);
        console.log("Nuevo ciclo válido encontrado:", cycle);
      }
    }
  }
  
  console.log(`Encontrados ${allCyclePaths.size} ciclos potenciales únicos en total`);
  return Array.from(allCyclePaths).map(cycleKey => cycleKey.split('_'));
}


function findCyclesFromVertex(graph, startVertex, minLength, maxLength) {
  const cycles = [];
  const path = [startVertex];
  
  function dfs(currentVertex, depth) {
    if (depth >= minLength - 1 && depth < maxLength) {
      if (graph.findEdge(currentVertex, startVertex)) {
        cycles.push([...path.map(v => v.getKey()), startVertex.getKey()]);
      }
    }
    
    if (depth >= maxLength - 1) return;
    
    for (const neighbor of graph.getNeighbors(currentVertex)) {
      if (!path.includes(neighbor) && neighbor !== startVertex) {
        path.push(neighbor);
        dfs(neighbor, depth + 1);
        path.pop();
      }
    }
  }
  
  dfs(startVertex, 0);
  return cycles;
}

function findCyclesOfLength(graph, startVertex, length) {
  const cycles = [];
  const path = [startVertex];
  
  function dfs(currentVertex, depth) {
    if (depth === length - 1) {
      if (graph.findEdge(currentVertex, startVertex)) {
        cycles.push(path.map(v => v.getKey()));
      }
      return;
    }
    
    for (const neighbor of graph.getNeighbors(currentVertex)) {
      if (!path.includes(neighbor)) {
        path.push(neighbor);
        dfs(neighbor, depth + 1);
        path.pop();
      }
    }
  }
  
  dfs(startVertex, 0);
  return cycles;
}

function formatPath(cycle, graph, poolInfo) {
  console.log("Formateando path:", cycle);
  
  const path_info = [];
  for (let i = 0; i < cycle.length - 1; i++) {
    const from = cycle[i];
    const to = cycle[i + 1];
    const edge = graph.findEdge(graph.getVertexByKey(from), graph.getVertexByKey(to));
    
    if (!edge || !edge.metadata || !edge.metadata.poolId) {
      console.warn('Invalid edge:', from, to);
      continue;
    }

    const pool = poolInfo[edge.metadata.poolId];
    if (!pool || !pool.token0 || !pool.token1) {
      console.warn('Invalid pool:', edge.metadata.poolId);
      continue;
    }

    path_info.push({
      from_To: `${pool.token0.symbol} to ${pool.token1.symbol}`,
      tokenIn: pool.token0,
      tokenOut: pool.token1,
      price: edge.rawWeight,
      exchange: edge.metadata.exchange,
      id: edge.metadata.poolId,
      fee: edge.metadata.fee
    });
  }
  
  console.log("Path info generado:", path_info.length);
  
  return {
    path: path_info,
    token_ids: cycle.slice(0, -1),
    pool_addresses: path_info.map(p => p.id)
  };
}


function produce_simple_exchange_paths(exchangeObject) {
  console.log("Número de pools recibidos:", exchangeObject.length);
  
  if (exchangeObject.length === 0) {
    console.log("No se recibieron pools. No se pueden generar paths.");
    return null;
  }

  const [pairUUID, poolAddresses, poolInfo] = get_multiple_objects_for_mapping(exchangeObject);
  console.log("Número de pares únicos:", Object.keys(pairUUID).length);
  console.log("Número de direcciones de pool:", Object.keys(poolAddresses).length);
  
  const graph = build_graph(poolAddresses, poolInfo);
  console.log("Número de vértices en el grafo:", graph.getAllVertices().length);

  const cycles = findArbitrageOpportunities(graph);
  console.log("Número de ciclos únicos encontrados:", cycles.length);

  const simple_paths = [];
  const maxPathsToProcess = 1000;

  for (const cycle of cycles) {
    if (simple_paths.length >= maxPathsToProcess) break;
    
    console.log("Procesando ciclo:", cycle);
    const formatted_path = formatPath(cycle, graph, poolInfo);
    if (formatted_path.path.length > 0) {
      const profitPercentage = calculateProfit(formatted_path.path, graph);
      console.log("Profit calculado para el ciclo:", profitPercentage.toFixed(2) + "%");
      formatted_path.profit = profitPercentage;
      simple_paths.push(formatted_path);
    }
  }

  console.log("Número de paths triangulares válidos generados:", simple_paths.length);
  return { graph, simple_paths };
}


function calculateProfit(path, graph) {
  console.log("Calculando profit para path:", path.map(p => `${p.tokenIn.symbol} -> ${p.tokenOut.symbol}`).join(' -> '));
  let profit = 1;
  for (let i = 0; i < path.length; i++) {
    const from = path[i].tokenIn.id;
    const to = path[i].tokenOut.id;
    const edge = graph.findEdge(graph.getVertexByKey(from), graph.getVertexByKey(to));
    if (!edge) {
      console.warn(`No se encontró el borde entre ${from} y ${to}`);
      return 0;
    }
    const rate = Math.exp(-edge.weight);
    const fee = FEE_TEIR_PERCENTAGE_OBJECT[path[i].fee] || 0;
    const adjustedRate = rate * (1 - fee);
    profit *= adjustedRate;
    console.log(`Paso ${i + 1}: from=${from}, to=${to}, rate=${rate}, fee=${fee}, adjustedRate=${adjustedRate}, profit actual=${profit}`);
  }
  const profitPercentage = (profit - 1) * 100;
  console.log(`Profit final calculado: ${profitPercentage.toFixed(2)}%`);
  return profitPercentage;
}


function filterProfitablePaths(paths, graph) {
  return paths.filter(path => {
    const profitPercentage = calculateProfit(path.path, graph);
    return profitPercentage > MIN_PROFIT_TO_CONSIDER_FOR_ON_CHAIN_CALL;
  });
}

module.exports = {
  produce_simple_exchange_paths,
  filterProfitablePaths,
  calculateProfit,
  findArbitrageOpportunities  // Asegúrate de que esta línea esté presente
};