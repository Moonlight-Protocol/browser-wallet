/**
 * Generates a cryptographically secure random bigint in the range [min, max] (inclusive).
 * Uses crypto.getRandomValues under the hood.
 */
function randomIntInRangeBigInt(min: bigint, max: bigint): bigint {
  if (min > max) {
    throw new Error("min must be <= max");
  }
  if (min === max) {
    return min;
  }

  const range = max - min + 1n;
  const bitsNeeded = range.toString(2).length;
  const bytesNeeded = Math.ceil(bitsNeeded / 8);
  const maxValid = (1n << BigInt(bitsNeeded)) - 1n;

  // Rejection sampling to guarantee a uniform distribution
  let randomValue: bigint;
  do {
    const randomBytes = new Uint8Array(bytesNeeded);
    crypto.getRandomValues(randomBytes);

    // Convert bytes to bigint
    randomValue = 0n;
    for (let i = 0; i < randomBytes.length; i++) {
      randomValue = (randomValue << 8n) | BigInt(randomBytes[i]);
    }

    // Apply mask to limit to the desired range
    randomValue = randomValue & maxValid;
  } while (randomValue >= range);

  return min + randomValue;
}

/**
 * Partitions a total amount into N random parts, guaranteeing that:
 * - Each part >= minPerPart
 * - Sum of parts == total
 * - Distribution is random to improve privacy
 *
 * @param total - Total amount to partition
 * @param partsCount - Number of parts to generate
 * @param options - Partitioning options
 * @returns Array of bigint with the partitioned values
 */
export function partitionAmountRandom(
  total: bigint,
  partsCount: number,
  options?: { minPerPart?: bigint },
): bigint[] {
  const minPerPart = options?.minPerPart ?? 1n;

  // Basic validations
  if (partsCount <= 0) {
    throw new Error("partsCount must be > 0");
  }
  if (total < 0n) {
    throw new Error("total must be >= 0");
  }
  if (minPerPart < 0n) {
    throw new Error("minPerPart must be >= 0");
  }

  // Special case: only one part
  if (partsCount === 1) {
    return [total];
  }

  // Validate that we have enough total amount
  const minTotal = minPerPart * BigInt(partsCount);
  if (total < minTotal) {
    throw new Error(
      `Insufficient total: need at least ${minTotal}, got ${total}`,
    );
  }

  // Compute remaining amount after reserving the minimum for each part
  const remaining = total - minTotal;

  // If there's nothing left to distribute, return all parts as minPerPart
  if (remaining === 0n) {
    return new Array(partsCount).fill(minPerPart);
  }

  // Generate random weights for each part
  // Use range [1, 1000] to get a reasonably smooth distribution
  const weights: number[] = [];
  let sumWeights = 0;

  for (let i = 0; i < partsCount; i++) {
    const weight = Number(randomIntInRangeBigInt(1n, 1000n));
    weights.push(weight);
    sumWeights += weight;
  }

  // Distribuir o remaining proporcionalmente aos pesos
  const amounts: bigint[] = [];
  let assignedExtra = 0n;

  for (let i = 0; i < partsCount; i++) {
    // Extra amount proportional to the weight
    const extra = (remaining * BigInt(weights[i])) / BigInt(sumWeights);
    amounts.push(minPerPart + extra);
    assignedExtra += extra;
  }

  // Handle leftover from integer division
  const remainderExtra = remaining - assignedExtra;
  if (remainderExtra > 0n) {
    // Distribute the leftover randomly among parts
    const remainderCount = Number(remainderExtra);
    const indices = new Set<number>();

    // Generate unique random indices to receive +1
    while (indices.size < remainderCount && indices.size < partsCount) {
      const idx = Number(
        randomIntInRangeBigInt(0n, BigInt(partsCount - 1)),
      );
      indices.add(idx);
    }

    // Add +1 to the selected indices
    for (const idx of indices) {
      amounts[idx] += 1n;
    }
  }

  return amounts;
}
