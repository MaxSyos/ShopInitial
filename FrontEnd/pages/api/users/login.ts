import { NextApiRequest, NextApiResponse } from "next";
import nc from "next-connect";
import bcrypt from "bcryptjs";
import { client } from "../../../lib/client";
import { signToken } from "../../../utilities/auth";
import { applyMiddlewares } from "../../../../src/middlewares/apply-middlewares";
import { rateLimitMiddleware } from "../../../../src/middlewares/rate-limit.middleware";
import { SessionService } from "../../../../src/services/session.service";

const handler = nc();

handler.use(applyMiddlewares([rateLimitMiddleware]));

handler.post(async (req: NextApiRequest, res: NextApiResponse) => {
  const user = await client.fetch(`*[_type == "user" && email == $email][0]`, {
    email: req.body.email,
  });
  if (user && bcrypt.compareSync(req.body.password, user.password)) {
    const token = signToken({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    });

    // Criar sessão no Redis
    const sessionService = new SessionService();
    const sessionId = await sessionService.createSession(user._id, user.email);

    // Configurar cookie de sessão
    res.setHeader('Set-Cookie', `sessionId=${sessionId}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${30 * 24 * 60 * 60}`);

    res.send({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token,
    });
  } else {
    res.status(401).send({ message: "Invalid_email_or_password" });
  }
});

export default handler;
