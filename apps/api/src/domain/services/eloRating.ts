import { prisma } from '../../infrastructure/database/prisma';

const K_FACTOR = 32;
const DEFAULT_ELO = 1200;
const MIN_ELO = 100;
const MAX_ELO = 3000;

const calculateExpectedScore = (ratingA: number, ratingB: number): number => {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
};

export const updateEloRatings = async (
  winnerId: string,
  loserId: string,
  isDraw: boolean = false
): Promise<{ winnerElo: number; loserElo: number }> => {
  const [winner, loser] = await Promise.all([
    prisma.user.findUnique({ where: { id: winnerId } }),
    prisma.user.findUnique({ where: { id: loserId } }),
  ]);

  if (!winner || !loser) {
    throw new Error('User not found');
  }

  const expectedWinner = calculateExpectedScore(winner.eloRating, loser.eloRating);
  const expectedLoser = calculateExpectedScore(loser.eloRating, winner.eloRating);

  const actualWinner = isDraw ? 0.5 : 1;
  const actualLoser = isDraw ? 0.5 : 0;

  let newWinnerElo = winner.eloRating + K_FACTOR * (actualWinner - expectedWinner);
  let newLoserElo = loser.eloRating + K_FACTOR * (actualLoser - expectedLoser);

  newWinnerElo = Math.max(MIN_ELO, Math.min(MAX_ELO, Math.round(newWinnerElo)));
  newLoserElo = Math.max(MIN_ELO, Math.min(MAX_ELO, Math.round(newLoserElo)));

  await prisma.$transaction([
    prisma.user.update({
      where: { id: winnerId },
      data: { eloRating: newWinnerElo },
    }),
    prisma.user.update({
      where: { id: loserId },
      data: { eloRating: newLoserElo },
    }),
  ]);

  return { winnerElo: newWinnerElo, loserElo: newLoserElo };
};

export const applyByePoints = async (
  userId: string,
  tournamentId: string
): Promise<void> => {
  const participant = await prisma.participant.findUnique({
    where: {
      userId_tournamentId: { userId, tournamentId },
    },
  });

  if (!participant) {
    throw new Error('Participant not found');
  }

  await prisma.participant.update({
    where: { id: participant.id },
    data: {
      hasBye: true,
      currentPoints: { increment: 3 },
    },
  });
};

export const getLeaderboard = async (
  tournamentId?: string,
  limit: number = 50
): Promise<Array<{
  rank: number;
  user: { id: string; username: string; eloRating: number };
  tournamentPoints?: number;
}>> => {
  if (tournamentId) {
    const participants = await prisma.participant.findMany({
      where: { tournamentId },
      orderBy: [{ currentPoints: 'desc' }, { omwPercentage: 'desc' }],
      take: limit,
      include: {
        user: { select: { id: true, username: true, eloRating: true } },
      },
    });

    return participants.map((p, idx) => ({
      rank: idx + 1,
      user: p.user,
      tournamentPoints: p.currentPoints,
    }));
  }

  const users = await prisma.user.findMany({
    orderBy: { eloRating: 'desc' },
    take: limit,
    select: { id: true, username: true, eloRating: true },
  });

  return users.map((u, idx) => ({
    rank: idx + 1,
    user: u,
  }));
};

export { K_FACTOR, DEFAULT_ELO, MIN_ELO, MAX_ELO };
