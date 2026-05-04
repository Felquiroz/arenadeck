import { Response } from 'express';
import { prisma } from '../../infrastructure/database/prisma';
import { getLeaderboard } from '../../domain/services/eloRating';
import type { AuthRequest } from '../../infrastructure/auth/jwt';

export const getTournamentLeaderboard = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { tournamentId } = req.params;
    const { limit = '50' } = req.query;

    const participants = await prisma.participant.findMany({
      where: { tournamentId },
      orderBy: [{ currentPoints: 'desc' }, { omwPercentage: 'desc' }, { gwPercentage: 'desc' }],
      take: Number(limit),
      include: {
        user: { select: { id: true, username: true, eloRating: true } },
      },
    });

    const leaderboard = participants.map((p, idx) => ({
      rank: idx + 1,
      user: p.user,
      points: p.currentPoints,
      omw: p.omwPercentage,
      gw: p.gwPercentage,
      hasBye: p.hasBye,
    }));

    res.json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getGlobalLeaderboard = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { limit = '50' } = req.query;

    const leaderboard = await getLeaderboard(undefined, Number(limit));

    res.json({ leaderboard });
  } catch (error) {
    console.error('Global leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMatchStandings = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { tournamentId } = req.params;
    const roundFilter = req.query.round as string | undefined;

    const where: Record<string, unknown> = { tournamentId };
    if (roundFilter) where.roundNumber = Number(roundFilter);

    const matches = await prisma.match.findMany({
      where,
      include: {
        player1: { select: { id: true, username: true, eloRating: true } },
        player2: { select: { id: true, username: true, eloRating: true } },
      },
      orderBy: [{ roundNumber: 'desc' }, { tableNumber: 'asc' }],
    });

    const standings = matches.map(m => ({
      round: m.roundNumber,
      table: m.tableNumber,
      player1: m.player1,
      player2: m.player2,
      result: m.result,
      status: m.status,
    }));

    res.json({ matches: standings });
  } catch (error) {
    console.error('Standings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
