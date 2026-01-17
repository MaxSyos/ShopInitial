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

    const resetUrl = `${process.env.NEXT_PUBLIC_NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: '🔐 Redefinição de Senha - Nova Style & Sports',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f5f5f5;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 600px;
                margin: 20px auto;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 600;
              }
              .content {
                background-color: white;
                padding: 40px 30px;
              }
              .content p {
                color: #333;
                font-size: 16px;
                line-height: 1.6;
                margin: 15px 0;
              }
              .emoji {
                font-size: 24px;
                margin-right: 10px;
              }
              .button-container {
                text-align: center;
                margin: 30px 0;
              }
              .reset-button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 16px 40px;
                text-decoration: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
              }
              .reset-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
              }
              .info-box {
                background-color: #f0f4ff;
                border-left: 4px solid #667eea;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
              }
              .info-box p {
                margin: 8px 0;
                font-size: 14px;
                color: #555;
              }
              .footer {
                background-color: #f9f9f9;
                padding: 20px 30px;
                text-align: center;
                border-top: 1px solid #e0e0e0;
              }
              .footer p {
                color: #999;
                font-size: 13px;
                margin: 5px 0;
              }
              .divider {
                height: 2px;
                background: linear-gradient(90deg, transparent, #667eea, transparent);
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Redefinição de Senha</h1>
              </div>
              
              <div class="content">
                <p><span class="emoji">📧</span>Olá,</p>
                
                <p>Você solicitou a redefinição de senha. Para continuar, clique no botão abaixo:</p>
                
                <div class="button-container">
                  <a href="${resetUrl}" class="reset-button">🔑 Redefinir Senha</a>
                </div>
                
                <div class="divider"></div>
                
                <div class="info-box">
                  <p><strong>⏰ Importante:</strong> Este link expira em 1 hora.</p>
                  <p><strong>🚨 Aviso:</strong> Se você não solicitou isso, ignore este email.</p>
                </div>
                
                <p style="color: #999; font-size: 13px; margin-top: 30px;">
                  Se o botão não funcionar, copie e cole este link no seu navegador:<br>
                  <span style="word-break: break-all; color: #667eea;">${resetUrl}</span>
                </p>
              </div>
              
              <div class="footer">
                <p>© 2026 Nova Style & Sports. Todos os direitos reservados.</p>
                <p>Este é um email automático, favor não responder.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    res.status(200).json({ message: 'Se o email existir, um link de redefinição foi enviado.' });
  } catch (error) {
    console.error('Erro no forgot password:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}