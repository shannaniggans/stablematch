// lib/tenancy.ts
import { NextRequest } from 'next/server';

/**
 * MVP tenancy helper.
 * For production, derive practiceId from session.user.practiceId (NextAuth).
 * For now, accept 'x-practice-id' header or fallback to ENV PRACTICE_ID for local dev.
 */
export function getPracticeId(req: NextRequest): string {
  const hdr = req.headers.get('x-practice-id');
  const envId = process.env.PRACTICE_ID;
  const practiceId = hdr || envId;
  if (!practiceId) {
    throw new Error('Missing practiceId. Provide header "x-practice-id" or set PRACTICE_ID.');
  }
  return practiceId;
}

/**
 * Temporary helper until NextAuth session is wired.
 * Accepts `x-user-id` header or USER_ID env for tooling/tests.
 */
export function getUserId(req: NextRequest): string {
  const hdr = req.headers.get('x-user-id');
  const envUser = process.env.USER_ID;
  const userId = hdr || envUser;
  if (!userId) {
    throw new Error('Missing userId. Provide header "x-user-id" or set USER_ID.');
  }
  return userId;
}

export function getUserIdOptional(req: NextRequest): string | undefined {
  try {
    return getUserId(req);
  } catch {
    return undefined;
  }
}
