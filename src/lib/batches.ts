export const BATCHES = ["YEAR_2028", "YEAR_2027", "YEAR_2026"] as const;
export type BatchKey = (typeof BATCHES)[number];

export const BATCH_LABEL: Record<BatchKey, string> = {
  YEAR_2028: "First Year (Batch 2028)",
  YEAR_2027: "Second Year (Batch 2027)",
  YEAR_2026: "Third Year (Batch 2026)",
};

export const BATCH_SHORT: Record<BatchKey, string> = {
  YEAR_2028: "1st Year",
  YEAR_2027: "2nd Year",
  YEAR_2026: "3rd Year",
};

// One accent per batch, all drawn from the same palette so the app stays cohesive.
export const BATCH_ACCENT: Record<BatchKey, { bg: string; text: string; ring: string }> = {
  YEAR_2028: { bg: "bg-sky", text: "text-white", ring: "ring-sky" },
  YEAR_2027: { bg: "bg-amber", text: "text-white", ring: "ring-amber" },
  YEAR_2026: { bg: "bg-sky-deep", text: "text-white", ring: "ring-sky-deep" },
};

// Every batch (year) is split into two classes.
export const SECTIONS = ["PN1", "PN2"] as const;
export type SectionKey = (typeof SECTIONS)[number];

export const SECTION_LABEL: Record<SectionKey, string> = {
  PN1: "PN1",
  PN2: "PN2",
};

export const SECTION_ACCENT: Record<SectionKey, { bg: string; text: string; ring: string }> = {
  PN1: { bg: "bg-sky", text: "text-white", ring: "ring-sky" },
  PN2: { bg: "bg-amber", text: "text-white", ring: "ring-amber" },
};
