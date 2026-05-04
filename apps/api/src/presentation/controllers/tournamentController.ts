import { Response } from 'express';
import { prisma } from '../../infrastructure/database/prisma';
import type { AuthRequest } from '../../infrastructure/auth/jwt';

export const createTournament = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, description, gameType, format, maxPlayers, startTime } = req.body;
    const organizerId = req.userId!;

    const tournament = await prisma.tournament.create({
      data: {
        name,
        description,
        gameType,
        format,
        maxPlayers,
        startTime: startTime ? new Date(startTime) : null,
        organizerId,
      },
      include: {
        organizer: {
          select: { id: true, username: true },
        },
      },
    });

    await prisma.user.update({
      where: { id: organizerId },
      data: { role: 'ORGANIZER' },
    });

    res.status(201).json({
      message: 'Tournament created successfully',
      tournament,
    });
  } catch (error) {
    console.error('Create tournament error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTournaments = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { state, gameType, format, limit = '20', offset = '0' } = req.query;

    const where: Record<string, unknown> = {};
    if (state) where.state = state;
    if (gameType) where.gameType = gameType;
    if (format) where.format = format;

    const tournaments = await prisma.tournament.findMany({
      where,
      take: Number(limit),
      skip: Number(offset),
      orderBy: { createdAt: 'desc' },
      include: {
        organizer: {
          select: { id: true, username: true },
        },
        _count: {
          select: { participants: true },
        },
      },
    });

    const total = await prisma.tournament.count({ where });

    res.json({
      tournaments,
      total,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    console.error('Get tournaments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTournamentById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        organizer: {
          select: { id: true, username: true, email: true },
        },
        participants: {
          include: {
            user: {
              select: { id: true, username: true, eloRating: true },
            },
          },
          orderBy: { currentPoints: 'desc' },
        },
        matches: {
          orderBy: [{ roundNumber: 'desc' }, { tableNumber: 'asc' }],
        },
      },
    });

    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }

    res.json({ tournament });
  } catch (error) {
    console.error('Get tournament error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateTournament = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, state } = req.body;
    const organizerId = req.userId!;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }

    if (tournament.organizerId !== organizerId) {
      res.status(403).json({ error: 'Not authorized to update this tournament' });
      return;
    }

    const updated = await prisma.tournament.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(state && { state }),
      },
    });

    res.json({
      message: 'Tournament updated successfully',
      tournament: updated,
    });
  } catch (error) {
    console.error('Update tournament error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteTournament = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const organizerId = req.userId!;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }

    if (tournament.organizerId !== organizerId) {
      res.status(403).json({ error: 'Not authorized to delete this tournament' });
      return;
    }

    await prisma.$transaction([
      prisma.match.deleteMany({ where: { tournamentId: id } }),
      prisma.participant.deleteMany({ where: { tournamentId: id } }),
      prisma.tournament.delete({ where: { id } }),
    ]);

    res.json({ message: 'Tournament deleted successfully' });
  } catch (error) {
    console.error('Delete tournament error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
