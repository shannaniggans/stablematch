import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/utils';
import { ClientsTable, ClientOverview } from '@/components/clients/clients-table';

function parseCity(address?: string | null) {
  if (!address) return null;
  const parts = address.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const last = parts[parts.length - 1];
    const before = parts[parts.length - 2];
    return before + ', ' + last;
  }
  return parts[0] ?? null;
}

export default async function ClientsPage() {
  const user = await requireUser();
  const clients = await prisma.client.findMany({
    where: { practiceId: user.practiceId },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    take: 20,
    include: {
      horses: true,
      appts: { orderBy: { start: 'desc' }, take: 1 },
    },
  });

  const initialClients: ClientOverview[] = clients.map((client) => ({
    id: client.id,
    name: (client.firstName + ' ' + client.lastName).trim(),
    email: client.email,
    phone: client.phone,
    horses: client.horses.length,
    city: parseCity(client.address),
    lastSeen: client.appts[0]?.start?.toISOString() ?? null,
  }));

  return <ClientsTable initialClients={initialClients} />;
}
