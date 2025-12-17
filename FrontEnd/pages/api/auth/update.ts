import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { requireAuth, getUserFromRequest } from '../_utils/auth';
import { unmaskCPF, unmaskWhatsApp } from '../../../utilities/masks';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // @ts-ignore
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ message: 'Não autorizado' });

  if (req.method !== 'PUT' && req.method !== 'PATCH') {
    res.setHeader('Allow', ['PUT', 'PATCH']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { name, cpf, whatsapp } = req.body;
  
  // Validate required fields
  if (!name) return res.status(400).json({ message: 'Nome é obrigatório' });

  // Build update data
  const updateData: any = { name };

  // Validate and format CPF if provided
  if (cpf) {
    const cleanCPF = unmaskCPF(cpf);
    if (cleanCPF.length !== 11) {
      return res.status(400).json({ message: 'CPF inválido. Deve conter 11 dígitos' });
    }
    updateData.cpf = cleanCPF;
  } else if (cpf === '') {
    updateData.cpf = null; // Allow clearing the field
  }

  // Validate and format WhatsApp if provided
  if (whatsapp) {
    const cleanWhatsApp = unmaskWhatsApp(whatsapp);
    if (cleanWhatsApp.length !== 11 && cleanWhatsApp.length !== 13) {
      return res.status(400).json({ message: 'WhatsApp inválido. Deve conter 11 ou 13 dígitos' });
    }
    // Store with country code if not present
    updateData.whatsapp = cleanWhatsApp.startsWith('55') ? cleanWhatsApp : `55${cleanWhatsApp}`;
  } else if (whatsapp === '') {
    updateData.whatsapp = null; // Allow clearing the field
  }

  try {
    // @ts-ignore
    const updated = await prisma.user.update({ where: { id: user.id }, data: updateData });
    return res.status(200).json({ 
      user: { 
        id: updated.id, 
        name: updated.name, 
        email: updated.email,
        cpf: updated.cpf,
        whatsapp: updated.whatsapp
      } 
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário', error);
    return res.status(500).json({ message: 'Erro interno' });
  }
}

export default requireAuth(handler);
