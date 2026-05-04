import { Router } from 'express';
import * as matchController from '../controllers/matchController';
import { authenticateToken } from '../../infrastructure/auth/jwt';

export const matchRouter = Router();

matchRouter.post(
  '/tournament/:id/start',
  authenticateToken,
  matchController.startTournament
);

matchRouter.post(
  '/tournament/:id/next-round',
  authenticateToken,
  matchController.nextRound
);

matchRouter.post(
  '/:matchId/result',
  authenticateToken,
  matchController.submitMatchResult
);

matchRouter.post(
  '/tournament/:id/finish',
  authenticateToken,
  matchController.finishTournament
);
