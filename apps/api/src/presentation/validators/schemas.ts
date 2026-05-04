import { z } from 'zod';

export const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

export const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

export const createTournamentSchema = z.object({
  name: z.string().min(3).max(255),
  description: z.string().max(1000).optional(),
  gameType: z.enum(['MTG', 'PKM', 'YGO']),
  format: z.enum(['SWISS', 'SINGLE_ELIM']),
  maxPlayers: z.number().int().min(2).max(512),
  startTime: z.string().datetime().optional(),
});

export const updateTournamentSchema = z.object({
  name: z.string().min(3).max(255).optional(),
  description: z.string().max(1000).optional(),
  state: z.enum(['OPEN', 'IN_PROGRESS', 'FINISHED', 'CANCELLED']).optional(),
});

export const joinTournamentSchema = z.object({
  tournamentId: z.string().uuid(),
  qrCode: z.string().optional(),
});

export const matchResultSchema = z.object({
  matchId: z.string().uuid(),
  result: z.enum(['P1_WIN', 'P2_WIN', 'DRAW']),
  player1Wins: z.number().int().min(0).max(3).default(0),
  player2Wins: z.number().int().min(0).max(3).default(0),
  draws: z.number().int().min(0).default(0),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;
export type UpdateTournamentInput = z.infer<typeof updateTournamentSchema>;
export type JoinTournamentInput = z.infer<typeof joinTournamentSchema>;
export type MatchResultInput = z.infer<typeof matchResultSchema>;
