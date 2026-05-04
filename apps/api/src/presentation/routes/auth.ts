import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticateToken } from '../../infrastructure/auth/jwt';
import { createUserSchema, loginUserSchema } from '../validators/schemas';

export const authRouter = Router();

authRouter.post('/register', (req, res, next) => {
  createUserSchema.parse(req.body);
  next();
}, authController.register);

authRouter.post('/login', (req, res, next) => {
  loginUserSchema.parse(req.body);
  next();
}, authController.login);

authRouter.get('/profile', authenticateToken, authController.getProfile);
