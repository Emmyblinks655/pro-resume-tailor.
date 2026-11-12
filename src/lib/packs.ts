export type CreditPack = {
  id: string;
  name: string;
  credits: number;
  priceUsd: number;
  priceLabel: string;
  blurb: string;
};

/** The only pack sold in this version. More one-time packs can be added later. */
export const CREDIT_PACKS: CreditPack[] = [
  {
    id: "pack_5",
    name: "Five tailorings",
    credits: 5,
    priceUsd: 9,
    priceLabel: "$9",
    blurb: "One payment. Five resume tailorings. Nothing renews.",
  },
];

export function getPack(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((pack) => pack.id === id);
}
