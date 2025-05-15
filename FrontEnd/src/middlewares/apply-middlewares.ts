import { NextApiRequest, NextApiResponse } from 'next';
import { sessionMiddleware } from './session.middleware';
import { rateLimitMiddleware } from './rate-limit.middleware';

type Middleware = (
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void
) => void | Promise<void>;

export function applyMiddlewares(middlewares: Middleware[]) {
  return async (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    const runMiddleware = async (index: number) => {
      if (index < middlewares.length) {
        await middlewares[index](req, res, () => runMiddleware(index + 1));
      } else {
        next();
      }
    };

    await runMiddleware(0);
  };
}
