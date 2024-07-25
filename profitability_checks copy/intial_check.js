const {
  verfiy_token_path,
  uniswap_V2_sushiswap_swap_math,
  uniswap_V3_swap_math,
} = require('./utlis');

const { PRICE_PERCENTAGE_DIFFERENCE_THRESHOLD } = require('../constants');

function find_most_profitable_permutation(path) {
  console.log("Iniciando find_most_profitable_permutation con path:", JSON.stringify(path));
  
  let all_permutations_for_order = {
    price_percentage_difference: -Infinity,
    path: []
  };

  function find_permutations(path_array, temp) {
    if (!path_array.length) {
      const calculated_path_and_difference = calculate_percentage_difference_of_path(temp);
      console.log("Permutación calculada:", JSON.stringify(calculated_path_and_difference));
      
      if (calculated_path_and_difference.price_percentage_difference > all_permutations_for_order.price_percentage_difference) {
        all_permutations_for_order = calculated_path_and_difference;
      }
    } else {
      for (let i = 0; i < path_array.length; i++) {
        const current = path_array.splice(i, 1)[0];
        find_permutations(path_array, temp.concat(current));
        path_array.splice(i, 0, current);
      }
    }
  }

  find_permutations(path, []);

  console.log("Permutación más rentable encontrada:", JSON.stringify(all_permutations_for_order));
  return all_permutations_for_order;
}



function calculate_percentage_difference_of_path(path) {
  console.log("Calculando diferencia de porcentaje para path:", JSON.stringify(path));
  
  if (!verfiy_token_path(path)) {
    console.warn('Invalid token path:', JSON.stringify(path));
    return {
      price_percentage_difference: 0,
      path: path
    };
  }

  let input_amount = 1; // Comenzamos con 1 unidad del token inicial
  const initial_token = path[0].tokenIn.symbol;
  
  for (const step of path) {
    if (step.exchange === 'uniswapV3') {
      input_amount = uniswap_V3_swap_math(step, input_amount);
    } else {
      input_amount = uniswap_V2_sushiswap_swap_math(step, input_amount);
    }
    console.log(`Después del swap ${step.from_To}: cantidad = ${input_amount}`);
  }

  // Calculamos el profit porcentual
  const profit_percentage = ((input_amount - 1) / 1) * 100;

  console.log(`Profit calculado: ${profit_percentage.toFixed(4)}%`);
  
  return {
    price_percentage_difference: profit_percentage,
    path: path,
  };
}


function check_all_structured_paths(paths) {
  console.log("Número de paths recibidos en check_all_structured_paths:", paths.length);
  
  const inital_check_profitable_paths = [];

  for (const path of paths) {
    console.log("Procesando path:", JSON.stringify(path));
    const most_profitable_permutation = find_most_profitable_permutation(path.path);

    if (most_profitable_permutation.price_percentage_difference > PRICE_PERCENTAGE_DIFFERENCE_THRESHOLD) {
      most_profitable_permutation.token_ids = path.token_ids;
      most_profitable_permutation.pool_addresses = path.pool_addresses;
      inital_check_profitable_paths.push(most_profitable_permutation);
    }
  }
  
  console.log("Número de paths rentables encontrados:", inital_check_profitable_paths.length);
  return inital_check_profitable_paths;
}

module.exports = { check_all_structured_paths };
