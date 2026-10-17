/** A second yellow card for the same team triggers an automatic red card. */
export const shouldAddAutoRed = (cardType: string, yellowsBefore: number): boolean =>
  cardType === "yellow" && yellowsBefore >= 1;
