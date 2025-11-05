// app/api/invoices/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPracticeId, getUserIdOptional } from '@/lib/tenancy';
import { InvoiceCreateSchema, InvoiceListQuerySchema } from '@/lib/validation/invoice';
import { computeInvoiceTotals, nextInvoiceNumber } from '@/lib/server/invoice';
import { recordAuditLog } from '@/lib/server/audit';

export async function GET(req: NextRequest) {
  try {
    const practiceId = getPracticeId(req);
    const userId = getUserIdOptional(req);
    const { searchParams } = new URL(req.url);
    const parsed = InvoiceListQuerySchema.safeParse({
      status: searchParams.get('status') ?? undefined,
      clientId: searchParams.get('clientId') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query', issues: parsed.error.issues }, { status: 400 });
    }
    const { status, clientId, search, page = 1, pageSize = 20 } = parsed.data;
    const where: any = { practiceId };
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (search) {
      where.OR = [
        { number: { contains: search, mode: 'insensitive' } },
        {
          client: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }
    const [items, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: { client: true, items: true, payments: true },
        orderBy: { issuedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.invoice.count({ where }),
    ]);
    return NextResponse.json({ items, total, page, pageSize });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const practiceId = getPracticeId(req);
    const json = await req.json();
    const parsed = InvoiceCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 });
    }
    const { clientId, issuedAt, dueAt, status, items } = parsed.data;

    const client = await prisma.client.findFirst({
      where: { id: clientId, practiceId },
    });
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const issuedDate = new Date(issuedAt);
    const dueDate = new Date(dueAt);
    if (Number.isNaN(issuedDate.valueOf()) || Number.isNaN(dueDate.valueOf())) {
      return NextResponse.json({ error: 'Invalid invoice dates' }, { status: 400 });
    }
    if (dueDate < issuedDate) {
      return NextResponse.json({ error: 'Due date must be after issue date' }, { status: 400 });
    }

    const totals = computeInvoiceTotals(items);
    const number = await nextInvoiceNumber(practiceId);

    const invoice = await prisma.invoice.create({
      data: {
        practiceId,
        number,
        clientId,
        issuedAt: issuedDate,
        dueAt: dueDate,
        status: status ?? 'draft',
        subtotalCents: totals.subtotalCents,
        taxCents: totals.taxCents,
        totalCents: totals.totalCents,
        items: {
          create: items.map((item) => ({
            description: item.description,
            qty: item.qty,
            unitPriceCents: item.unitPriceCents,
            taxRate: item.taxRate ?? 0.1,
          })),
        },
      },
      include: { client: true, items: true, payments: true },
    });
    await recordAuditLog({
      practiceId,
      userId,
      entityType: 'Invoice',
      entityId: invoice.id,
      action: 'create',
      diffJSON: parsed.data,
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
