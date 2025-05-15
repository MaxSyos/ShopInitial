import { NextApiRequest, NextApiResponse } from "next";
import nc from "next-connect";
import { applyMiddlewares } from "../../../../src/middlewares/apply-middlewares";
import { sessionMiddleware } from "../../../../src/middlewares/session.middleware";
import { authMiddleware } from "../../../../src/middlewares/auth.middleware";
import { rateLimitMiddleware } from "../../../../src/middlewares/rate-limit.middleware";

const handler = nc();

handler.use(applyMiddlewares([
  rateLimitMiddleware,
  sessionMiddleware,
  authMiddleware
]));

handler.get(async (req: NextApiRequest, res: NextApiResponse) => {
  // Esta rota só pode ser acessada por usuários autenticados
  res.json({
    message: "Rota protegida",
    user: {
      id: req.session!.userId,
      email: req.session!.email
    }
  });
});
