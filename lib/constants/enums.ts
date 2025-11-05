export const ROLE_VALUES = ['owner', 'practitioner', 'receptionist', 'read_only'] as const;
export type Role = (typeof ROLE_VALUES)[number];

export const APPOINTMENT_STATUS_VALUES = ['scheduled', 'confirmed', 'completed', 'cancelled'] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUS_VALUES)[number];

export const INVOICE_STATUS_VALUES = ['draft', 'sent', 'paid', 'void'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUS_VALUES)[number];
