import { requireClient } from '@/lib/auth/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientSaddleManager } from '@/components/portal/client-saddles';
import { listClientSaddles } from '@/lib/server/saddle';

export default async function PortalTackRoomPage() {
  const { client } = await requireClient();
  const saddles = await listClientSaddles(client.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Tack Room</CardTitle>
        <CardDescription>Share saddle details so your practitioner arrives prepared.</CardDescription>
      </CardHeader>
      <CardContent>
        <ClientSaddleManager
          initialSaddles={saddles.map((saddle) => ({
            id: saddle.id,
            type: saddle.type,
            color: saddle.color,
            brand: saddle.brand,
            seatSize: saddle.seatSize,
            gulletWidth: saddle.gulletWidth,
            notes: saddle.notes,
          }))}
        />
      </CardContent>
    </Card>
  );
}
