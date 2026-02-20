export const DELETE_AD_REASONS = [
  "Sold via site",
  "Sold elsewhere",
  "Changed my mind",
  "Reposted the same ad",
  "Out of stock / Low inventory",
  "Low response",
] as const;

export type DeleteAdReason = (typeof DELETE_AD_REASONS)[number];