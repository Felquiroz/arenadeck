import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const verifyPassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (userId: string, role: string): string => {
  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];

  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn }
  );
};

export const generateQRCode = (): string => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};
