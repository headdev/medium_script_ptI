function verfiy_token_path(path) {
  console.log("Verificando token path:", JSON.stringify(path));
  
  if (!Array.isArray(path) || path.length !== 3) {
    console.warn('Invalid path structure:', JSON.stringify(path));
    return false;
  }

  const [pool_1, pool_2, pool_3] = path;

  if (!pool_1 || !pool_2 || !pool_3 || 
      !pool_1.token0 || !pool_1.token1 || 
      !pool_2.token0 || !pool_2.token1 || 
      !pool_3.token0 || !pool_3.token1) {
    console.warn('Invalid pool structure in path:', JSON.stringify(path));
    return false;
  }

  const pool_1_token_0 = pool_1.token0.id;
  const pool_1_token_1 = pool_1.token1.id;
  const pool_2_token_0 = pool_2.token0.id;
  const pool_2_token_1 = pool_2.token1.id;
  const pool_3_token_0 = pool_3.token0.id;
  const pool_3_token_1 = pool_3.token1.id;

  const pool_1_token_in =
    pool_1_token_0 === pool_3_token_0 || pool_1_token_0 === pool_3_token_1
      ? pool_1_token_0
      : pool_1_token_1;

  const pool_1_token_out =
    pool_1_token_in === pool_1_token_0 ? pool_1_token_1 : pool_1_token_0;

  const pool_2_token_in = pool_1_token_out;
  const pool_2_token_out =
    pool_2_token_in === pool_2_token_0 ? pool_2_token_1 : pool_2_token_0;

  const pool_3_token_in = pool_2_token_out;
  const pool_3_token_out = pool_1_token_in;

  // Verificar que los tokens forman un ciclo válido
  if (pool_1_token_out !== pool_2_token_in || 
      pool_2_token_out !== pool_3_token_in || 
      pool_3_token_out !== pool_1_token_in) {
    console.warn('Invalid token sequence in path:', JSON.stringify(path));
    return false;
  }

  pool_1.token_in = pool_1_token_in;
  pool_1.token_out = pool_1_token_out;
  pool_2.token_in = pool_2_token_in;
  pool_2.token_out = pool_2_token_out;
  pool_3.token_in = pool_3_token_in;
  pool_3.token_out = pool_3_token_out;

  return true;
}

function uniswap_V3_swap_math(pool, amount) {
  const token_0 = pool.token_in === pool.token0.id;
  const q96 = 2n ** 96n;
  const token_0_decimals = 10n ** BigInt(pool.token0.decimals);
  const token_1_decimals = 10n ** BigInt(pool.token1.decimals);
  const liquidity = BigInt(pool.liquidity);
  const current_sqrt_price = BigInt(pool.sqrtPrice);

  function calc_amount0(liq, pa, pb) {
    if (pa > pb) {
      [pa, pb] = [pb, pa];
    }
    return Number((liq * q96 * (pb - pa)) / pb / pa);
  }

  function calc_amount1(liq, pa, pb) {
    if (pa > pb) {
      [pa, pb] = [pb, pa];
    }
    return Number((liq * (pb - pa)) / q96);
  }

  if (token_0) {
    const amount_in = BigInt(Math.floor(amount * Number(token_0_decimals)));
    const price_next = (liquidity * q96 * current_sqrt_price) / (liquidity * q96 + amount_in * current_sqrt_price);

    const output = calc_amount1(
      Number(liquidity),
      Number(price_next),
      Number(current_sqrt_price)
    );

    return output / Number(token_1_decimals);
  } else {
    const amount_in = BigInt(Math.floor(amount * Number(token_1_decimals)));
    const price_diff = (amount_in * q96) / liquidity;
    const price_next = price_diff + current_sqrt_price;

    const output = calc_amount0(
      Number(liquidity),
      Number(price_next),
      Number(current_sqrt_price)
    );
    return output / Number(token_0_decimals);
  }
}

function uniswap_V2_sushiswap_swap_math(pool, amount) {
  const token_in_reserves =
    pool.token_in === pool.token0.id
      ? Number(pool.reserve0)
      : Number(pool.reserve1);

  const token_out_reserves =
    pool.token_out === pool.token0.id
      ? Number(pool.reserve0)
      : Number(pool.reserve1);

  const fee = 0.997; // 0.3% fee
  const amount_in_with_fee = amount * fee;
  const numerator = amount_in_with_fee * token_out_reserves;
  const denominator = token_in_reserves + amount_in_with_fee;
  const calculated_amount = numerator / denominator;

  return calculated_amount;
}

function calculate_profit(path, initial_amount = 1) {
  let amount = initial_amount;
  
  for (const pool of path) {
    if (pool.exchange === 'uniswapV3') {
      amount = uniswap_V3_swap_math(pool, amount);
    } else {
      amount = uniswap_V2_sushiswap_swap_math(pool, amount);
    }
    console.log(`After ${pool.exchange} swap: ${amount}`);
  }

  const profit = amount - initial_amount;
  const profit_percentage = (profit / initial_amount) * 100;

  return {
    final_amount: amount,
    profit: profit,
    profit_percentage: profit_percentage
  };
}

module.exports = {
  verfiy_token_path,
  uniswap_V2_sushiswap_swap_math,
  uniswap_V3_swap_math,
  calculate_profit
};