export const GAME_TYPES = ['MTG', 'PKM', 'YGO'] as const;
export const TOURNAMENT_FORMATS = ['SWISS', 'SINGLE_ELIM'] as const;
export const TOURNAMENT_STATES = ['OPEN', 'IN_PROGRESS', 'FINISHED', 'CANCELLED'] as const;
export const USER_ROLES = ['PLAYER', 'ORGANIZER', 'ADMIN'] as const;
export const MATCH_RESULTS = ['P1_WIN', 'P2_WIN', 'DRAW', 'BYE'] as const;

export type GameType = (typeof GAME_TYPES)[number];
export type TournamentFormat = (typeof TOURNAMENT_FORMATS)[number];
export type TournamentState = (typeof TOURNAMENT_STATES)[number];
export type UserRole = (typeof USER_ROLES)[number];
export type MatchResult = (typeof MATCH_RESULTS)[number];

export const K_FACTOR = 32;
export const DEFAULT_ELO = 1200;
export const MIN_ELO = 100;
export const MAX_ELO = 3000;