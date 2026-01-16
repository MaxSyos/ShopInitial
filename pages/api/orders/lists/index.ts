import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { orderItemId } = req.query;
      if (!orderItemId) return res.status(400).json({ error: 'orderItemId is required' });
      const lists = await prisma.orderItemList.findMany({ where: { orderItemId: String(orderItemId) }, include: { rows: true } });
      return res.status(200).json(lists);
    }

    if (req.method === 'POST') {
      const { orderItemId, rows } = req.body;
      if (!orderItemId || !Array.isArray(rows)) return res.status(400).json({ error: 'orderItemId and rows are required' });

      const created = await prisma.orderItemList.create({
        data: {
          orderItem: { connect: { id: String(orderItemId) } },
          rows: { create: rows.map((r: any) => ({ name: r.name || '', number: r.number || '', size: r.size || 'M' })) }
        },
        include: { rows: true }
      });

      return res.status(201).json(created);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err: any) {
    console.error('orders/lists error', err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
}
