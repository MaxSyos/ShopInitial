import { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest } from './_utils/auth';
import prisma from '../../lib/prisma';

// Helper para formatar order com dados de imagem dos produtos
function formatOrderWithImages(order: any) {
  return {
    ...order,
    items: (order.items || []).map((it: any) => ({
      id: it.id,
      productId: it.productId,
      productName: it.product?.name || it.productName || '',
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      total: it.total,
      product: it.product ? {
        id: it.product.id,
        name: it.product.name,
        image: it.product.image,
        images: it.product.images
      } : null
    }))
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // autenticação via token Bearer (helper local)
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  if (req.method === 'POST') {
    try {
      const payload = req.body;
      console.log('/api/orders POST payload:', JSON.stringify(payload).slice(0, 2000));

      // Calcular valores financeiros do pedido caso não venham no payload
      const items = Array.isArray(payload.items) ? payload.items : [];

      const calcSubtotal = items.reduce((s: number, it: any) => {
        const unit = Number(it.price ?? it.unitPrice ?? 0) || 0;
        const qty = Number(it.quantity ?? 0) || 0;
        return s + unit * qty;
      }, 0);

      // Configuráveis via env: FREE_SHIPPING_THRESHOLD e DEFAULT_SHIPPING_COST
      const FREE_SHIPPING_THRESHOLD = Number(process.env.FREE_SHIPPING_THRESHOLD || '0.01');
      const DEFAULT_SHIPPING_COST = Number(process.env.DEFAULT_SHIPPING_COST || '0.01');

      const calcShippingCost = (payload.shippingCost !== undefined && payload.shippingCost !== null)
        ? Number(payload.shippingCost)
        : (calcSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_COST);

      // Total = Subtotal + Frete (sem taxa)
      const calcTotal = Math.round((calcSubtotal + calcShippingCost) * 100) / 100;

      // Persistir pedido localmente com transação para garantir atomicidade
      const createdOrder = await prisma.$transaction(async (tx) => {
        // Criar order
        const order = await tx.order.create({
          data: {
            user: { connect: { id: user.id } },
            shippingAddress: payload.shippingAddress || {},
            billingAddress: payload.billingAddress || null,
            subtotal: Number(payload.subtotal ?? calcSubtotal),
            shippingCost: Number(payload.shippingCost ?? calcShippingCost),
            tax: 0,
            total: Number(payload.total ?? calcTotal),
            status: 'PENDING',
            paymentInstallments: 2,
            isLocalPickup: payload.isLocalPickup === true,
            itemsJson: payload.items || [],
          }
        });

        // Calcular parcelas: 50% cada uma
        const totalAmount = Number(payload.total ?? calcTotal);
        const inst1Amount = Math.round((totalAmount / 2) * 100) / 100;
        const inst2Amount = Math.round((totalAmount - inst1Amount) * 100) / 100;

        // Criar 2 parcelas PIX automaticamente
        await tx.paymentInstallment.createMany({
          data: [
            {
              orderId: order.id,
              installmentNumber: 1,
              amount: inst1Amount,
              status: 'PENDING',
              expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutos
            },
            {
              orderId: order.id,
              installmentNumber: 2,
              amount: inst2Amount,
              status: 'PENDING',
              expiresAt: null, // SEM EXPIRAÇÃO
            },
          ],
        });

        return order;
      });

  // Criar OrderItems locais (opcionalmente)
      const itemsDebug: any[] = [];
      const missingProducts: string[] = [];

  if (items.length > 0) {
        for (const it of items) {
          const productId = String(it.productId);
          // Verificar se o produto existe antes de tentar conectar (evita erro do Prisma)
          const product = await prisma.product.findUnique({ where: { id: productId } }).catch(() => null);
          if (!product) {
            missingProducts.push(productId);
            itemsDebug.push({ productId, productExists: false });
            continue;
          }

          // criar o OrderItem conectando ao produto existente
          try {
            const createdItem = await prisma.orderItem.create({
              data: {
                order: { connect: { id: createdOrder.id } },
                product: { connect: { id: productId } },
                quantity: it.quantity || 0,
                unitPrice: it.price || 0,
                total: (it.price || 0) * (it.quantity || 0)
              }
            });

            itemsDebug.push({ productId, productExists: true, orderItemId: createdItem.id, quantity: createdItem.quantity, unitPrice: createdItem.unitPrice, total: createdItem.total });
          } catch (e) {
            console.error('Erro criando orderItem para productId', productId, e);
            itemsDebug.push({ productId, productExists: true, error: String(e) });
          }
        }
      }

      // Se houve produtos faltantes, rejeitar a criação apontando os productIds ausentes
      if (missingProducts.length > 0) {
        console.error('Produtos não encontrados ao criar OrderItems:', missingProducts);
        const partialOrder = await prisma.order.findUnique({ where: { id: createdOrder.id } });
        return res.status(400).json({ error: 'Alguns produtos do pedido não foram encontrados', missingProducts, itemsDebug, localOrder: partialOrder });
      }

  // Recuperar pedido local com items para retornar ao frontend
  const localOrder = await prisma.order.findUnique({ where: { id: createdOrder.id }, include: { items: { include: { product: true } } } });
  const formattedOrder = formatOrderWithImages(localOrder);

      // Forward para API upstream — somente se a variável de ambiente apontar para um serviço externo
      const upstream = process.env.NEXT_PUBLIC_API_URL || '';
      const shouldForward = upstream
        && !upstream.includes('localhost')
        && !upstream.includes('127.0.0.1')
        && !upstream.includes('/api');

      if (shouldForward) {
        try {
          const response = await fetch(`${upstream}/orders`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': req.headers.authorization || ''
            },
            body: JSON.stringify(req.body),
          });

          if (!response.ok) {
            const text = await response.text().catch(() => null);
            console.error('Erro ao criar pedido (upstream):', text);
            // Retornar o pedido local criado para o frontend, mas sinalizar que upstream falhou
            return res.status(200).json({ id: formattedOrder?.id || createdOrder.id, localOrder: formattedOrder, warning: 'Pedido criado localmente, mas falha ao criar no serviço upstream' });
          }

          const data = await response.json();

          // Atualizar registro local com externalId/infos do upstream quando disponível
          try {
            await prisma.order.update({ where: { id: createdOrder.id }, data: { externalId: data.id?.toString() || undefined } });
          } catch (e) {
            console.warn('Falha ao atualizar externalId localmente', e);
          }

          // Retornar ambos: id (preferindo external.id), dados upstream e o pedido local completo
          return res.status(200).json({ id: data?.id || formattedOrder?.id || createdOrder.id, external: data, localOrder: formattedOrder });
        } catch (e) {
          console.error('Erro ao conectar com upstream:', e);
          return res.status(200).json({ id: formattedOrder?.id || createdOrder.id, localOrder: formattedOrder, warning: 'Pedido criado localmente; falha ao conectar com upstream' });
        }
      }

      // Se não vamos encaminhar para upstream (ambiente local), apenas retornar o pedido local
      return res.status(200).json({ id: formattedOrder?.id || createdOrder.id, localOrder: formattedOrder, info: 'Pedido criado localmente (sem forward para upstream em ambiente local)'});
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
