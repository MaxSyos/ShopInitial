import { NextApiRequest, NextApiResponse } from "next";
import nc from "next-connect";
import { applyMiddlewares } from "../../../../src/middlewares/apply-middlewares";
import { sessionMiddleware } from "../../../../src/middlewares/session.middleware";
import { SessionService } from "../../../../src/services/session.service";

const handler = nc();

handler.use(applyMiddlewares([sessionMiddleware]));

handler.post(async (req: NextApiRequest, res: NextApiResponse) => {
  if (!req.session?.id) {
    res.status(401).json({ message: "Não autenticado" });
    return;
  }

  const sessionService = new SessionService();
  await sessionService.deleteSession(req.session.id);

  // Limpa o cookie de sessão
  res.setHeader(
    "Set-Cookie",
    `sessionId=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`
  );

  res.status(200).json({ message: "Logout realizado com sucesso" });
});
