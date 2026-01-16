import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import prisma from '../../../lib/prisma';
import nodemailer from 'nodemailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email é obrigatório' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if email exists
      return res.status(200).json({ message: 'Se o email existir, um link de redefinição foi enviado.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    // Send email
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Redefinição de Senha',
      html: `
        <p>Você solicitou a redefinição de senha.</p>
        <p>Clique no link abaixo para redefinir sua senha:</p>
        <a href="${resetUrl}">Redefinir Senha</a>
        <p>Este link expira em 1 hora.</p>
        <p>Se você não solicitou isso, ignore este email.</p>
      `,
    });

    res.status(200).json({ message: 'Se o email existir, um link de redefinição foi enviado.' });
  } catch (error) {
    console.error('Erro no forgot password:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}