import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PracticeForm } from '@/components/settings/practice-form';

export default async function SettingsPage() {
  const user = await requireUser();
  const practice = await prisma.practice.findUnique({ where: { id: user.practiceId } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Update basic practice details and account information.</p>
      </div>
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Practice details</CardTitle>
          <CardDescription>This information appears on invoices and client emails.</CardDescription>
        </CardHeader>
        <CardContent>
          <PracticeForm name={practice?.name ?? 'Practice'} timezone={practice?.timezone ?? 'Australia/Sydney'} />
        </CardContent>
      </Card>
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Your profile</CardTitle>
          <CardDescription>Managed via your authentication provider.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p><span className="font-medium text-foreground">Name:</span> {user.name ?? 'Team member'}</p>
          <p><span className="font-medium text-foreground">Email:</span> {user.email ?? '—'}</p>
          <p><span className="font-medium text-foreground">Role:</span> {user.role}</p>
        </CardContent>
      </Card>
    </div>
  );
}
