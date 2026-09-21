export type GemType = "joker" | "diamond" | "ruby" | "sapphire" | "emerald" | "onyx";

export const GEM_TYPES: GemType[] = ["joker", "diamond", "ruby", "sapphire", "emerald", "onyx"];

export const GEM_META: Record<GemType, { label: string; color: string }> = {
  joker: { label: "Joker", color: "var(--color-gem-joker)" },
  diamond: { label: "Diamond", color: "var(--color-gem-diamond)" },
  ruby: { label: "Ruby", color: "var(--color-gem-ruby)" },
  sapphire: { label: "Sapphire", color: "var(--color-gem-sapphire)" },
  emerald: { label: "Emerald", color: "var(--color-gem-emerald)" },
  onyx: { label: "Onyx", color: "var(--color-gem-onyx)" },
};

export type GemInventory = Record<GemType, number>;

export function emptyInventory(): GemInventory {
  return { joker: 0, diamond: 0, ruby: 0, sapphire: 0, emerald: 0, onyx: 0 };
}

/**
 * Checks how much of a prize recipe an inventory satisfies, using Joker
 * gems as wildcards to fill any shortfall. Returns whether it's fully
 * redeemable, and per-type progress for the "3/4 collected" style UI.
 */
export function matchRecipe(
  inventory: GemInventory,
  recipe: Partial<Record<GemType, number>>
) {
  let jokersAvailable = inventory.joker;
  let jokersNeeded = 0;
  const perType: { type: GemType; have: number; need: number }[] = [];
  let totalHave = 0;
  let totalNeed = 0;

  for (const [type, need] of Object.entries(recipe) as [GemType, number][]) {
    if (type === "joker") continue; // jokers are handled as the wildcard pool below
    const have = Math.min(inventory[type], need);
    perType.push({ type, have, need });
    totalHave += have;
    totalNeed += need;
    if (have < need) jokersNeeded += need - have;
  }

  // Jokers required directly by the recipe come first, then spare jokers fill gaps.
  const directJokerNeed = recipe.joker ?? 0;
  totalNeed += directJokerNeed;
  const jokersForDirect = Math.min(jokersAvailable, directJokerNeed);
  totalHave += jokersForDirect;
  jokersAvailable -= jokersForDirect;

  const jokersForGaps = Math.min(jokersAvailable, jokersNeeded);
  totalHave += jokersForGaps;

  return {
    canRedeem: totalHave >= totalNeed,
    totalHave: Math.min(totalHave, totalNeed),
    totalNeed,
    perType,
    jokersUsed: jokersForDirect + jokersForGaps,
  };
}

/**
 * Deducts a recipe from an inventory, using jokers to cover any shortfall.
 * Assumes matchRecipe(...).canRedeem was already true.
 */
export function consumeRecipe(
  inventory: GemInventory,
  recipe: Partial<Record<GemType, number>>
): GemInventory {
  const next = { ...inventory };
  let jokerDebt = 0;

  for (const [type, need] of Object.entries(recipe) as [GemType, number][]) {
    if (type === "joker") continue;
    const take = Math.min(next[type], need);
    next[type] -= take;
    jokerDebt += need - take;
  }

  const directJoker = recipe.joker ?? 0;
  next.joker -= directJoker + jokerDebt;
  return next;
}
