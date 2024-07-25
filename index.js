const { 
  produce_simple_exchange_paths, 
  filterProfitablePaths, 
  calculateProfit,
  findArbitrageOpportunities  
} = require('./mapping_simple_paths');
const { get_all_defi_liquidty_pools, determine_loan_pools_of_path } = require('./apis');
const { profitablity_checks, check_all_structured_paths } = require('./profitability_checks/index');
const {
  TIME_FRAME_FOR_SUBGRAPH_ONE_HOUR,
  TIME_FRAME_FOR_SUBGRAPH_FOUR_HOURS,
  TIME_FRAME_FOR_SUBGRAPH_SIX_HOURS,
} = require('./constants');

async function init() {
  try {
    console.log("Iniciando el proceso de búsqueda de oportunidades de arbitraje...");

    const defi_array_of_objects = await get_all_defi_liquidty_pools(
      TIME_FRAME_FOR_SUBGRAPH_SIX_HOURS
    );
    console.log("Pools obtenidos:", defi_array_of_objects.length);

    if (!defi_array_of_objects || defi_array_of_objects.length === 0) {
      console.log("No se obtuvieron pools. Verifica la función get_all_defi_liquidty_pools.");
      return;
    }

    const { graph, simple_paths } = produce_simple_exchange_paths(defi_array_of_objects);
    console.log("Paths generados:", simple_paths.length);

    if (simple_paths.length === 0) {
      console.log("No se encontraron paths potencialmente rentables.");
      return;
    }

    // Aplicar el chequeo inicial de estructura
    const profitable_opportunities_initial_check = check_all_structured_paths(simple_paths);
    console.log("Oportunidades después del chequeo inicial:", profitable_opportunities_initial_check.length);

    if (profitable_opportunities_initial_check.length === 0) {
      console.log("No se encontraron oportunidades después del chequeo inicial de estructura.");
      return;
    }

    const path_and_loan_pools = [];

    for (const { path, token_ids, pool_addresses } of profitable_opportunities_initial_check) {
      try {
        const loan_pools = await determine_loan_pools_of_path(token_ids, pool_addresses);
        path_and_loan_pools.push({ path: path, loan_pools: loan_pools });
      } catch (error) {
        console.error(`Error al determinar loan pools para path: ${token_ids.join(' -> ')}`, error);
      }
    }

    console.log(`Número de oportunidades de arbitraje potenciales después del chequeo inicial: ${path_and_loan_pools.length}`);

    if (path_and_loan_pools.length === 0) {
      console.log("No se encontraron oportunidades de arbitraje potenciales después de determinar los loan pools.");
      return;
    }

    // Realizar verificaciones de rentabilidad
    const profitable_paths = await profitablity_checks(path_and_loan_pools);

    console.log(`Número de oportunidades de arbitraje rentables: ${profitable_paths.length}`);

    if (profitable_paths.length === 0) {
      console.log("No se encontraron oportunidades de arbitraje rentables después de las verificaciones de rentabilidad.");
      return;
    }

    // Imprimir detalles de las oportunidades rentables
    profitable_paths.forEach((opportunity, index) => {
      console.log(`Oportunidad ${index + 1}:`);
      console.log(`  Beneficio (USD): ${opportunity.profit_usd?.toFixed(2)}`);
      console.log(`  Cantidad óptima: ${opportunity.optimal_amount}`);
      console.log(`  Cantidad de entrada en USD: ${opportunity.usd_input_amount?.toFixed(2)}`);
      console.log(`  Ruta: ${opportunity.path.map(p => p.from_To).join(' -> ')}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error en la función init:', error);
  } finally {
    console.log("Proceso de búsqueda de oportunidades de arbitraje finalizado.");
  }
}