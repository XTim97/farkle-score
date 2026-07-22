export type ComboKey =
  | "single1"
  | "single5"
  | "triple1"
  | "triple2"
  | "triple3"
  | "triple4"
  | "triple5"
  | "triple6"
  | "fourOfAKind"
  | "fiveOfAKind"
  | "sixOfAKind"
  | "fullHouse"
  | "threePairs"
  | "fourOfAKindPlusPair"
  | "twoTriplets"
  | "smallStraight"
  | "largeStraight";

export interface ComboDef {
  key: ComboKey;
  label: string;
  points: number;
  diceUsed: number;
}

export const COMBOS: readonly ComboDef[] = [
  { key: "single1", label: "Single 1", points: 100, diceUsed: 1 },
  { key: "single5", label: "Single 5", points: 50, diceUsed: 1 },
  { key: "triple1", label: "Three 1s", points: 300, diceUsed: 3 },
  { key: "triple2", label: "Three 2s", points: 200, diceUsed: 3 },
  { key: "triple3", label: "Three 3s", points: 300, diceUsed: 3 },
  { key: "triple4", label: "Three 4s", points: 400, diceUsed: 3 },
  { key: "triple5", label: "Three 5s", points: 500, diceUsed: 3 },
  { key: "triple6", label: "Three 6s", points: 600, diceUsed: 3 },
  { key: "fourOfAKind", label: "Four of a Kind", points: 1000, diceUsed: 4 },
  { key: "fiveOfAKind", label: "Five of a Kind", points: 2000, diceUsed: 5 },
  { key: "sixOfAKind", label: "Six of a Kind", points: 3000, diceUsed: 6 },
  { key: "fullHouse", label: "Full House", points: 850, diceUsed: 5 },
  { key: "threePairs", label: "Three Pairs", points: 1500, diceUsed: 6 },
  { key: "fourOfAKindPlusPair", label: "Four of a Kind + Pair", points: 1500, diceUsed: 6 },
  { key: "twoTriplets", label: "Two Triplets", points: 2500, diceUsed: 6 },
  { key: "smallStraight", label: "Small Straight", points: 850, diceUsed: 5 },
  { key: "largeStraight", label: "Large Straight", points: 1500, diceUsed: 6 }
];

export const comboByKey: ReadonlyMap<ComboKey, ComboDef> = new Map(
  COMBOS.map((c) => [c.key, c])
);
