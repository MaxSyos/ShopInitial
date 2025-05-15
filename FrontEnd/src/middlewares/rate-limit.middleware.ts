import { NextApiRequest, NextApiResponse } from 'next';
import { RateLimitService } from '../services/rate-limit.service';

export async function rateLimitMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void
) {
  const rateLimit = new RateLimitService();
  const key = `rate-limit:${req.ip}`;

  const { limited, remaining } = await rateLimit.isRateLimited(key);

  const headers = rateLimit.getHeaders(remaining);
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (limited) {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Por favor, tente novamente mais tarde.'
    });
    return;
  }

  next();
}
