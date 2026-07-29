import { prisma } from "@/lib/prisma";
import {
  activeBatches,
  currentFirstYear,
  nextRolloverDate,
  labelForBatchKey,
  type ActiveBatch,
} from "@/lib/batches";

const SETTINGS_ID = "singleton";
// Matches the mapping that was in place (First = 2028, Second = 2027,
// Third = 2026) when this auto-rotation system was introduced. Used only
// the very first time the settings row is created.
const DEFAULT_FIRST_YEAR = 2028;

export async function getBatchSettingsRow() {
  let settings = await prisma.batchSettings.findUnique({ where: { id: SETTINGS_ID } });
  if (!settings) {
    settings = await prisma.batchSettings.create({
      data: { id: SETTINGS_ID, firstYearAtSet: DEFAULT_FIRST_YEAR, setAt: new Date() },
    });
  }
  return settings;
}

export async function getActiveBatches(): Promise<ActiveBatch[]> {
  const settings = await getBatchSettingsRow();
  const firstYear = currentFirstYear(settings.firstYearAtSet, settings.setAt);
  return activeBatches(firstYear);
}

export async function getActiveBatchKeys(): Promise<string[]> {
  return (await getActiveBatches()).map((b) => b.key);
}

export async function getBatchLabel(key: string): Promise<string> {
  const settings = await getBatchSettingsRow();
  const firstYear = currentFirstYear(settings.firstYearAtSet, settings.setAt);
  return labelForBatchKey(key, firstYear);
}

export async function getBatchSettingsSummary() {
  const settings = await getBatchSettingsRow();
  const firstYear = currentFirstYear(settings.firstYearAtSet, settings.setAt);
  const batches = activeBatches(firstYear);
  return {
    batches,
    setAt: settings.setAt.toISOString(),
    setByName: settings.setByName,
    nextRolloverAt: nextRolloverDate(settings.setAt).toISOString(),
  };
}

/** Overrides which batch year currently counts as "First Year", resetting the 12-month auto-rotation clock from now. */
export async function setFirstYearBatch(firstYear: number, byUserId?: string, byName?: string) {
  return prisma.batchSettings.upsert({
    where: { id: SETTINGS_ID },
    update: {
      firstYearAtSet: firstYear,
      setAt: new Date(),
      setByUserId: byUserId ?? null,
      setByName: byName ?? null,
    },
    create: {
      id: SETTINGS_ID,
      firstYearAtSet: firstYear,
      setAt: new Date(),
      setByUserId: byUserId ?? null,
      setByName: byName ?? null,
    },
  });
}
