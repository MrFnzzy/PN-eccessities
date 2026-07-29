// ---------------------------------------------------------------------------
// Class sections (PN1 / PN2) — fixed, chosen by each student at registration.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Batch years (First / Second / Third Year) — NOT fixed. Which three cohort
// years count as First/Second/Third rotates forward automatically once every
// 12 months, and can be corrected at any time by a class rep or admin. The
// live source of truth is the BatchSettings row in the database (see
// src/lib/batchSettings.ts, a server-only module); everything below is pure
// math/formatting shared by the server and the browser.
// ---------------------------------------------------------------------------
export type BatchKey = string; // e.g. "YEAR_2028"

export const ORDINAL_LABELS = ["First Year", "Second Year", "Third Year"] as const;
export const ORDINAL_SHORT = ["1st Year", "2nd Year", "3rd Year"] as const;
export const ORDINAL_ACCENT = [
  { bg: "bg-sky", text: "text-white", ring: "ring-sky" },
  { bg: "bg-amber", text: "text-white", ring: "ring-amber" },
  { bg: "bg-sky-deep", text: "text-white", ring: "ring-sky-deep" },
] as const;

export function batchKeyFromYear(year: number): BatchKey {
  return `YEAR_${year}`;
}

export function yearFromBatchKey(key: string): number {
  return parseInt(key.replace("YEAR_", ""), 10);
}

/**
 * Given the batch year that counted as "First Year" at the moment it was
 * last set, and when that was, returns what actually counts as "First Year"
 * right now — advancing by one year for every full 12 months that have
 * elapsed since `setAt`.
 */
export function currentFirstYear(firstYearAtSet: number, setAt: Date, now: Date = new Date()): number {
  const monthsElapsed =
    (now.getFullYear() - setAt.getFullYear()) * 12 + (now.getMonth() - setAt.getMonth());
  const yearsElapsed = Math.floor(monthsElapsed / 12);
  return firstYearAtSet + yearsElapsed;
}

/** The date the mapping will next auto-advance (12 months after it was set, plus however many whole years have already elapsed). */
export function nextRolloverDate(setAt: Date, now: Date = new Date()): Date {
  const monthsElapsed =
    (now.getFullYear() - setAt.getFullYear()) * 12 + (now.getMonth() - setAt.getMonth());
  const yearsElapsed = Math.floor(monthsElapsed / 12);
  const next = new Date(setAt);
  next.setFullYear(setAt.getFullYear() + yearsElapsed + 1);
  return next;
}

/** The three cohort years currently active, in order: [First, Second, Third]. */
export function activeBatchYears(firstYear: number): [number, number, number] {
  return [firstYear, firstYear - 1, firstYear - 2];
}

export type ActiveBatch = {
  key: BatchKey;
  year: number;
  label: string;
  short: string;
  accent: (typeof ORDINAL_ACCENT)[number];
};

export function activeBatches(firstYear: number): ActiveBatch[] {
  return activeBatchYears(firstYear).map((year, i) => ({
    key: batchKeyFromYear(year),
    year,
    label: `${ORDINAL_LABELS[i]} (Batch ${year})`,
    short: ORDINAL_SHORT[i],
    accent: ORDINAL_ACCENT[i],
  }));
}

/** Label for any batch key given the current first year — falls back gracefully for a batch that has since graduated/rotated out. */
export function labelForBatchKey(key: string, firstYear: number): string {
  const year = yearFromBatchKey(key);
  const idx = activeBatchYears(firstYear).indexOf(year);
  if (idx === -1) return Number.isFinite(year) ? `Batch ${year}` : key;
  return `${ORDINAL_LABELS[idx]} (Batch ${year})`;
}
