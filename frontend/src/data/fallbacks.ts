import type { BlogPost, Faq, GalleryItem, Service, Testimonial } from '@/lib/api'

export const FALLBACK_SERVICES: Service[] = [
  { id: 1, name: 'Protocol Services', slug: 'protocol-services', short_description: 'Diplomatic protocol for state and corporate events', description: 'Diplomatic protocol for state and corporate events', base_price: 0, price_unit: 'fixed', currency: 'RWF', image_path: '/assets/4-06096c11-f3c0-4d8a-afc5-67cd2b11ca9f.png', is_featured: true },
  { id: 2, name: 'Professional Drivers', slug: 'professional-drivers', short_description: 'Chauffeur services for VIP transportation', description: 'Chauffeur services for VIP transportation', base_price: 0, price_unit: 'fixed', currency: 'RWF', image_path: null, is_featured: false },
  { id: 3, name: 'Translators', slug: 'translators', short_description: 'Professional interpretation services', description: 'Professional interpretation services', base_price: 0, price_unit: 'fixed', currency: 'RWF', image_path: null, is_featured: false },
  { id: 4, name: 'Beverages', slug: 'beverages', short_description: 'Premium beverage catering and service', description: 'Premium beverage catering and service', base_price: 0, price_unit: 'fixed', currency: 'RWF', image_path: null, is_featured: false },
  { id: 5, name: 'Glass Rental', slug: 'glass-rental', short_description: 'Elegant glassware for any occasion', description: 'Elegant glassware for any occasion', base_price: 0, price_unit: 'fixed', currency: 'RWF', image_path: null, is_featured: false },
  { id: 6, name: 'Wedding Cakes', slug: 'wedding-cakes', short_description: 'Custom-designed celebration cakes', description: 'Custom-designed celebration cakes', base_price: 0, price_unit: 'fixed', currency: 'RWF', image_path: null, is_featured: false },
  { id: 7, name: 'Hostesses', slug: 'hostesses', short_description: 'Professional hospitality and guest reception', description: 'Professional hospitality and guest reception', base_price: 0, price_unit: 'fixed', currency: 'RWF', image_path: null, is_featured: false },
  { id: 8, name: 'Security Services', slug: 'security-services', short_description: 'Trained security for event protection', description: 'Trained security for event protection', base_price: 0, price_unit: 'fixed', currency: 'RWF', image_path: null, is_featured: false },
  { id: 9, name: 'Decoration', slug: 'decoration', short_description: 'Premium event styling and décor', description: 'Premium event styling and décor', base_price: 0, price_unit: 'fixed', currency: 'RWF', image_path: null, is_featured: false },
  { id: 10, name: 'Event Support', slug: 'event-support', short_description: 'Full-service event coordination', description: 'Full-service event coordination', base_price: 0, price_unit: 'fixed', currency: 'RWF', image_path: null, is_featured: true },
  { id: 11, name: 'Other Services', slug: 'other-services', short_description: 'Custom solutions for unique needs', description: 'Custom solutions for unique needs', base_price: 0, price_unit: 'fixed', currency: 'RWF', image_path: null, is_featured: false },
]

export const FALLBACK_FAQS: Faq[] = [
  { id: 1, question: 'How do I request protocol services?', answer: 'Visit our Request Service page, select the services you need, fill in your event details, upload required documents, and sign digitally. You will receive a reference number and tracking link via WhatsApp.', category: 'General' },
  { id: 2, question: 'What is the minimum notice period for booking?', answer: 'We recommend booking at least 2 weeks in advance for standard events. For large diplomatic or state events, please contact us at least 4–6 weeks ahead.', category: 'Booking' },
  { id: 3, question: 'Do you provide services outside Kigali?', answer: 'Yes. IPS provides protocol and event services across Rwanda and can coordinate international events upon request.', category: 'Service Area' },
  { id: 4, question: 'What payment methods do you accept?', answer: 'We accept MTN MoMo, Airtel Money, Flutterwave (Visa/Mastercard), bank transfer, and cash payments upon approval of your quotation.', category: 'Payments' },
  { id: 5, question: 'Can I track my service request?', answer: 'Yes. After submission you receive a tracking link via WhatsApp. You can also log in to the client portal to view status, download PDFs, and communicate with our team.', category: 'Tracking' },
  { id: 6, question: 'What documents are required?', answer: 'Depending on the event, you may need to upload a passport, national ID, or other identification. All uploads support PDF, JPG, and PNG formats.', category: 'Documents' },
]

