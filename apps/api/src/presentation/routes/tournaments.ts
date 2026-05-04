import { Router } from 'express';
import * as tournamentController from '../controllers/tournamentController';
import { authenticateToken } from '../../infrastructure/auth/jwt';
import { createTournamentSchema, updateTournamentSchema } from '../validators/schemas';

export const tournamentRouter = Router();

tournamentRouter.post(
  '/',
  authenticateToken,
  (req, res, next) => {
    createTournamentSchema.parse(req.body);
    next();
  },
  tournamentController.createTournament
);

tournamentRouter.get(
  '/',
  tournamentController.getTournaments
);

tournamentRouter.get(
  '/:id',
  tournamentController.getTournamentById
);

tournamentRouter.patch(
  '/:id',
  authenticateToken,
  (req, res, next) => {
    updateTournamentSchema.parse(req.body);
    next();
  },
  tournamentController.updateTournament
);

tournamentRouter.delete(
  '/:id',
  authenticateToken,
  tournamentController.deleteTournament
);
