import { Response } from 'express';
import { prisma } from '../../infrastructure/database/prisma';
import type { AuthRequest } from '../../infrastructure/auth/jwt';

export const joinTournament = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { tournamentId } = req.body;
    const userId = req.userId!;

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        _count: { select: { participants: true } },
      },
    });

    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }

    if (tournament.state !== 'OPEN') {
      res.status(400).json({ error: 'Tournament registration is closed' });
      return;
    }

    if (tournament._count.participants >= tournament.maxPlayers) {
      res.status(400).json({ error: 'Tournament is full' });
      return;
    }

    const existingParticipant = await prisma.participant.findUnique({
      where: {
        userId_tournamentId: {
          userId,
          tournamentId,
        },
      },
    });

    if (existingParticipant) {
      res.status(400).json({ error: 'Already registered in this tournament' });
      return;
    }

    const participant = await prisma.participant.create({
      data: {
        userId,
        tournamentId,
        seed: tournament._count.participants + 1,
      },
      include: {
        user: {
          select: { id: true, username: true, eloRating: true },
        },
      },
    });

    res.status(201).json({
      message: 'Successfully joined tournament',
      participant,
    });
  } catch (error) {
    console.error('Join tournament error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const leaveTournament = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { tournamentId } = req.body;
    const userId = req.userId!;

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }

    if (tournament.state !== 'OPEN') {
      res.status(400).json({ error: 'Cannot leave tournament after it has started' });
      return;
    }

    const participant = await prisma.participant.findUnique({
      where: {
        userId_tournamentId: {
          userId,
          tournamentId,
        },
      },
    });

    if (!participant) {
      res.status(400).json({ error: 'Not registered in this tournament' });
      return;
    }

    await prisma.participant.delete({
      where: {
        userId_tournamentId: {
          userId,
          tournamentId,
        },
      },
    });

    res.json({ message: 'Successfully left tournament' });
  } catch (error) {
    console.error('Leave tournament error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getParticipants = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { tournamentId } = req.params;

    const participants = await prisma.participant.findMany({
      where: { tournamentId },
      include: {
        user: {
          select: { id: true, username: true, eloRating: true },
        },
      },
      orderBy: [{ currentPoints: 'desc' }, { seed: 'asc' }],
    });

    res.json({ participants });
  } catch (error) {
    console.error('Get participants error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
