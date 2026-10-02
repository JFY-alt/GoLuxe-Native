import { PlayerClock, TimeSettings } from '../types';

/** Fresh clock for one player, ported from the web GameSession. */
export const createClock = (settings: TimeSettings | null, mainMs: number): PlayerClock => ({
  mainTimeLeft: mainMs,
  byoyomiPeriodsLeft: settings?.byoyomiPeriods || 0,
  byoyomiTimeLeft: (settings?.byoyomiSeconds || 0) * 1000,
  canadianMovesLeft: settings?.canadianStones || 0,
  canadianTimeLeft: (settings?.canadianMinutes || 0) * 60000,
  ingPeriodsLeft: settings?.ingPeriods || 0,
  nhkPeriodsLeft: settings?.nhkPeriods || 0,
  nhkTimeLeft: (settings?.nhkSeconds || 30) * 1000,
  isInOvertime: settings?.system === 'nhk', // NHK starts in move-time immediately
});

/**
 * Advance one player's clock by delta ms.
 * Returns { clock, timedOut }. Ported from the web tick logic.
 */
export const tickClock = (
  clock: PlayerClock,
  settings: TimeSettings,
  delta: number,
): { clock: PlayerClock; timedOut: boolean } => {
  const next = { ...clock };
  if (!next.isInOvertime) {
    next.mainTimeLeft -= delta;
    if (next.mainTimeLeft <= 0) {
      if (settings.system === 'absolute' || settings.system === 'fischer') {
        return { clock, timedOut: true };
      } else if (settings.system === 'ing') {
        if (next.ingPeriodsLeft > 0) {
          next.ingPeriodsLeft -= 1;
          next.mainTimeLeft = (settings.ingBlockSeconds || 600) * 1000;
        } else {
          return { clock, timedOut: true };
        }
      } else {
        next.isInOvertime = true;
        if (settings.system === 'japanese') {
          next.byoyomiTimeLeft = (settings.byoyomiSeconds || 30) * 1000;
        } else if (settings.system === 'canadian') {
          next.canadianTimeLeft = (settings.canadianMinutes || 10) * 60000;
        } else if (settings.system === 'nhk') {
          next.nhkTimeLeft = (settings.nhkSeconds || 30) * 1000;
        }
      }
    }
  } else {
    if (settings.system === 'japanese') {
      next.byoyomiTimeLeft -= delta;
      if (next.byoyomiTimeLeft <= 0) {
        next.byoyomiPeriodsLeft -= 1;
        if (next.byoyomiPeriodsLeft <= 0) return { clock, timedOut: true };
        next.byoyomiTimeLeft = (settings.byoyomiSeconds || 30) * 1000;
      }
    } else if (settings.system === 'canadian') {
      next.canadianTimeLeft -= delta;
      if (next.canadianTimeLeft <= 0) return { clock, timedOut: true };
    } else if (settings.system === 'nhk') {
      next.nhkTimeLeft -= delta;
      if (next.nhkTimeLeft <= 0) {
        if (next.nhkPeriodsLeft > 0) {
          next.nhkPeriodsLeft -= 1;
          next.nhkTimeLeft = 60000; // 1 minute thinking time
        } else {
          return { clock, timedOut: true };
        }
      }
    }
  }
  return { clock: next, timedOut: false };
};

/** Apply post-move clock updates (byoyomi reset, canadian quota, fischer bonus, NHK reset). */
export const clockAfterMove = (clock: PlayerClock, settings: TimeSettings): PlayerClock => {
  const next = { ...clock };
  if (settings.system === 'japanese') {
    if (next.isInOvertime) next.byoyomiTimeLeft = (settings.byoyomiSeconds || 30) * 1000;
  } else if (settings.system === 'canadian') {
    if (next.isInOvertime) {
      next.canadianMovesLeft -= 1;
      if (next.canadianMovesLeft <= 0) {
        next.canadianMovesLeft = settings.canadianStones || 25;
        next.canadianTimeLeft = (settings.canadianMinutes || 10) * 60000;
      }
    }
  } else if (settings.system === 'fischer') {
    next.mainTimeLeft += (settings.fischerIncrement || 0) * 1000;
  } else if (settings.system === 'nhk') {
    next.nhkTimeLeft = (settings.nhkSeconds || 30) * 1000;
  }
  return next;
};

export const formatClock = (ms: number): string => {
  const totalS = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalS / 60);
  const s = totalS % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}:${String(m % 60).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
};

/** Primary display string for a clock, matching the web score-strip logic. */
export const clockDisplay = (clock: PlayerClock, settings: TimeSettings): string => {
  if (clock.isInOvertime) {
    if (settings.system === 'japanese')
      return `${formatClock(clock.byoyomiTimeLeft)} (${clock.byoyomiPeriodsLeft})`;
    if (settings.system === 'nhk')
      return `${formatClock(clock.nhkTimeLeft)} [${clock.nhkPeriodsLeft}]`;
    if (settings.system === 'canadian')
      return `${formatClock(clock.canadianTimeLeft)} · ${clock.canadianMovesLeft} stones`;
  }
  return formatClock(clock.mainTimeLeft);
};
