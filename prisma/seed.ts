// prisma/seed.ts
/* Run with:
 * npx prisma db seed
 * (Ensure package.json has: "prisma": { "seed": "ts-node prisma/seed.ts" })
 * Or compile to JS and run with node.
 */

import { PrismaClient, Role, ApptStatus, InvoiceStatus } from '@prisma/client';

const prisma = new PrismaClient();

function isoAtLocalTime(date: Date, hours: number, minutes: number) {
  // Creates a Date on the same day at local time, then returns ISO UTC string.
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

async function main() {
  // Clean slate (idempotent-ish)
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.invoiceItem.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.note.deleteMany(),
    prisma.appointment.deleteMany(),
    prisma.availability.deleteMany(),
    prisma.service.deleteMany(),
    prisma.horse.deleteMany(),
    prisma.client.deleteMany(),
    prisma.account.deleteMany(),
    prisma.session.deleteMany(),
    prisma.user.deleteMany(),
    prisma.practice.deleteMany(),
  ]);

  // Practice
  const practice = await prisma.practice.create({
    data: {
      name: 'Demo Stable',
      timezone: 'Australia/Sydney',
    },
  });

  // Users
  const owner = await prisma.user.create({
    data: {
      name: 'Owner One',
      email: 'owner@example.com',
      role: Role.owner,
      practiceId: practice.id,
      emailVerified: null,
    },
  });

  const practitioner = await prisma.user.create({
    data: {
      name: 'Dr. Alex Hoof',
      email: 'practitioner@example.com',
      role: Role.practitioner,
      practiceId: practice.id,
    },
  });

  const receptionist = await prisma.user.create({
    data: {
      name: 'Sam Frontdesk',
      email: 'reception@example.com',
      role: Role.receptionist,
      practiceId: practice.id,
    },
  });

  // Services
  const [lameness, trim, massage] = await prisma.$transaction([
    prisma.service.create({
      data: {
        practiceId: practice.id,
        name: 'Lameness Assessment',
        durationMins: 60,
        priceCents: 18000,
        taxRate: 0.1,
      },
    }),
    prisma.service.create({
      data: {
        practiceId: practice.id,
        name: 'Trim',
        durationMins: 45,
        priceCents: 9000,
        taxRate: 0.1,
      },
    }),
    prisma.service.create({
      data: {
        practiceId: practice.id,
        name: 'Massage',
        durationMins: 60,
        priceCents: 12000,
        taxRate: 0.1,
      },
    }),
  ]);

  // Clients + Horses
  const clientA = await prisma.client.create({
    data: {
      practiceId: practice.id,
      firstName: 'Taylor',
      lastName: 'Rider',
      email: 'taylor.rider@example.com',
      phone: '+61 400 000 001',
      address: '123 Paddock Lane, NSW',
      notes: 'Prefers mornings.',
    },
  });

  const horseA = await prisma.horse.create({
    data: {
      clientId: clientA.id,
      name: 'Storm Dancer',
      breed: 'Thoroughbred',
      age: 7,
      notes: 'Previous hock issue.',
    },
  });

  const clientB = await prisma.client.create({
    data: {
      practiceId: practice.id,
      firstName: 'Morgan',
      lastName: 'Farrier',
      email: 'morgan.f@example.com',
      phone: '+61 400 000 002',
      address: '7 Bridle Path, VIC',
    },
  });

  const horseB = await prisma.horse.create({
    data: {
      clientId: clientB.id,
      name: 'River Song',
      breed: 'Quarter Horse',
      age: 10,
    },
  });

  // Availability (Mon–Fri 09:00–17:00)
  const weekdays = [1, 2, 3, 4, 5]; // Mon..Fri
  await prisma.$transaction(
    weekdays.map((wd) =>
      prisma.availability.create({
        data: {
          practitionerId: practitioner.id,
          weekday: wd,
          startTime: '09:00',
          endTime: '17:00',
        },
      }),
    ),
  );

  // Appointments (this week)
  const now = new Date();
  // Make two future appointments and one completed in the past
  const nextDay = new Date(now);
  nextDay.setDate(now.getDate() + 1);

  const twoDays = new Date(now);
  twoDays.setDate(now.getDate() + 2);

  const lastWeek = new Date(now);
  lastWeek.setDate(now.getDate() - 7);

  const appt1 = await prisma.appointment.create({
    data: {
      practiceId: practice.id,
      practitionerId: practitioner.id,
      clientId: clientA.id,
      horseId: horseA.id,
      serviceId: lameness.id,
      start: isoAtLocalTime(nextDay, 10, 0),
      end: isoAtLocalTime(nextDay, 11, 0),
      status: ApptStatus.confirmed,
      locationText: 'On-site: 123 Paddock Lane',
    },
    include: { service: true, client: true },
  });

  const appt2 = await prisma.appointment.create({
    data: {
      practiceId: practice.id,
      practitionerId: practitioner.id,
      clientId: clientB.id,
      horseId: horseB.id,
      serviceId: trim.id,
      start: isoAtLocalTime(twoDays, 14, 0),
      end: isoAtLocalTime(twoDays, 14, 45),
      status: ApptStatus.scheduled,
      locationText: 'Clinic',
    },
  });

  const apptCompleted = await prisma.appointment.create({
    data: {
      practiceId: practice.id,
      practitionerId: practitioner.id,
      clientId: clientA.id,
      horseId: horseA.id,
      serviceId: massage.id,
      start: isoAtLocalTime(lastWeek, 9, 0),
      end: isoAtLocalTime(lastWeek, 10, 0),
      status: ApptStatus.completed,
      locationText: 'On-site: 123 Paddock Lane',
    },
    include: { service: true },
  });

  // Notes
  await prisma.note.create({
    data: {
      appointmentId: appt1.id,
      authorId: practitioner.id,
      body: 'Initial assessment scheduled. Bring prior vet records.',
      isPrivate: true,
    },
  });

  await prisma.note.create({
    data: {
      appointmentId: apptCompleted.id,
      authorId: practitioner.id,
      body: 'Massage well tolerated. Recommend follow-up in 2 weeks.',
      isPrivate: true,
    },
  });

  // Invoice for completed appointment
  const invSubtotal = massage.priceCents;
  const invTax = Math.round(invSubtotal * 0.1);
  const invTotal = invSubtotal + invTax;

  const invoice = await prisma.invoice.create({
    data: {
      practiceId: practice.id,
      number: 'INV-0001',
      clientId: clientA.id,
      issuedAt: new Date(),
      dueAt: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
      status: InvoiceStatus.draft,
      subtotalCents: invSubtotal,
      taxCents: invTax,
      totalCents: invTotal,
      items: {
        create: [
          {
            description: 'Massage (60m)',
            qty: 1,
            unitPriceCents: massage.priceCents,
            taxRate: 0.1,
          },
        ],
      },
    },
    include: { items: true },
  });

  // Example payment (commented by default)
  // await prisma.payment.create({
  //   data: {
  //     invoiceId: invoice.id,
  //     amountCents: invTotal,
  //     method: 'cash',
  //     paidAt: new Date(),
  //   },
  // });

  // Audit logs (examples)
  await prisma.auditLog.createMany({
    data: [
      {
        practiceId: practice.id,
        userId: owner.id,
        entityType: 'Practice',
        entityId: practice.id,
        action: 'create',
        createdAt: new Date(),
      },
      {
        practiceId: practice.id,
        userId: practitioner.id,
        entityType: 'Appointment',
        entityId: appt1.id,
        action: 'create',
        createdAt: new Date(),
      },
      {
        practiceId: practice.id,
        userId: practitioner.id,
        entityType: 'Invoice',
        entityId: invoice.id,
        action: 'create',
        createdAt: new Date(),
      },
    ],
  });

  console.log('Seed complete ✅');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
