import { NextRequest, NextResponse } from 'next/server';
import { requireClient } from '@/lib/auth/utils';
import { ClientPortalSaddleCreateSchema } from '@/lib/validation/portal';
import { createClientSaddle, listClientSaddles } from '@/lib/server/saddle';

export async function GET() {
  try {
    const { client } = await requireClient();
    const saddles = await listClientSaddles(client.id);
    return NextResponse.json({ items: saddles });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Unable to load tack room' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { client } = await requireClient();
    const json = await req.json();
    const parsed = ClientPortalSaddleCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const saddle = await createClientSaddle(client.id, parsed.data);
    return NextResponse.json(saddle, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Unable to add saddle' }, { status: 500 });
  }
}
