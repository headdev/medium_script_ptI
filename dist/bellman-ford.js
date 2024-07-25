"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = bellmanFord;

/**
 * @param {Graph} graph
 * @param {GraphVertex} startVertex
 * @return {{distances, previousVertices, cyclePaths}}
 */
function bellmanFord(graph, startVertex) {
    const distances = {};
    const previousVertices = {};
    let cyclePaths = [];

    // Inicialización
    graph.getAllVertices().forEach((vertex) => {
        distances[vertex.getKey()] = vertex.getKey() === startVertex.getKey() ? 0 : Infinity;
        previousVertices[vertex.getKey()] = null;
    });

    console.log(`Iniciando Bellman-Ford desde el vértice: ${startVertex.getKey()}`);

    // Relajación de edges
    const vertices = graph.getAllVertices();
    for (let i = 0; i < vertices.length - 1; i++) {
        let hasChange = false;
        graph.getAllEdges().forEach((edge) => {
            const newDistance = distances[edge.startVertex.getKey()] + edge.weight;
            if (newDistance < distances[edge.endVertex.getKey()] - 1e-10) {
                distances[edge.endVertex.getKey()] = newDistance;
                previousVertices[edge.endVertex.getKey()] = edge.startVertex;
                hasChange = true;
            }
        });
        if (!hasChange) {
            console.log(`No se detectaron cambios en la iteración ${i + 1}. Terminando temprano.`);
            break;
        }
    }

    // Detección de ciclos negativos
    console.log('Buscando ciclos negativos...');
    graph.getAllEdges().forEach((edge) => {
        if (distances[edge.startVertex.getKey()] + edge.weight < distances[edge.endVertex.getKey()] - 1e-10) {
            console.log(`Potencial ciclo negativo detectado desde ${edge.startVertex.getKey()} a ${edge.endVertex.getKey()}`);
            const cycle = detectCycle(edge.startVertex, previousVertices);
            if (cycle) {
                console.log(`Ciclo negativo confirmado: ${cycle.join(' -> ')}`);
                cyclePaths.push(cycle);
            }
        }
    });

    console.log(`Se encontraron ${cyclePaths.length} ciclos negativos.`);

    return {
        distances,
        previousVertices,
        cyclePaths
    };
}

function detectCycle(startVertex, previousVertices) {
    const visited = new Set();
    const cycle = [];
    let currentVertex = startVertex;

    while (currentVertex && !visited.has(currentVertex.getKey())) {
        visited.add(currentVertex.getKey());
        cycle.push(currentVertex.getKey());
        currentVertex = previousVertices[currentVertex.getKey()];
    }

    if (currentVertex && cycle.includes(currentVertex.getKey())) {
        const cycleStartIndex = cycle.indexOf(currentVertex.getKey());
        return cycle.slice(cycleStartIndex);
    }

    return null;
}