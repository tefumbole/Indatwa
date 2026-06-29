import { z } from 'zod'

export const servicesStepSchema = z.object({
  services: z.array(z.number()).min(1, 'Select at least one service'),
})

export const clientStepSchema = z.object({
  client_name: z.string().min(2, 'Full name is required'),
  client_phone: z.string().min(10, 'Valid phone number is required'),
  client_email: z.string().email('Invalid email').optional().or(z.literal('')),
  client_nationality: z.string().optional(),
  client_country: z.string().optional(),
  client_city: z.string().optional(),
})

export const eventStepSchema = z.object({
  event_title: z.string().min(3, 'Event title is required'),
  event_type: z.string().min(1, 'Event type is required'),
  event_start_date: z.string().min(1, 'Start date is required'),
  event_start_time: z.string().optional(),
  event_end_date: z.string().optional(),
  event_end_time: z.string().optional(),
  number_of_guests: z.coerce.number().int().min(1).optional().or(z.literal('')),
  venue: z.string().optional(),
  event_description: z.string().max(5000).optional(),
})

export type ServicesStep = z.infer<typeof servicesStepSchema>
export type ClientStep = z.infer<typeof clientStepSchema>
export type EventStep = z.infer<typeof eventStepSchema>

export interface DocumentFile {
  file: File
  type: 'passport' | 'national_id' | 'other_identification'
}

export interface RequestFormData extends ClientStep, EventStep {
  services: number[]
  event_date?: string
  signature?: string
  documents: never[]
}

export const EVENT_TYPES = [
  'Wedding', 'Corporate Conference', 'Government / Diplomatic',
  'State Visit', 'Private Celebration', 'Product Launch',
  'Gala Dinner', 'Funeral / Memorial', 'Other',
]

export const STEP_LABELS = [
  'Services', 'Your Info', 'Event Details', 'Review',
]

export const FORM_PLACEHOLDERS = {
  client_name: 'Alpha Bridge Technologies / Sr. Engr. Mbole',
  client_phone: '+250794006160',
  client_email: 'info@alpha-bridge.net',
  client_nationality: 'Rwandese',
  client_country: 'Rwanda',
  client_city: 'Kigali',
  event_title: 'Corporate Launch Event',
  venue: 'Kigali Convention Centre',
  event_description: 'Describe your event requirements...',
  number_of_guests: '100',
}
