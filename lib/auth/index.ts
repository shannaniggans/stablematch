import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import CredentialsProvider from 'next-auth/providers/credentials';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import type { NextAuthConfig } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';
import type { Role } from '@/lib/constants/enums';

const demoPracticeName = env.DEV_PRACTICE_NAME ?? 'Demo Practice';
const devOwnerEmail = env.DEV_LOGIN_EMAIL ?? 'demo@fullstride.local';
const devOwnerPassword = env.DEV_LOGIN_PASSWORD ?? 'demo-login';
const devClientEmail = env.DEV_CLIENT_EMAIL ?? 'client@fullstride.local';
const devClientPassword = env.DEV_CLIENT_PASSWORD ?? 'client-login';

async function ensureDemoPractice() {
  let practice = await prisma.practice.findFirst({
    where: { name: demoPracticeName },
  });
  if (!practice) {
    practice = await prisma.practice.create({
      data: { name: demoPracticeName, timezone: 'Australia/Sydney' },
    });
  }
  return practice;
}

const emailServer =
  env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASSWORD
    ? {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
    }
    : {
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    };

async function sendEmailVerification({ identifier, url }: { identifier: string; url: string }) {
  const transporter = nodemailer.createTransport(emailServer as nodemailer.TransportOptions);
  const fromAddress = env.EMAIL_FROM ?? 'auth@fullstride.local';

  await transporter.sendMail({
    to: identifier,
    from: fromAddress,
    subject: 'Your FullStride sign-in link',
    text: 'Sign in to FullStride: ' + url,
    html: '<p>Click to sign in:</p><p><a href="' + url + '">' + url + '</a></p>',
  });

  if ('streamTransport' in emailServer) {
    console.warn('Email provider not configured. Sign-in link:', url);
  }
}

const providers: NextAuthConfig['providers'] = [
  EmailProvider({
    from: env.EMAIL_FROM ?? 'auth@fullstride.local',
    server: emailServer,
    sendVerificationRequest: sendEmailVerification,
  }),
  CredentialsProvider({
    name: 'Password Login',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials.password) return null;

      if (env.NODE_ENV !== 'production') {
        if (credentials.email === devOwnerEmail && credentials.password === devOwnerPassword) {
          const practice = await ensureDemoPractice();
          let user = await prisma.user.findUnique({ where: { email: devOwnerEmail } });
          if (!user) {
            user = await prisma.user.create({
              data: {
                email: devOwnerEmail,
                name: 'Demo Owner',
                role: 'owner',
                practiceId: practice.id,
              },
            });
          } else if (!user.practiceId) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { practiceId: practice.id, role: user.role ?? 'owner' },
            });
          }
          return user;
        }

        if (credentials.email === devClientEmail && credentials.password === devClientPassword) {
          const practice = await ensureDemoPractice();
          let user = await prisma.user.findUnique({ where: { email: devClientEmail } });
          if (!user) {
            user = await prisma.user.create({
              data: {
                email: devClientEmail,
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

          await prisma.client.upsert({
            where: { userId: user.id },
            update: {
              practiceId: practice.id,
              firstName: 'Demo',
              lastName: 'Client',
              email: devClientEmail,
            },
            create: {
              practiceId: practice.id,
              userId: user.id,
              firstName: 'Demo',
              lastName: 'Client',
              email: devClientEmail,
            },
          });

          return user;
        }
      }

      const user = await prisma.user.findUnique({ where: { email: credentials.email } });
      if (!user?.passwordHash) {
        return null;
      }
      const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
      if (!isValid) {
        return null;
      }
      return user;
    },
  }),
];

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'database' },
  secret: env.AUTH_SECRET,
  trustHost: true,
  providers,
  pages: {
    signIn: '/signin',
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role as Role;
        session.user.practiceId = user.practiceId;
        if ((user.role as Role) === 'client') {
          const clientProfile = await prisma.client.findUnique({
            where: { userId: user.id },
            select: { id: true },
          });
          session.user.clientId = clientProfile?.id ?? null;
        } else {
          session.user.clientId = null;
        }
      }
      return session;
    },
    async signIn({ user }) {
      if (!user.practiceId) {
        if ((user.role as Role | null) === 'client') {
          throw new Error('Client account is missing practice assignment.');
        }
        const practice = await prisma.practice.create({
          data: {
            name: (user.name ?? 'New User') + "'s Practice",
          },
        });
        await prisma.user.update({
          where: { id: user.id },
          data: { practiceId: practice.id, role: 'owner' },
        });
        user.practiceId = practice.id;
        user.role = 'owner' as Role;
      }
      return true;
    },
  },
  events: {
    async signIn({ user }) {
      if (!user.practiceId) return;
      await prisma.auditLog.create({
        data: {
          practiceId: user.practiceId,
          userId: user.id,
          entityType: 'User',
          entityId: user.id,
          action: 'signin',
        },
      });
    },
  },
};

const authResult = NextAuth(authConfig);

export const { auth, signIn, signOut } = authResult;
export const { GET, POST } = authResult.handlers;
