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
  let remaining = Math.max(0, delta);
  const timeout = () => ({ clock: next, timedOut: true });
  if (!next.isInOvertime && settings.system !== 'ing') {
    const elapsed = Math.min(remaining, Math.max(0,next.mainTimeLeft));
    next.mainTimeLeft = Math.max(0,next.mainTimeLeft-elapsed); remaining -= elapsed;
    if (next.mainTimeLeft === 0) {
      if (settings.system === 'absolute' || settings.system === 'fischer') return timeout();
      next.isInOvertime = true;
    }
  }
  if (settings.system === 'ing') {
    while (remaining >= next.mainTimeLeft) {
      remaining -= Math.max(0,next.mainTimeLeft); next.mainTimeLeft = 0;
      if (next.ingPeriodsLeft <= 0) return timeout();
      next.ingPeriodsLeft--; next.mainTimeLeft = (settings.ingBlockSeconds ?? 600)*1000;
    }
    next.mainTimeLeft -= remaining;
  } else if (next.isInOvertime && settings.system === 'japanese') {
    while (remaining >= next.byoyomiTimeLeft) {
      remaining -= Math.max(0,next.byoyomiTimeLeft); next.byoyomiTimeLeft = 0;
      next.byoyomiPeriodsLeft--; if (next.byoyomiPeriodsLeft <= 0) return timeout();
      next.byoyomiTimeLeft = (settings.byoyomiSeconds ?? 30)*1000;
    }
    next.byoyomiTimeLeft -= remaining;
  } else if (next.isInOvertime && settings.system === 'canadian') {
    next.canadianTimeLeft = Math.max(0,next.canadianTimeLeft-remaining);
    if (next.canadianTimeLeft === 0) return timeout();
  } else if (next.isInOvertime && settings.system === 'nhk') {
    while (remaining >= next.nhkTimeLeft) {
      remaining -= Math.max(0,next.nhkTimeLeft); next.nhkTimeLeft = 0;
      if (next.nhkPeriodsLeft <= 0) return timeout();
      next.nhkPeriodsLeft--; next.nhkTimeLeft = 60000;
    }
    next.nhkTimeLeft -= remaining;
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
