<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class IpsSeeder extends Seeder
{
    public function run()
    {
        $now = now();

        $categories = [
            ['name' => 'Protocol', 'slug' => 'protocol', 'icon' => 'crown'],
            ['name' => 'Transportation', 'slug' => 'transportation', 'icon' => 'car'],
            ['name' => 'Catering', 'slug' => 'catering', 'icon' => 'coffee'],
            ['name' => 'Event Support', 'slug' => 'event-support', 'icon' => 'party-popper'],
        ];

        foreach ($categories as $i => $cat) {
            DB::table('service_categories')->insert(array_merge($cat, [
                'sort_order' => $i,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]));
        }

        $services = [
            ['Protocol Services', 'protocol-services', 1, 'Diplomatic protocol for state and corporate events', true],
            ['Professional Drivers', 'professional-drivers', 2, 'Chauffeur services for VIP transportation', false],
            ['Translators', 'translators', 1, 'Professional interpretation services', false],
            ['Beverages', 'beverages', 3, 'Premium beverage catering and service', false],
            ['Glass Rental', 'glass-rental', 3, 'Elegant glassware for any occasion', false],
            ['Wedding Cakes', 'wedding-cakes', 3, 'Custom-designed celebration cakes', false],
            ['Hostesses', 'hostesses', 4, 'Professional hospitality and guest reception', false],
            ['Security Services', 'security-services', 4, 'Trained security for event protection', false],
            ['Decoration', 'decoration', 4, 'Premium event styling and décor', false],
            ['Event Support', 'event-support', 4, 'Full-service event coordination', true],
            ['Other Services', 'other-services', 4, 'Custom solutions for unique needs', false],
        ];

        foreach ($services as $i => [$name, $slug, $catId, $desc, $featured]) {
            DB::table('services')->insert([
                'category_id' => $catId,
                'name' => $name,
                'slug' => $slug,
                'short_description' => $desc,
                'description' => $desc,
                'base_price' => 0,
                'price_unit' => 'fixed',
                'currency' => 'RWF',
                'is_featured' => $featured,
                'is_active' => true,
                'sort_order' => $i,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $roles = [
            ['super_admin', 'Super Admin', 'Full system access'],
            ['director', 'Director', 'Management access'],
            ['operations_manager', 'Operations Manager', 'Service operations'],
            ['finance_officer', 'Finance Officer', 'Payments management'],
            ['protocol_officer', 'Protocol Officer', 'Assignments'],
            ['customer_service', 'Customer Service', 'Client communication'],
            ['client', 'Client', 'Client portal access'],
        ];

        foreach ($roles as [$name, $display, $desc]) {
            DB::table('roles')->insert([
                'name' => $name,
                'display_name' => $display,
                'description' => $desc,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $superAdminRoleId = DB::table('roles')->where('name', 'super_admin')->value('id');

        $adminId = DB::table('users')->insertGetId([
            'uuid' => (string) Str::uuid(),
            'username' => 'admin',
            'name' => 'IPS Administrator',
            'email' => 'admin@indatwagency.com',
            'phone' => '+250794006160',
            'password' => Hash::make('system'),
            'email_verified_at' => $now,
            'is_active' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        DB::table('user_role')->insert([
            'user_id' => $adminId,
            'role_id' => $superAdminRoleId,
        ]);

        DB::table('testimonials')->insert([
            [
                'client_name' => 'Ambassador Jean-Pierre M.',
                'client_title' => 'Diplomatic Event, Kigali',
                'content' => 'IPS delivered impeccable protocol services for our embassy reception.',
                'rating' => 5,
                'is_featured' => true,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'client_name' => 'Sarah K. Williams',
                'client_title' => 'Corporate Conference Organizer',
                'content' => 'From translators to security, IPS coordinated every aspect flawlessly.',
                'rating' => 5,
                'is_featured' => true,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        DB::table('faqs')->insert([
            ['question' => 'How do I request protocol services?', 'answer' => 'Visit our Request Service page, select the services you need, fill in your event details, upload required documents, and sign digitally. You will receive a reference number and tracking link via WhatsApp.', 'category' => 'General', 'sort_order' => 1, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['question' => 'What is the minimum notice period for booking?', 'answer' => 'We recommend booking at least 2 weeks in advance for standard events. For large diplomatic or state events, please contact us at least 4–6 weeks ahead.', 'category' => 'Booking', 'sort_order' => 2, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['question' => 'Do you provide services outside Kigali?', 'answer' => 'Yes. IPS provides protocol and event services across Rwanda and can coordinate international events upon request.', 'category' => 'Service Area', 'sort_order' => 3, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['question' => 'What payment methods do you accept?', 'answer' => 'We accept MTN MoMo, Airtel Money, Flutterwave (Visa/Mastercard), bank transfer, and cash payments upon approval of your quotation.', 'category' => 'Payments', 'sort_order' => 4, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['question' => 'Can I track my service request?', 'answer' => 'Yes. After submission you receive a tracking link via WhatsApp. You can also log in to the client portal to view status, download PDFs, and communicate with our team.', 'category' => 'Tracking', 'sort_order' => 5, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['question' => 'What documents are required?', 'answer' => 'Depending on the event, you may need to upload a passport, national ID, or other identification. All uploads support PDF, JPG, and PNG formats.', 'category' => 'Documents', 'sort_order' => 6, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);

        $galleryImages = [
            ['Protocol Team', '/assets/4-06096c11-f3c0-4d8a-afc5-67cd2b11ca9f.png', 'Protocol', 1],
            ['Event Hostesses', '/assets/6-d15b8e60-0c5f-450d-b61b-3c74e6347148.png', 'Events', 2],
            ['Traditional Attire', '/assets/2-22a1aa19-57ba-4ab7-9c3d-f064d69dbf22.png', 'Protocol', 3],
            ['Professional Staff', '/assets/7-38572c81-7954-4d19-9013-edab41ff3a40.png', 'Team', 4],
            ['Outdoor Protocol', '/assets/landing-hero.png', 'Events', 5],
            ['Corporate Event', '/assets/8-e37d6a7c-b0c6-4d44-8467-19722f574574.png', 'Corporate', 6],
            ['VIP Services', '/assets/1-c880fae8-83f5-4df6-94d7-285dbd6cf243.png', 'VIP', 7],
            ['Event Coordination', '/assets/Landing_Page-6f34a890-3326-4c98-8d7d-c87b51df364e.png', 'Events', 8],
        ];

        foreach ($galleryImages as [$title, $path, $category, $order]) {
            DB::table('gallery_items')->insert([
                'title' => $title,
                'image_path' => $path,
                'category' => $category,
                'sort_order' => $order,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $blogPosts = [
            [
                'title' => 'The Art of Diplomatic Protocol in Modern Rwanda',
                'slug' => 'art-of-diplomatic-protocol-rwanda',
                'excerpt' => 'Understanding the essential role of protocol services in diplomatic and corporate events across East Africa.',
                'content' => '<p>Protocol is the foundation of every distinguished event. At Indatwa Protocol & Services Agency, we bring international diplomatic standards to Rwanda\'s growing corporate and government event landscape.</p><p>From seating arrangements and flag protocols to guest reception and ceremonial coordination, our trained officers ensure every detail reflects the dignity of the occasion.</p><p>Whether hosting an embassy reception, a bilateral meeting, or a state ceremony, IPS protocol officers are equipped with the knowledge, poise, and professionalism required at the highest level.</p>',
                'featured_image' => '/assets/4-06096c11-f3c0-4d8a-afc5-67cd2b11ca9f.png',
                'author_name' => 'IPS Editorial',
                'published_at' => $now,
            ],
            [
                'title' => '5 Essentials for Planning a Premium Corporate Event',
                'slug' => '5-essentials-premium-corporate-event',
                'excerpt' => 'Key considerations when organizing a high-profile corporate event in Kigali.',
                'content' => '<p>Planning a premium corporate event requires meticulous attention to detail. Here are five essentials every organizer should consider.</p><p><strong>1. Protocol & Guest Management</strong> — Professional protocol officers ensure VIP guests are received with the appropriate ceremonial standards.</p><p><strong>2. Transportation</strong> — Chauffeur services for dignitaries and keynote speakers.</p><p><strong>3. Translation Services</strong> — Professional interpreters for international delegates.</p><p><strong>4. Security</strong> — Trained personnel to maintain a safe and controlled environment.</p><p><strong>5. Catering & Presentation</strong> — Premium beverages, glassware, and presentation standards that match the event\'s prestige.</p>',
                'featured_image' => '/assets/6-d15b8e60-0c5f-450d-b61b-3c74e6347148.png',
                'author_name' => 'IPS Editorial',
                'published_at' => $now->copy()->subDays(7),
            ],
            [
                'title' => 'Why Professional Hostesses Elevate Your Event Experience',
                'slug' => 'professional-hostesses-elevate-events',
                'excerpt' => 'How trained hostesses transform guest experience at luxury events and diplomatic functions.',
                'content' => '<p>First impressions matter. Professional hostesses are often the first point of contact for your guests, setting the tone for the entire event experience.</p><p>IPS hostesses are trained in international hospitality standards, multilingual greeting protocols, and elegant guest guidance. They ensure every attendee feels welcomed, informed, and valued.</p><p>From registration desks to VIP lounges, our hostesses bring warmth and professionalism that elevates any occasion.</p>',
                'featured_image' => '/assets/1-c880fae8-83f5-4df6-94d7-285dbd6cf243.png',
                'author_name' => 'IPS Editorial',
                'published_at' => $now->copy()->subDays(14),
            ],
        ];

        foreach ($blogPosts as $post) {
            DB::table('blog_posts')->insert(array_merge($post, [
                'status' => 'published',
                'created_at' => $now,
                'updated_at' => $now,
            ]));
        }

        DB::table('site_settings')->insert([
            ['key' => 'company_info', 'value' => json_encode([
                'name' => 'Indatwa Protocol & Services Agency',
                'location' => 'Kimironko, Kigali, Rwanda',
                'whatsapp' => '+250780759253',
                'email' => 'info@indatwagency.com',
                'video_url' => '',
            ]), 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'reviews_enabled', 'value' => json_encode(true), 'created_at' => $now, 'updated_at' => $now],
        ]);
    }
}
