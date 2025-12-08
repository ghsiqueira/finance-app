import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthRequest extends Request {
  userId?: string;
}

export const auth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    console.log('🔐 AUTH MIDDLEWARE');
    console.log('Headers:', req.headers.authorization);
    
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      console.log('❌ Token não encontrado');
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    console.log('Token recebido:', token.substring(0, 20) + '...');

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    console.log('✅ Token válido, userId:', decoded.userId);
    
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error('❌ Erro no auth middleware:', error);
    return res.status(401).json({ message: 'Token inválido' });
  }
};