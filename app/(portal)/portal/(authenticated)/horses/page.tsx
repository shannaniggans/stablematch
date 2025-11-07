import { prisma } from '@/lib/prisma';
import { requireClient } from '@/lib/auth/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientHorseManager } from '@/components/portal/client-horses';

export default async function PortalHorsesPage() {
  const { client } = await requireClient();
  const horses = await prisma.horse.findMany({
    where: { clientId: client.id },
    orderBy: { name: 'asc' },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your horses</CardTitle>
        <CardDescription>Track and update the details for each horse in your care.</CardDescription>
      </CardHeader>
      <CardContent>
        <ClientHorseManager
          initialHorses={horses.map((horse) => ({
            id: horse.id,
            name: horse.name,
            breed: horse.breed,
            age: horse.age,
            dateOfBirth: horse.dateOfBirth ? horse.dateOfBirth.toISOString() : null,
            typeOfRiding: horse.typeOfRiding,
            educationLevel: horse.educationLevel,
            behaviouralNotes: horse.behaviouralNotes,
            lastDentalDate: horse.lastDentalDate ? horse.lastDentalDate.toISOString() : null,
            lastVaccinationDate: horse.lastVaccinationDate ? horse.lastVaccinationDate.toISOString() : null,
            lastSaddleFitDate: horse.lastSaddleFitDate ? horse.lastSaddleFitDate.toISOString() : null,
            lastWormingDate: horse.lastWormingDate ? horse.lastWormingDate.toISOString() : null,
            propertyName: horse.propertyName,
            propertyAddress: horse.propertyAddress,
            picNumber: horse.picNumber,
            photoDataUrl: horse.photoDataUrl,
            color: horse.color,
            height: horse.height,
            sex: horse.sex,
            notes: horse.notes,
          }))}
        />
      </CardContent>
    </Card>
  );
}
