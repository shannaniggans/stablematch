import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';
import type { Role } from '@/lib/constants/enums';

let devUserPromise: Promise<Awaited<ReturnType<typeof prisma.user.findUnique>>> | null = null;
let devClientPromise:
  | Promise<{
      user: Awaited<ReturnType<typeof prisma.user.findUnique>>;
      client: Awaited<ReturnType<typeof prisma.client.findFirst>>;
    }>
  | null = null;

async function ensureDevUser() {
  const email = env.DEV_LOGIN_EMAIL ?? 'demo@fullstride.local';
  const practiceName = env.DEV_PRACTICE_NAME ?? 'Demo Practice';

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const practice = await prisma.practice.create({
      data: { name: practiceName, timezone: 'Australia/Sydney' },
    });
    user = await prisma.user.create({
      data: {
        email,
        name: 'Demo Owner',
        role: 'owner' as Role,
        practiceId: practice.id,
      },
    });
  } else if (!user.practiceId) {
    const practice = await prisma.practice.create({
      data: { name: practiceName, timezone: 'Australia/Sydney' },
    });
    user = await prisma.user.update({
      where: { id: user.id },
      data: { practiceId: practice.id, role: user.role ?? ('owner' as Role) },
    });
  }

  process.env.PRACTICE_ID = user.practiceId;
  process.env.USER_ID = user.id;

  return user;
}

async function getDevUser() {
  if (!devUserPromise) {
    devUserPromise = ensureDevUser();
  }
  return devUserPromise;
}

async function ensureDevClient() {
  const email = env.DEV_CLIENT_EMAIL ?? 'client@fullstride.local';
  const practiceName = env.DEV_PRACTICE_NAME ?? 'Demo Practice';

  let practice = await prisma.practice.findFirst({ where: { name: practiceName } });
  if (!practice) {
    practice = await prisma.practice.create({
      data: { name: practiceName, timezone: 'Australia/Sydney' },
    });
  }

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: 'Demo Client',
        role: 'client',
        practiceId: practice.id,
      },
    });
  } else {
    if (!user.practiceId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { practiceId: practice.id, role: 'client' },
      });
    } else if (user.role !== 'client') {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: 'client' },
      });
    }
  }

  let clientRecord = await prisma.client.findFirst({ where: { userId: user.id } });
  if (!clientRecord) {
    clientRecord = await prisma.client.create({
      data: {
        practiceId: practice.id,
        userId: user.id,
        firstName: 'Demo',
        lastName: 'Client',
        email,
      },
    });
  }

  const client = await prisma.client.findUnique({
    where: { id: clientRecord.id },
    include: {
      practice: true,
      shares: {
        include: {
          practitioner: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      },
    },
  });

  process.env.PRACTICE_ID = practice.id;
  process.env.USER_ID = user.id;

  return { user, client };
}

async function getDevClient() {
  if (!devClientPromise) {
    devClientPromise = ensureDevClient();
  }
  return devClientPromise;
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    if (env.NODE_ENV !== 'production') {
      return await getDevUser();
    }
    const headerList = await headers();
    const currentPath = headerList.get('next-url') ?? headerList.get('referer') ?? '/';
    const callback = currentPath ? `?callbackUrl=${encodeURIComponent(currentPath)}` : '';
    redirect(`/signin${callback}`);
  }
  if (session.user.role === 'client') {
    redirect('/portal');
  }
  if (env.NODE_ENV !== 'production') {
    process.env.PRACTICE_ID = session.user.practiceId;
    process.env.USER_ID = session.user.id;
  }
  return session.user;
}

export async function optionalUser() {
  const session = await auth();
  if (session?.user) {
    if (session.user.role === 'client') {
      return session.user;
    }
    if (env.NODE_ENV !== 'production') {
      process.env.PRACTICE_ID = session.user.practiceId;
      process.env.USER_ID = session.user.id;
    }
    return session.user;
  }
  if (env.NODE_ENV !== 'production') {
    return await getDevUser();
  }
  return null;
}

export async function requireClient() {
  const session = await auth();
  if (!session?.user) {
    if (env.NODE_ENV !== 'production') {
      return await getDevClient();
    }
    const headerList = await headers();
    const rawPath = headerList.get('next-url') ?? headerList.get('referer') ?? '/portal';
    let sanitizedPath = rawPath ?? '/portal';
    if (sanitizedPath.startsWith('http')) {
      try {
        const parsed = new URL(sanitizedPath);
        sanitizedPath = parsed.pathname + parsed.search;
      } catch {
        sanitizedPath = '/portal';
      }
    }
    if (sanitizedPath.startsWith('/portal/signin')) {
      sanitizedPath = '/portal';
    }
    const callback = sanitizedPath ? `?callbackUrl=${encodeURIComponent(sanitizedPath)}` : '';
    redirect(`/portal/signin${callback}`);
  }
  if (session.user.role !== 'client') {
    redirect('/dashboard');
  }
  const client = await prisma.client.findUnique({
    where: { userId: session.user.id },
    include: {
      practice: true,
      shares: {
        include: {
          practitioner: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      },
    },
  });
  if (!client) {
    redirect('/portal/onboarding');
  }
  if (env.NODE_ENV !== 'production') {
    process.env.PRACTICE_ID = session.user.practiceId;
    process.env.USER_ID = session.user.id;
  }
  return { user: session.user, client };
}
