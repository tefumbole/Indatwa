<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PermissionsSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $permissions = [
            ['dashboard.view', 'dashboard'],
            ['requests.view', 'requests'],
            ['requests.manage', 'requests'],
            ['requests.quotation', 'requests'],
            ['requests.assign', 'requests'],
            ['bookings.view', 'bookings'],
            ['bookings.manage', 'bookings'],
            ['tasks.view', 'tasks'],
            ['tasks.manage', 'tasks'],
            ['announcements.view', 'announcements'],
            ['announcements.manage', 'announcements'],
            ['users.view', 'users'],
            ['users.manage', 'users'],
            ['roles.view', 'roles'],
            ['roles.manage', 'roles'],
            ['whatsapp.view', 'whatsapp'],
            ['whatsapp.send', 'whatsapp'],
            ['settings.view', 'settings'],
            ['settings.manage', 'settings'],
        ];

        foreach ($permissions as [$name, $module]) {
            DB::table('permissions')->updateOrInsert(
                ['name' => $name],
                ['module' => $module, 'created_at' => $now, 'updated_at' => $now]
            );
        }

        $allPermissionIds = DB::table('permissions')->pluck('id')->toArray();

        $rolePermissions = [
            'super_admin' => $allPermissionIds,
            'director' => $allPermissionIds,
            'operations_manager' => DB::table('permissions')->whereIn('name', [
                'dashboard.view', 'requests.view', 'requests.manage', 'requests.quotation', 'requests.assign',
                'bookings.view', 'bookings.manage', 'tasks.view', 'tasks.manage',
                'announcements.view', 'announcements.manage', 'whatsapp.view', 'whatsapp.send',
            ])->pluck('id')->toArray(),
            'finance_officer' => DB::table('permissions')->whereIn('name', [
                'dashboard.view', 'requests.view', 'requests.quotation', 'settings.view',
            ])->pluck('id')->toArray(),
            'protocol_officer' => DB::table('permissions')->whereIn('name', [
                'dashboard.view', 'requests.view', 'requests.assign', 'tasks.view', 'tasks.manage', 'bookings.view',
            ])->pluck('id')->toArray(),
            'customer_service' => DB::table('permissions')->whereIn('name', [
                'dashboard.view', 'requests.view', 'requests.manage', 'announcements.view', 'announcements.manage',
                'whatsapp.view', 'whatsapp.send',
            ])->pluck('id')->toArray(),
        ];

        foreach ($rolePermissions as $roleName => $permissionIds) {
            $roleId = DB::table('roles')->where('name', $roleName)->value('id');
            if (! $roleId) {
                continue;
            }

            DB::table('role_permission')->where('role_id', $roleId)->delete();

            foreach ($permissionIds as $permissionId) {
                DB::table('role_permission')->insert([
                    'role_id' => $roleId,
                    'permission_id' => $permissionId,
                ]);
            }
        }
    }
}
