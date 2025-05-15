import jwt from "jsonwebtoken";
import { IUser } from "../lib/types/user";
import { SessionService } from "../../src/services/session.service";

export const signToken = (user: IUser) => {
  return jwt.sign(user, process.env.JWT_SECRET as string, {
    expiresIn: "30d",
  });
};

export const validateSession = async (sessionId: string): Promise<boolean> => {
  if (!sessionId) return false;
  
  const sessionService = new SessionService();
  const session = await sessionService.getSession(sessionId);
  
  return session !== null;
};
