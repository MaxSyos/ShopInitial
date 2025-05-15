import { NextApiRequest, NextApiResponse } from 'next';
import { SessionService } from '../services/session.service';

declare module 'next' {
  interface NextApiRequest {
    session?: {
      id: string;
      userId: string;
      email: string;
    };
  }
}

export async function sessionMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void
) {
  const sessionService = new SessionService();
  const sessionId = req.cookies['sessionId'];

  if (!sessionId) {
    next();
    return;
  }

  const session = await sessionService.getSession(sessionId);
  if (!session) {
    res.setHeader('Set-Cookie', `sessionId=; Path=/; Expires=${new Date(0)}`);
    next();
    return;
  }

  // Verifica se a sessão expirou
  if (Date.now() > session.expiresAt) {
    await sessionService.deleteSession(sessionId);
    res.setHeader('Set-Cookie', `sessionId=; Path=/; Expires=${new Date(0)}`);
    next();
    return;
  }

  // Renova a sessão se estiver próxima de expirar (menos de 1 dia)
  const oneDayInMs = 24 * 60 * 60 * 1000;
  if (session.expiresAt - Date.now() < oneDayInMs) {
    await sessionService.refreshSession(sessionId);
  }

  // Adiciona os dados da sessão ao request
  req.session = {
    id: sessionId,
    userId: session.userId,
    email: session.email
  };

  next();
}
