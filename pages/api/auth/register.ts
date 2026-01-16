import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import prisma from '../../../lib/prisma';
import { signToken } from '../_utils/auth';
import { serialize } from 'cookie';
import { unmaskCPF, unmaskWhatsApp } from '../../../utilities/masks';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { name, email, password, cpf, whatsapp } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Nome, email e senha são obrigatórios' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Usuário já existe' });
    }

    // Validate and format CPF if provided
    let cleanCPF = null;
    if (cpf) {
      cleanCPF = unmaskCPF(cpf);
      if (cleanCPF.length !== 11) {
        return res.status(400).json({ message: 'CPF inválido. Deve conter 11 dígitos' });
      }
    }

    // Validate and format WhatsApp if provided
    let cleanWhatsApp = null;
    if (whatsapp) {
      cleanWhatsApp = unmaskWhatsApp(whatsapp);
      if (cleanWhatsApp.length !== 11 && cleanWhatsApp.length !== 13) {
        return res.status(400).json({ message: 'WhatsApp inválido. Deve conter 11 ou 13 dígitos' });
      }
      cleanWhatsApp = cleanWhatsApp.startsWith('55') ? cleanWhatsApp : `55${cleanWhatsApp}`;
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { 
        name, 
        email, 
        password: hashed,
        cpf: cleanCPF,
        whatsapp: cleanWhatsApp
      },
    });

    const accessToken = signToken({ id: user.id, email: user.email, role: user.role }, '1h');
    const refreshToken = signToken({ id: user.id }, '7d');

    await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id } });

    // Set refresh token as HttpOnly cookie
    res.setHeader('Set-Cookie', serialize('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    }));

    return res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, cpf: user.cpf, whatsapp: user.whatsapp, role: user.role }, accessToken });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro interno' });
  }
}
