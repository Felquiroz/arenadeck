import { Response } from 'express';
import { prisma } from '../../infrastructure/database/prisma';
import { 
  hashPassword, 
  verifyPassword, 
  generateToken, 
  generateQRCode 
} from '../../infrastructure/auth/helpers';
import type { AuthRequest } from '../../infrastructure/auth/jwt';

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser) {
      res.status(400).json({ 
        error: existingUser.email === email 
          ? 'Email already registered' 
          : 'Username already taken' 
      });
      return;
    }

    const passwordHash = await hashPassword(password);
    const qrCode = generateQRCode();

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        qrCode,
      },
      select: {
        id: true,
        username: true,
        email: true,
        eloRating: true,
        qrCode: true,
        role: true,
        createdAt: true,
      },
    });

    const token = generateToken(user.id, user.role);

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        username: true,
        email: true,
        passwordHash: true,
        eloRating: true,
        role: true,
        qrCode: true,
      },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const validPassword = await verifyPassword(password, user.passwordHash);
    if (!validPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = generateToken(user.id, user.role);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        eloRating: user.eloRating,
        role: user.role,
        qrCode: user.qrCode,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        username: true,
        email: true,
        eloRating: true,
        qrCode: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
