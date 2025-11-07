import { requireClient } from '@/lib/auth/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientProfileForm } from '@/components/portal/client-profile-form';

export default async function PortalProfilePage() {
  const { client } = await requireClient();

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Your profile</CardTitle>
          <CardDescription>Keep your contact details current so the team can stay in touch.</CardDescription>
        </CardHeader>
        <CardContent>
          <ClientProfileForm
            initial={{
              firstName: client.firstName,
              lastName: client.lastName,
              email: client.email,
              phone: client.phone,
              address: client.address,
              notes: client.notes,
              shareProfileWithPractitioners: client.shareProfileWithPractitioners,
              shareHorsesWithPractitioners: client.shareHorsesWithPractitioners,
            }}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Practice</CardTitle>
          <CardDescription>Your FullStride provider details.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{client.practice.name}</p>
          <p>Timezone: {client.practice.timezone}</p>
          <p className="mt-2">
            Need help? Contact the practice directly to update bookings or receive assistance with the portal.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
