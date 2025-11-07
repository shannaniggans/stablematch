import { prisma } from '@/lib/prisma';

type SaddleRecord = {
  id: string;
  clientId: string;
  type: string;
  color: string | null;
  brand: string | null;
  seatSize: string | null;
  gulletWidth: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function hasDelegate() {
  const delegate = (prisma as any).saddle;
  return typeof delegate?.findMany === 'function' ? delegate : null;
}

function buildColumns(data: Record<string, any>) {
  const columns = Object.keys(data);
  const placeholders = columns.map(() => '?').join(', ');
  const values = columns.map((column) => data[column]);
  const quotedColumns = columns.map((column) => `"${column}"`).join(', ');
  return { quotedColumns, placeholders, values };
}

export async function listClientSaddles(clientId: string) {
  const delegate = hasDelegate();
  if (delegate) {
    return delegate.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    }) as Promise<SaddleRecord[]>;
  }

  return prisma.$queryRawUnsafe<SaddleRecord[]>(
    `SELECT * FROM "Saddle" WHERE "clientId" = ? ORDER BY "createdAt" DESC`,
    clientId,
  );
}

export async function createClientSaddle(clientId: string, data: Record<string, any>) {
  const payload = {
    clientId,
    type: data.type,
    color: data.color ?? null,
    brand: data.brand ?? null,
    seatSize: data.seatSize ?? null,
    gulletWidth: data.gulletWidth ?? null,
    notes: data.notes ?? null,
  };
  const delegate = hasDelegate();
  if (delegate) {
    return delegate.create({ data: payload }) as Promise<SaddleRecord>;
  }

  const { quotedColumns, placeholders, values } = buildColumns(payload);
  const rows = await prisma.$queryRawUnsafe<SaddleRecord[]>(
    `INSERT INTO "Saddle" (${quotedColumns}) VALUES (${placeholders}) RETURNING *`,
    ...values,
  );
  return rows[0];
}

export async function updateClientSaddle(id: string, clientId: string, data: Record<string, any>) {
  const payload: Record<string, any> = {};
  ['type', 'color', 'brand', 'seatSize', 'gulletWidth', 'notes'].forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      const value = data[field];
      payload[field] = value === undefined ? undefined : value === '' ? null : value;
    }
  });

  const delegate = hasDelegate();
  if (delegate) {
    return delegate.update({
      where: { id, clientId },
      data: payload,
    }) as Promise<SaddleRecord>;
  }

  const columns = Object.keys(payload);
  if (columns.length === 0) {
    const rows = await prisma.$queryRawUnsafe<SaddleRecord[]>(
      `SELECT * FROM "Saddle" WHERE "id" = ? AND "clientId" = ?`,
      id,
      clientId,
    );
    return rows[0];
  }

  const setClauses = columns.map((column) => `"${column}" = ?`).join(', ');
  const values = columns.map((column) => payload[column]);

  const rows = await prisma.$queryRawUnsafe<SaddleRecord[]>(
    `UPDATE "Saddle" SET ${setClauses}, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ? AND "clientId" = ? RETURNING *`,
    ...values,
    id,
    clientId,
  );
  return rows[0];
}

export async function deleteClientSaddle(id: string, clientId: string) {
  const delegate = hasDelegate();
  if (delegate) {
    await delegate.delete({ where: { id, clientId } });
    return;
  }
  await prisma.$executeRawUnsafe(`DELETE FROM "Saddle" WHERE "id" = ? AND "clientId" = ?`, id, clientId);
}
