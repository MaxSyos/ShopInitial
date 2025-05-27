import { Controller, All, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';

@Controller('paymants')
export class PaymentAliasController {
  @All('webhook')
  async redirectWebhook(@Req() req: Request, @Res() res: Response) {
    // Redireciona para a URL correta mantendo o método, headers e query params
    const targetUrl = req.url.replace('/paymants/', '/payments/');
    return res.redirect(307, targetUrl);
  }
}
