import { Router } from 'express';
import * as leaderboardController from '../controllers/leaderboardController';

export const leaderboardRouter = Router();

leaderboardRouter.get(
  '/tournament/:tournamentId',
  leaderboardController.getTournamentLeaderboard
);

leaderboardRouter.get(
  '/global',
  leaderboardController.getGlobalLeaderboard
);

leaderboardRouter.get(
  '/standings/:tournamentId',
  leaderboardController.getMatchStandings
);
