<?php

use App\Http\Controllers\Api\V1\Admin\AdminAnnouncementController;
use App\Http\Controllers\Api\V1\Admin\AdminDashboardController;
use App\Http\Controllers\Api\V1\Admin\AdminRequestController;
use App\Http\Controllers\Api\V1\Admin\AdminSettingsController;
use App\Http\Controllers\Api\V1\Admin\AdminTaskController;
use App\Http\Controllers\Api\V1\Admin\AdminUserController;
use App\Http\Controllers\Api\V1\Admin\AdminWhatsAppController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Portal\PortalController;
use App\Http\Controllers\Api\V1\Open\BlogController;
use App\Http\Controllers\Api\V1\Open\ContactController;
use App\Http\Controllers\Api\V1\Open\CronController;
use App\Http\Controllers\Api\V1\Open\ReviewController;
use App\Http\Controllers\Api\V1\Open\ServiceController;
use App\Http\Controllers\Api\V1\Open\ServiceRequestController;
use App\Http\Controllers\Api\V1\Open\SiteController;
use App\Http\Controllers\Api\V1\Webhooks\WasenderWebhookController;
use App\Http\Controllers\Api\V1\WhatsApp\WhatsAppController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Public endpoints
    Route::get('/services', [ServiceController::class, 'index']);
    Route::get('/services/{slug}', [ServiceController::class, 'show']);
    Route::get('/service-categories', [ServiceController::class, 'categories']);
    Route::post('/requests/submit', [ServiceRequestController::class, 'submit'])->middleware('auth.optional');
    Route::get('/track/{token}', [ServiceRequestController::class, 'track']);
    Route::get('/track/{token}/pdf', [ServiceRequestController::class, 'downloadPdf']);
    Route::get('/settings/public', [SiteController::class, 'publicSettings']);
    Route::get('/testimonials', [SiteController::class, 'testimonials']);
    Route::get('/reviews', [ReviewController::class, 'index']);
    Route::post('/reviews', [ReviewController::class, 'store'])->middleware('auth:sanctum');
    Route::get('/faqs', [SiteController::class, 'faqs']);
    Route::get('/gallery', [SiteController::class, 'gallery']);
    Route::get('/blog', [BlogController::class, 'index']);
    Route::get('/blog/{slug}', [BlogController::class, 'show']);
    Route::post('/contact', [ContactController::class, 'store']);
    Route::post('/webhooks/wasender', [WasenderWebhookController::class, 'handle']);
    Route::get('/cron/task-reminders', [CronController::class, 'taskReminders']);
    Route::get('/cron/announcements', [CronController::class, 'processAnnouncements']);
    Route::get('/cron/run', [CronController::class, 'runSchedule']);

    // Auth
    Route::prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/otp/request', [AuthController::class, 'requestOtp']);
        Route::post('/otp/verify', [AuthController::class, 'verifyOtp']);
        Route::post('/2fa/verify', [AuthController::class, 'verify2fa']);

        Route::middleware('auth:sanctum')->group(function () {
            Route::get('/me', [AuthController::class, 'me']);
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::post('/2fa/setup', [AuthController::class, 'setup2fa']);
            Route::post('/2fa/confirm', [AuthController::class, 'confirm2fa']);
        });
    });

    // Client portal
    Route::middleware(['auth:sanctum', 'role:client'])->prefix('portal')->group(function () {
        Route::get('/requests', [PortalController::class, 'requests']);
        Route::get('/requests/{id}', [PortalController::class, 'show']);
        Route::get('/requests/{id}/pdf', [PortalController::class, 'downloadPdf']);
        Route::post('/requests/{id}/documents', [PortalController::class, 'uploadDocument']);
        Route::match(['get', 'post'], '/requests/{id}/messages', [PortalController::class, 'messages']);
        Route::post('/requests/{id}/payments/initiate', [PortalController::class, 'initiatePayment']);
    });

    // Admin WhatsApp tools (New Vision pattern)
    Route::middleware(['auth:sanctum', 'role:super_admin,director,operations_manager,customer_service'])->prefix('whatsapp')->group(function () {
        Route::post('/send', [WhatsAppController::class, 'send']);
        Route::post('/test', [WhatsAppController::class, 'test']);
    });

    // Admin routes
    Route::middleware(['auth:sanctum', 'role:super_admin,director,operations_manager,customer_service'])->prefix('admin')->group(function () {
        Route::get('/dashboard', [AdminDashboardController::class, 'index']);
        Route::get('/staff', [AdminRequestController::class, 'staff']);
        Route::get('/requests', [AdminRequestController::class, 'index']);
        Route::get('/requests/{id}', [AdminRequestController::class, 'show']);
        Route::get('/requests/{id}/pdf', [AdminRequestController::class, 'downloadPdf']);
        Route::patch('/requests/{id}/status', [AdminRequestController::class, 'updateStatus']);
        Route::patch('/requests/{id}/items/{itemId}', [AdminRequestController::class, 'updateItem']);
        Route::patch('/requests/{id}/notes', [AdminRequestController::class, 'updateNotes']);
        Route::patch('/requests/{id}/assign', [AdminRequestController::class, 'assign']);
        Route::post('/requests/{id}/messages', [AdminRequestController::class, 'addMessage']);
        Route::post('/requests/{id}/quotation', [AdminRequestController::class, 'setQuotation']);
        Route::get('/settings', [AdminSettingsController::class, 'index']);
        Route::patch('/settings/reviews', [AdminSettingsController::class, 'updateReviews']);

        Route::middleware('role:super_admin,director,operations_manager')->group(function () {
            Route::get('/users', [AdminUserController::class, 'index']);
            Route::get('/users/roles', [AdminUserController::class, 'roles']);
            Route::post('/users', [AdminUserController::class, 'store']);
            Route::patch('/users/{id}', [AdminUserController::class, 'update']);
            Route::delete('/users/{id}', [AdminUserController::class, 'destroy']);

            Route::get('/tasks', [AdminTaskController::class, 'index']);
            Route::get('/tasks/mine', [AdminTaskController::class, 'myTasks']);
            Route::post('/tasks', [AdminTaskController::class, 'store']);
            Route::patch('/tasks/{id}', [AdminTaskController::class, 'update']);
            Route::delete('/tasks/{id}', [AdminTaskController::class, 'destroy']);

            Route::get('/whatsapp/logs', [AdminWhatsAppController::class, 'index']);

            Route::get('/announcements', [AdminAnnouncementController::class, 'index']);
            Route::post('/announcements', [AdminAnnouncementController::class, 'store']);
            Route::post('/announcements/{id}/send', [AdminAnnouncementController::class, 'sendNow']);
            Route::delete('/announcements/{id}', [AdminAnnouncementController::class, 'destroy']);
            Route::post('/announcements/process-scheduled', [AdminAnnouncementController::class, 'processScheduled']);
            Route::get('/announcements/settings', [AdminAnnouncementController::class, 'settings']);
            Route::patch('/announcements/settings', [AdminAnnouncementController::class, 'updateSettings']);
            Route::get('/announcements/templates', [AdminAnnouncementController::class, 'templates']);
            Route::post('/announcements/templates', [AdminAnnouncementController::class, 'storeTemplate']);
            Route::get('/announcements/recipients/clients', [AdminAnnouncementController::class, 'recipientClients']);
            Route::get('/announcements/recipients/staff', [AdminAnnouncementController::class, 'recipientStaff']);
        });
    });
});
