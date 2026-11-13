export type CreditPack = {
  id: string;
  name: string;
  credits: number;
  /** Paystack charge in kobo. 990000 is ₦9,900. */
  priceMinor: number;
  currency: "NGN";
  priceLabel: string;
  blurb: string;
};

/** The only pack sold in this version. The Paystack account charges NGN. */
export const PACK_PRICE_MINOR = 990_000;
export const PACK_PRICE_LABEL = "₦9,900";
export const PACK_PRICE_BUTTON = `Get 5 tailorings for ${PACK_PRICE_LABEL}`;

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: "pack_5",
    name: "Five tailorings",
    credits: 5,
    priceMinor: PACK_PRICE_MINOR,
    currency: "NGN",
    priceLabel: PACK_PRICE_LABEL,
    blurb: "One payment. Five resume tailorings. Nothing renews.",
  },
];

export function getPack(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((pack) => pack.id === id);
}
