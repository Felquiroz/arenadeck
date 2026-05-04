import { Router } from 'express';
import * as participantController from '../controllers/participantController';
import { authenticateToken } from '../../infrastructure/auth/jwt';
import { joinTournamentSchema } from '../validators/schemas';

export const participantRouter = Router();

participantRouter.post(
  '/join',
  authenticateToken,
  (req, res, next) => {
    joinTournamentSchema.parse(req.body);
    next();
  },
  participantController.joinTournament
);

participantRouter.post(
  '/leave',
  authenticateToken,
  participantController.leaveTournament
);

participantRouter.get(
  '/tournament/:tournamentId',
  participantController.getParticipants
);
