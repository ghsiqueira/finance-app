import type { Request, Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import Goal from '../models/Goal.js';
import { sendEmail } from '../utils/email.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 🆕 CONFIGURAR __dirname PARA ES MODULES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const DEFAULT_CATEGORIES = [
  // DESPESAS
  { name: 'Alimentação', icon: 'restaurant', color: '#e74c3c', type: 'expense' },
  { name: 'Transporte', icon: 'car', color: '#3498db', type: 'expense' },
  { name: 'Moradia', icon: 'home', color: '#9b59b6', type: 'expense' },
  { name: 'Saúde', icon: 'medical', color: '#1abc9c', type: 'expense' },
  { name: 'Educação', icon: 'school', color: '#f39c12', type: 'expense' },
  { name: 'Lazer', icon: 'game-controller', color: '#e67e22', type: 'expense' },
  { name: 'Compras', icon: 'cart', color: '#c0392b', type: 'expense' },
  { name: 'Contas', icon: 'receipt', color: '#34495e', type: 'expense' },
  
  // RECEITAS
  { name: 'Salário', icon: 'cash', color: '#27ae60', type: 'income' },
  { name: 'Freelance', icon: 'briefcase', color: '#16a085', type: 'income' },
  { name: 'Investimentos', icon: 'trending-up', color: '#2ecc71', type: 'income' },
  { name: 'Outros', icon: 'add-circle', color: '#95a5a6', type: 'income' },
];

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    await user.save();

    console.log(`📦 Criando categorias padrão para usuário: ${user._id}`);
    const categoryPromises = DEFAULT_CATEGORIES.map(cat => {
      const category = new Category({
        userId: user._id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        type: cat.type,
      });
      return category.save();
    });

    await Promise.all(categoryPromises);
    console.log(`✅ ${DEFAULT_CATEGORIES.length} categorias criadas para ${user.email}`);

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePhoto: user.profilePhoto || null,
      },
    });
  } catch (error) {
    console.error('Error in register:', error);
    res.status(500).json({ message: 'Erro ao criar usuário' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Email ou senha inválidos' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email ou senha inválidos' });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePhoto: user.profilePhoto || null,
      },
    });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ message: 'Erro ao fazer login' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email é obrigatório' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    user.resetPasswordToken = resetCode;
    user.resetPasswordExpires = new Date(Date.now() + 3600000);
    await user.save();

    console.log(`Reset code for ${email}: ${resetCode}`);

    // ENVIAR EMAIL
    try {
      await sendEmail(
        user.email,
        'Código de Recuperação de Senha - Finance App',
        `Olá ${user.name},\n\nSeu código de recuperação de senha é: ${resetCode}\n\nEste código expira em 1 hora.\n\nSe você não solicitou este código, ignore este email.\n\nEquipe Finance App`
      );
      console.log(`✅ Email enviado para ${user.email}`);
    } catch (emailError) {
      console.error('❌ Erro ao enviar email:', emailError);
    }

    res.json({ 
      message: 'Código de recuperação enviado',
    });
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    res.status(500).json({ message: 'Erro ao solicitar recuperação de senha' });
  }
};

