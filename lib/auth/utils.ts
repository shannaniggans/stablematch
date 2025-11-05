import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';
import type { Role } from '@/lib/constants/enums';

let devUserPromise: Promise<Awaited<ReturnType<typeof prisma.user.findUnique>>> | null = null;

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
  if (env.NODE_ENV !== 'production') {
    process.env.PRACTICE_ID = session.user.practiceId;
    process.env.USER_ID = session.user.id;
  }
  return session.user;
}

export async function optionalUser() {
  const session = await auth();
  if (session?.user) {
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
