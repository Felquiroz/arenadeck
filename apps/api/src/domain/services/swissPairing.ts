import { prisma } from '../../infrastructure/database/prisma';

export interface PairingResult {
  player1Id: string;
  player2Id: string;
  tableNumber: number;
}

export const generateSwissPairings = async (
  tournamentId: string,
  roundNumber: number
): Promise<PairingResult[]> => {
  const participants = await prisma.participant.findMany({
    where: { tournamentId },
    include: {
      user: { select: { id: true, eloRating: true } },
    },
    orderBy: [{ currentPoints: 'desc' }, { omwPercentage: 'desc' }, { seed: 'asc' }],
  });

  if (participants.length < 2) {
    throw new Error('Not enough participants for pairing');
  }

  const previousMatches = await prisma.match.findMany({
    where: { tournamentId },
    select: { player1Id: true, player2Id: true },
  });

  const playedTogether = new Set<string>();
  for (const match of previousMatches) {
    const key = [match.player1Id, match.player2Id].sort().join('-');
    playedTogether.add(key);
  }

  const pairings: PairingResult[] = [];
  const paired = new Set<string>();
  let tableNumber = 1;

  const topBracket = participants.slice(0, Math.ceil(participants.length / 2));
  const bottomBracket = participants.slice(Math.ceil(participants.length / 2));

  for (let i = 0; i < topBracket.length; i++) {
    const p1 = topBracket[i];
    if (paired.has(p1.userId)) continue;

    let opponent: typeof p1 | null = null;

    for (let j = 0; j < bottomBracket.length; j++) {
      const p2 = bottomBracket[j];
      if (paired.has(p2.userId)) continue;

      const key = [p1.userId, p2.userId].sort().join('-');
      if (!playedTogether.has(key)) {
        opponent = p2;
        break;
      }
    }

    if (!opponent) {
      for (let j = 0; j < participants.length; j++) {
        const p2 = participants[j];
        if (p1.userId === p2.userId || paired.has(p2.userId)) continue;

        const key = [p1.userId, p2.userId].sort().join('-');
        if (!playedTogether.has(key)) {
          opponent = p2;
          break;
        }
      }
    }

    if (opponent) {
      paired.add(p1.userId);
      paired.add(opponent.userId);
      pairings.push({
        player1Id: p1.userId,
        player2Id: opponent.userId,
        tableNumber: tableNumber++,
      });
    } else {
      pairings.push({
        player1Id: p1.userId,
        player2Id: 'BYE',
        tableNumber: tableNumber++,
      });
    }
  }

  for (const p of participants) {
    if (!paired.has(p.userId)) {
      pairings.push({
        player1Id: p.userId,
        player2Id: 'BYE',
        tableNumber: tableNumber++,
      });
    }
  }

  return pairings;
};

export const assignByes = async (
  tournamentId: string,
  roundNumber: number
): Promise<void> => {
  const participants = await prisma.participant.findMany({
    where: { tournamentId },
    orderBy: { currentPoints: 'desc' },
  });

  if (participants.length % 2 !== 0) {
    const topSeed = participants[0];
    if (!topSeed.hasBye) {
      await prisma.participant.update({
        where: { id: topSeed.id },
        data: { hasBye: true, currentPoints: { increment: 3 } },
      });
    }
  }
};
