import { Response } from 'express';
import { prisma } from '../../infrastructure/database/prisma';
import { generateSwissPairings, assignByes } from '../../domain/services/swissPairing';
import { updateAllTiebreakers } from '../../domain/services/tiebreakers';
import { updateEloRatings, applyByePoints } from '../../domain/services/eloRating';
import type { AuthRequest } from '../../infrastructure/auth/jwt';

export const startTournament = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const organizerId = req.userId!;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        _count: { select: { participants: true } },
      },
    });

    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }

    if (tournament.organizerId !== organizerId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    if (tournament.state !== 'OPEN') {
      res.status(400).json({ error: 'Tournament already started or finished' });
      return;
    }

    if (tournament._count.participants < 2) {
      res.status(400).json({ error: 'Need at least 2 participants' });
      return;
    }

    await assignByes(id, 1);

    const pairings = await generateSwissPairings(id, 1);

    for (const pairing of pairings) {
      if (pairing.player2Id === 'BYE') {
        await applyByePoints(pairing.player1Id, id);
        await prisma.match.create({
          data: {
            tournamentId: id,
            roundNumber: 1,
            tableNumber: pairing.tableNumber,
            player1Id: pairing.player1Id,
            player2Id: null,
            result: 'BYE',
            status: 'COMPLETED',
            player1Wins: 2,
          },
        });
      } else {
        await prisma.match.create({
          data: {
            tournamentId: id,
            roundNumber: 1,
            tableNumber: pairing.tableNumber,
            player1Id: pairing.player1Id,
            player2Id: pairing.player2Id,
            status: 'PENDING',
          },
        });
      }
    }

    const updatedTournament = await prisma.tournament.update({
      where: { id },
      data: {
        state: 'IN_PROGRESS',
        currentRound: 1,
        rounds: Math.ceil(Math.log2(tournament._count.participants)),
      },
    });

    res.json({
      message: 'Tournament started',
      tournament: updatedTournament,
      matches: pairings.length,
    });
  } catch (error) {
    console.error('Start tournament error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const nextRound = async (
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
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const completedMatches = await prisma.match.count({
      where: {
        tournamentId: id,
        roundNumber: tournament.currentRound,
        status: 'COMPLETED',
      },
    });

    const totalMatches = await prisma.match.count({
      where: {
        tournamentId: id,
        roundNumber: tournament.currentRound,
      },
    });

    if (completedMatches < totalMatches) {
      res.status(400).json({
        error: 'Complete all matches before starting next round',
        completed: completedMatches,
        total: totalMatches,
      });
      return;
    }

    await updateAllTiebreakers(id);

    const nextRoundNum = tournament.currentRound + 1;
    const pairings = await generateSwissPairings(id, nextRoundNum);

    for (const pairing of pairings) {
      if (pairing.player2Id === 'BYE') {
        await applyByePoints(pairing.player1Id, id);
        await prisma.match.create({
          data: {
            tournamentId: id,
            roundNumber: nextRoundNum,
            tableNumber: pairing.tableNumber,
            player1Id: pairing.player1Id,
            player2Id: null,
            result: 'BYE',
            status: 'COMPLETED',
            player1Wins: 2,
          },
        });
      } else {
        await prisma.match.create({
          data: {
            tournamentId: id,
            roundNumber: nextRoundNum,
            tableNumber: pairing.tableNumber,
            player1Id: pairing.player1Id,
            player2Id: pairing.player2Id,
            status: 'PENDING',
          },
        });
      }
    }

    const updatedTournament = await prisma.tournament.update({
      where: { id },
      data: { currentRound: nextRoundNum },
    });

    res.json({
      message: `Round ${nextRoundNum} started`,
      tournament: updatedTournament,
    });
  } catch (error) {
    console.error('Next round error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const submitMatchResult = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { matchId } = req.params;
    const { result, player1Wins, player2Wins, draws } = req.body;
    const userId = req.userId!;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { tournament: true },
    });

    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }

    const isOrganizer = match.tournament.organizerId === userId;
    const isPlayer = match.player1Id === userId || match.player2Id === userId;

    if (!isOrganizer && !isPlayer) {
      res.status(403).json({ error: 'Not authorized to report this match' });
      return;
    }

    if (match.status === 'COMPLETED') {
      res.status(400).json({ error: 'Match already completed' });
      return;
    }

    let winnerId: string | null = null;
    let loserId: string | null = null;
    let isDraw = false;

    if (result === 'P1_WIN') {
      winnerId = match.player1Id!;
      loserId = match.player2Id!;
    } else if (result === 'P2_WIN') {
      winnerId = match.player2Id!;
      loserId = match.player1Id!;
    } else if (result === 'DRAW') {
      isDraw = true;
    } else if (result === 'BYE') {
      const hasBye = await prisma.participant.findFirst({
        where: {
          tournamentId: match.tournamentId,
          userId: match.player1Id,
          hasBye: false,
        },
      });
      if (hasBye) {
        await prisma.participant.update({
          where: { id: hasBye.id },
          data: { hasBye: true, currentPoints: { increment: 3 } },
        });
      }
    }

    if (winnerId && loserId && !isDraw && result !== 'BYE') {
      await updateEloRatings(winnerId, loserId, isDraw);
    }

    if (match.player1Id && match.player2Id && result !== 'BYE') {
      const p1 = await prisma.participant.findUnique({
        where: {
          userId_tournamentId: {
            userId: match.player1Id,
            tournamentId: match.tournamentId,
          },
        },
      });

      const p2 = await prisma.participant.findUnique({
        where: {
          userId_tournamentId: {
            userId: match.player2Id,
            tournamentId: match.tournamentId,
          },
        },
      });

      if (p1 && p2) {
        if (result === 'P1_WIN') {
          await prisma.participant.update({
            where: { id: p1.id },
            data: { currentPoints: { increment: 3 } },
          });
        } else if (result === 'P2_WIN') {
          await prisma.participant.update({
            where: { id: p2.id },
            data: { currentPoints: { increment: 3 } },
          });
        } else if (result === 'DRAW') {
          await prisma.participant.updateMany({
            where: { id: { in: [p1.id, p2.id] } },
            data: { currentPoints: { increment: 1 } },
          });
        }
      }
    }

    await prisma.match.update({
      where: { id: matchId },
      data: {
        result,
        status: 'COMPLETED',
        player1Wins: player1Wins ?? 0,
        player2Wins: player2Wins ?? 0,
        draws: draws ?? 0,
      },
    });

    res.json({
      message: 'Match result submitted',
      matchId,
      result,
    });
  } catch (error) {
    console.error('Submit match result error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const finishTournament = async (
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
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    await updateAllTiebreakers(id);

    const updatedTournament = await prisma.tournament.update({
      where: { id },
      data: {
        state: 'FINISHED',
        endTime: new Date(),
      },
      include: {
        participants: {
          orderBy: [{ currentPoints: 'desc' }, { omwPercentage: 'desc' }],
          include: {
            user: { select: { id: true, username: true } },
          },
        },
      },
    });

    res.json({
      message: 'Tournament finished',
      tournament: updatedTournament,
      standings: updatedTournament.participants,
    });
  } catch (error) {
    console.error('Finish tournament error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
