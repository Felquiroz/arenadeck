import { prisma } from '../../infrastructure/database/prisma';

export const calculateOMWPercentage = async (
  participantId: string,
  tournamentId: string
): Promise<number> => {
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    include: {
      tournament: { include: { matches: true } },
    },
  });

  if (!participant) return 0;

  const matches = await prisma.match.findMany({
    where: {
      tournamentId,
      OR: [{ player1Id: participant.userId }, { player2Id: participant.userId }],
      status: 'COMPLETED',
    },
  });

  if (matches.length === 0) return 0;

  let totalOpponentWins = 0;
  let opponentGamesPlayed = 0;

  for (const match of matches) {
    const opponentId = match.player1Id === participant.userId 
      ? match.player2Id 
      : match.player1Id;
    
    if (!opponentId || opponentId === 'BYE') continue;

    const opponentMatches = await prisma.match.findMany({
      where: {
        tournamentId,
        OR: [{ player1Id: opponentId }, { player2Id: opponentId }],
        status: 'COMPLETED',
      },
    });

    for (const om of opponentMatches) {
      const opponentWon = 
        (om.player1Id === opponentId && (om.result === 'P1_WIN' || om.result === 'P1_WIN_GIVE')) ||
        (om.player2Id === opponentId && (om.result === 'P2_WIN' || om.result === 'P2_WIN_GIVE'));
      
      if (opponentWon) {
        totalOpponentWins++;
      }
      opponentGamesPlayed++;
    }
  }

  return opponentGamesPlayed > 0 
    ? Math.round((totalOpponentWins / opponentGamesPlayed) * 10000) / 100 
    : 0;
};

export const calculateGWPercentage = async (
  participantId: string,
  tournamentId: string
): Promise<number> => {
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
  });

  if (!participant) return 0;

  const matches = await prisma.match.findMany({
    where: {
      tournamentId,
      OR: [{ player1Id: participant.userId }, { player2Id: participant.userId }],
      status: 'COMPLETED',
    },
  });

  if (matches.length === 0) return 0;

  let totalWins = 0;
  let totalGames = 0;

  for (const match of matches) {
    if (match.player1Id === participant.userId) {
      totalWins += match.player1Wins;
      totalGames += match.player1Wins + match.player2Wins + match.draws;
    } else if (match.player2Id === participant.userId) {
      totalWins += match.player2Wins;
      totalGames += match.player1Wins + match.player2Wins + match.draws;
    }
  }

  return totalGames > 0 
    ? Math.round((totalWins / totalGames) * 10000) / 100 
    : 0;
};

export const updateAllTiebreakers = async (tournamentId: string): Promise<void> => {
  const participants = await prisma.participant.findMany({
    where: { tournamentId },
  });

  for (const participant of participants) {
    const omw = await calculateOMWPercentage(participant.id, tournamentId);
    const gw = await calculateGWPercentage(participant.id, tournamentId);

    await prisma.participant.update({
      where: { id: participant.id },
      data: {
        omwPercentage: omw,
        gwPercentage: gw,
      },
    });
  }
};
