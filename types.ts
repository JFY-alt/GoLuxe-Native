
export type Player = 'black' | 'white';
export type Intersection = Player | null;

export interface Point {
  x: number;
  y: number;
}

export type BoardTheme = 'espresso' | 'classic' | 'midnight' | 'washi' | 'maple' | 'riverstone';
export type RuleSet = 'japanese' | 'chinese';

export type GamePhase = 'play' | 'scoring' | 'ended';

export interface GameState {
  board: Intersection[][];
  turn: Player;
  captures: {
    black: number; // Stones captured by black
    white: number; // Stones captured by white
  };
  lastMove: Point | null;
  history: string[]; // Board strings for Ko detection
  phase: GamePhase;
  winner: Player | 'draw' | null;
  winReason?: 'time' | 'points' | 'resign' | 'no-result';
  consecutivePasses: number;
  handicapPlacementsLeft: number;
  deadStones: Set<string>; // Set of "x,y" strings representing dead stones
  sekiPoints: Set<string>; // Set of "x,y" strings representing territory points nullified by Seki
  ruleset: RuleSet;
}

export type AiDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'master';

export interface AiConfig {
  userColor: Player;
  difficulty: AiDifficulty;
}

export type TimeSystem = 'absolute' | 'japanese' | 'canadian' | 'fischer' | 'ing' | 'nhk';

export interface TimeSettings {
  system: TimeSystem;
  mainTimeMinutes: number;
  byoyomiPeriods?: number;      // Japanese
  byoyomiSeconds?: number;      // Japanese
  canadianStones?: number;      // Canadian
  canadianMinutes?: number;     // Canadian
  fischerIncrement?: number;    // Fischer (seconds)
  ingPeriods?: number;          // Ing
  ingBlockSeconds?: number;     // Ing
  nhkPeriods?: number;          // NHK
  nhkSeconds?: number;          // NHK (default 30)
}

export interface PlayerClock {
  mainTimeLeft: number;         // ms
  byoyomiPeriodsLeft: number;   // count
  byoyomiTimeLeft: number;      // ms (current period)
  canadianMovesLeft: number;    // count
  canadianTimeLeft: number;     // ms (current block)
  ingPeriodsLeft: number;       // count
  nhkPeriodsLeft: number;       // count
  nhkTimeLeft: number;          // ms (current move)
  isInOvertime: boolean;
}

export interface ScoreEntry {
  stones: number;
  territory: number;
  captures: number;
  komi: number;
  reverseKomi: number;
  penalties: number; // Points deducted (e.g. Ing rules)
  total: number;
}

export interface DetailedScores {
  black: ScoreEntry;
  white: ScoreEntry;
}
