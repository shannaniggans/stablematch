// lib/validation/appointment.ts
import { z } from 'zod';
import { APPOINTMENT_STATUS_VALUES } from '@/lib/constants/enums';

export const AppointmentCreateSchema = z.object({
  practitionerId: z.string().min(1),
  clientId: z.string().min(1),
  horseId: z.string().optional(),
  serviceId: z.string().min(1),
  start: z.string().datetime(), // ISO string
  end: z.string().datetime(),   // ISO string
  locationText: z.string().optional(),
  status: z.enum(APPOINTMENT_STATUS_VALUES).optional(),
});
export type AppointmentCreateInput = z.infer<typeof AppointmentCreateSchema>;

export const AppointmentUpdateSchema = z.object({
  status: z.enum(APPOINTMENT_STATUS_VALUES).optional(),
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
  locationText: z.string().optional(),
  serviceId: z.string().min(1).optional(),
  horseId: z.string().optional().or(z.literal(null)).optional(),
  practitionerId: z.string().min(1).optional(),
  clientId: z.string().min(1).optional(),
});
export type AppointmentUpdateInput = z.infer<typeof AppointmentUpdateSchema>;

export const AppointmentListQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  practitionerId: z.string().optional(),
  clientId: z.string().optional(),
  status: z.enum(APPOINTMENT_STATUS_VALUES).optional(),
});
