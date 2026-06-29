<?php

namespace App\Support;

class WasenderRateLimiter
{
    public static function betweenRecipients(): void
    {
        sleep((int) config('wasender.rate_limits.between_recipients', 6));
    }

    public static function beforeAttachment(): void
    {
        sleep((int) config('wasender.rate_limits.text_to_attachment', 3));
    }

    public static function betweenAttachments(): void
    {
        sleep((int) config('wasender.rate_limits.between_attachments', 3));
    }
}
