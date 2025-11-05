import { DefaultSession } from 'next-auth';
import type { Role } from '@/lib/constants/enums';

declare module 'next-auth' {
  interface User {
    id: string;
    role: Role;
    practiceId: string;
  }

  interface Session {
    user: DefaultSession['user'] & {
      id: string;
      role: Role;
      practiceId: string;
    };
  }
}
