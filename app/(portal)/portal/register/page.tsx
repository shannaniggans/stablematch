import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientRegisterForm } from '@/components/portal/client-register-form';

interface RegisterPageProps {
  searchParams: { practiceId?: string; email?: string };
}

export default async function ClientPortalRegisterPage({ searchParams }: RegisterPageProps) {
  const practiceId = searchParams.practiceId;
  if (!practiceId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 px-4 py-12">
        <Card className="w-full max-w-md border-muted bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle>Practice not specified</CardTitle>
            <CardDescription>Please use the registration link provided by your practice.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const practice = await prisma.practice.findUnique({ where: { id: practiceId } });
  if (!practice) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 px-4 py-12">
        <Card className="w-full max-w-md border-muted bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle>Practice not found</CardTitle>
            <CardDescription>Check with your practice to confirm the registration link.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 px-4 py-12">
      <Card className="w-full max-w-2xl border-muted bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Create your client account</CardTitle>
          <CardDescription>Join {practice.name} on FullStride.</CardDescription>
        </CardHeader>
        <CardContent>
          <ClientRegisterForm practiceId={practice.id} practiceName={practice.name} />
        </CardContent>
      </Card>
    </div>
  );
}
