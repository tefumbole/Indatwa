<?php

return [
    'api_key' => env('WASENDER_API_KEY'),
    'base_url' => env('WASENDER_BASE_URL', 'https://wasenderapi.com/api'),
    'company_name' => env('COMPANY_NAME', 'Indatwa Protocol & Services Agency'),

    'rate_limits' => [
        'between_recipients' => 6,
        'text_to_attachment' => 3,
        'between_attachments' => 3,
    ],

    'admin_phone' => env('ADMIN_PHONE', '+250780759253'),
    'admin_email' => env('ADMIN_EMAIL', 'admin@indatwa.rw'),
];
