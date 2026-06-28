import { MoonPhase } from './astronomy-provider';

export const LUNAR_AGE_SOURCE = 'usno moon phases';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function calculateLunarAgeDays(
  date: Date,
  phases: MoonPhase[],
): number | undefined {
  const previousNewMoon = phases
    .filter(
      (phase) =>
        phase.phase === 'New Moon' &&
        phase.occursAt.getTime() <= date.getTime(),
    )
    .sort((a, b) => b.occursAt.getTime() - a.occursAt.getTime())[0];

  if (!previousNewMoon) {
    return undefined;
  }

  return roundTo(
    (date.getTime() - previousNewMoon.occursAt.getTime()) / MS_PER_DAY,
    2,
  );
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;

  return Math.round(value * factor) / factor;
}