export const FALLBACK_GALLERY: GalleryItem[] = [
  { id: 1, title: 'Protocol Team', image_path: '/assets/4-06096c11-f3c0-4d8a-afc5-67cd2b11ca9f.png', category: 'Protocol' },
  { id: 2, title: 'Event Hostesses', image_path: '/assets/6-d15b8e60-0c5f-450d-b61b-3c74e6347148.png', category: 'Events' },
  { id: 3, title: 'Traditional Attire', image_path: '/assets/2-22a1aa19-57ba-4ab7-9c3d-f064d69dbf22.png', category: 'Protocol' },
  { id: 4, title: 'Professional Staff', image_path: '/assets/7-38572c81-7954-4d19-9013-edab41ff3a40.png', category: 'Team' },
  { id: 5, title: 'Outdoor Protocol', image_path: '/assets/landing-hero.png', category: 'Events' },
  { id: 6, title: 'Corporate Event', image_path: '/assets/8-e37d6a7c-b0c6-4d44-8467-19722f574574.png', category: 'Corporate' },
  { id: 7, title: 'VIP Services', image_path: '/assets/1-c880fae8-83f5-4df6-94d7-285dbd6cf243.png', category: 'VIP' },
  { id: 8, title: 'Event Coordination', image_path: '/assets/Landing_Page-6f34a890-3326-4c98-8d7d-c87b51df364e.png', category: 'Events' },
]

export const FALLBACK_BLOG: BlogPost[] = [
  { id: 1, title: 'The Art of Diplomatic Protocol in Modern Rwanda', slug: 'art-of-diplomatic-protocol-rwanda', excerpt: 'Understanding the essential role of protocol services in diplomatic and corporate events across East Africa.', content: '<p>Protocol is the foundation of every distinguished event. At Indatwa Protocol & Services Agency, we bring international diplomatic standards to Rwanda\'s growing corporate and government event landscape.</p><p>From seating arrangements and flag protocols to guest reception and ceremonial coordination, our trained officers ensure every detail reflects the dignity of the occasion.</p>', featured_image: '/assets/4-06096c11-f3c0-4d8a-afc5-67cd2b11ca9f.png', author_name: 'IPS Editorial', published_at: new Date().toISOString() },
  { id: 2, title: '5 Essentials for Planning a Premium Corporate Event', slug: '5-essentials-premium-corporate-event', excerpt: 'Key considerations when organizing a high-profile corporate event in Kigali.', content: '<p>Planning a premium corporate event requires meticulous attention to detail. Here are five essentials every organizer should consider.</p><p><strong>1. Protocol & Guest Management</strong> — Professional protocol officers ensure VIP guests are received with the appropriate ceremonial standards.</p>', featured_image: '/assets/6-d15b8e60-0c5f-450d-b61b-3c74e6347148.png', author_name: 'IPS Editorial', published_at: new Date(Date.now() - 7 * 86400000).toISOString() },
  { id: 3, title: 'Why Professional Hostesses Elevate Your Event Experience', slug: 'professional-hostesses-elevate-events', excerpt: 'How trained hostesses transform guest experience at luxury events and diplomatic functions.', content: '<p>First impressions matter. Professional hostesses are often the first point of contact for your guests, setting the tone for the entire event experience.</p>', featured_image: '/assets/1-c880fae8-83f5-4df6-94d7-285dbd6cf243.png', author_name: 'IPS Editorial', published_at: new Date(Date.now() - 14 * 86400000).toISOString() },
]

export const FALLBACK_TESTIMONIALS: Testimonial[] = [
  { id: 1, client_name: 'Ambassador Jean-Pierre M.', client_title: 'Diplomatic Event, Kigali', content: 'IPS delivered impeccable protocol services for our embassy reception. Their attention to detail and professionalism exceeded our expectations.', rating: 5 },
  { id: 2, client_name: 'Sarah K. Williams', client_title: 'Corporate Conference Organizer', content: 'From translators to security, IPS coordinated every aspect flawlessly. Our international delegates were thoroughly impressed.', rating: 5 },
  { id: 3, client_name: 'Ministry of Trade & Industry', client_title: 'Government Event', content: 'The protocol officers demonstrated exceptional diplomatic etiquette. IPS is our go-to agency for all official government events.', rating: 5 },
]
