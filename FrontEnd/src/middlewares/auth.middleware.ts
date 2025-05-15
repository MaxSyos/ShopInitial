import { NextApiRequest, NextApiResponse } from "next";

export async function authMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void
) {
  if (!req.session?.userId) {
    res.status(401).json({ message: "Não autenticado" });
    return;
  }

  next();
}