export const verifyResetCode = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Email e código são obrigatórios' });
    }

    const user = await User.findOne({ 
      email: email.toLowerCase(),
      resetPasswordToken: code,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Código inválido ou expirado' });
    }

    res.json({ message: 'Código válido', valid: true });
  } catch (error) {
    console.error('Error in verifyResetCode:', error);
    res.status(500).json({ message: 'Erro ao verificar código' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }

    const user = await User.findOne({ 
      email: email.toLowerCase(),
      resetPasswordToken: code,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Código inválido ou expirado' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.set('resetPasswordToken', undefined);
    user.set('resetPasswordExpires', undefined);
    await user.save();

    res.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    res.status(500).json({ message: 'Erro ao redefinir senha' });
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Senha é obrigatória' });
    }

    // Verifica se o usuário existe
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Verifica a senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Senha incorreta' });
    }

    console.log(`🗑️ Deletando conta do usuário: ${user.email}`);

    // Deletar foto de perfil se existir
    if (user.profilePhoto) {
      const photoPath = path.join(__dirname, '../../uploads/profiles', user.profilePhoto);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
        console.log(`🗑️ Foto de perfil deletada: ${user.profilePhoto}`);
      }
    }

    // Deleta todos os dados relacionados
    await Transaction.deleteMany({ userId: req.userId });
    await Budget.deleteMany({ userId: req.userId });
    await Goal.deleteMany({ userId: req.userId });
    await Category.deleteMany({ userId: req.userId });

    // Deleta o usuário
    await User.findByIdAndDelete(req.userId);

    console.log(`✅ Conta deletada: ${user.email}`);

    res.json({ message: 'Conta deletada com sucesso' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Erro ao deletar conta' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { name, email } = req.body;

    // Validações
    if (!name || !email) {
      return res.status(400).json({ message: 'Nome e email são obrigatórios' });
    }

    // Buscar usuário atual
    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Verificar se o email já está em uso por outro usuário
    if (email.toLowerCase() !== currentUser.email.toLowerCase()) {
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: req.userId }
      });
      
      if (existingUser) {
        return res.status(400).json({ message: 'Este email já está em uso' });
      }
    }

    // Atualizar usuário
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { 
        name, 
        email: email.toLowerCase() 
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    console.log(`✅ Perfil atualizado: ${updatedUser.email}`);

    res.json({
      message: 'Perfil atualizado com sucesso',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        profilePhoto: updatedUser.profilePhoto || null,
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Erro ao atualizar perfil' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { currentPassword, newPassword } = req.body;

    // Validações
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Senha atual e nova senha são obrigatórias' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'A nova senha deve ter pelo menos 6 caracteres' });
    }

    // Buscar usuário
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Verificar senha atual
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Senha atual incorreta' });
    }

    // Verificar se a nova senha é diferente
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ message: 'A nova senha deve ser diferente da atual' });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha
    user.password = hashedPassword;
    await user.save();

    console.log(`✅ Senha alterada: ${user.email}`);

    res.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Erro ao alterar senha' });
  }
};

export const uploadProfilePhoto = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Nenhuma imagem foi enviada' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Deletar foto antiga se existir
    if (user.profilePhoto) {
      const oldPhotoPath = path.join(__dirname, '../../uploads/profiles', user.profilePhoto);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
        console.log(`🗑️ Foto antiga deletada: ${user.profilePhoto}`);
      }
    }

    // Atualizar com nova foto
    const photoFilename = req.file.filename;
    user.profilePhoto = photoFilename;
    await user.save();

    console.log(`✅ Foto de perfil atualizada: ${user.email}`);

    res.json({
      message: 'Foto de perfil atualizada com sucesso',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePhoto: photoFilename,
      },
    });
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    
    // Deletar arquivo se houver erro
    if (req.file) {
      const filePath = path.join(__dirname, '../../uploads/profiles', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.status(500).json({ message: 'Erro ao fazer upload da foto' });
  }
};

export const deleteProfilePhoto = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    if (!user.profilePhoto) {
      return res.status(400).json({ message: 'Nenhuma foto de perfil para deletar' });
    }

    // Deletar arquivo
    const photoPath = path.join(__dirname, '../../uploads/profiles', user.profilePhoto);
    if (fs.existsSync(photoPath)) {
      fs.unlinkSync(photoPath);
      console.log(`🗑️ Foto deletada: ${user.profilePhoto}`);
    }

    // Remover do banco
    user.profilePhoto = undefined;
    await user.save();

    res.json({
      message: 'Foto de perfil removida com sucesso',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePhoto: null,
      },
    });
  } catch (error) {
    console.error('Error deleting profile photo:', error);
    res.status(500).json({ message: 'Erro ao deletar foto' });
  }
};