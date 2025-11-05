import { SignInCard } from '@/components/auth/signin-card';

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 py-16">
      <div className="text-center space-y-10 max-w-xl">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold text-foreground">FullStride</h1>
          <p className="text-muted-foreground">Scheduling, billing, and client care tools for modern equine practices.</p>
        </div>
        <div className="mx-auto">
          <SignInCard />
        </div>
      </div>
    </main>
  );
}
