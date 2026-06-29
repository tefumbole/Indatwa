<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminRoleController extends Controller
{
    private const PROTECTED_ROLES = ['super_admin', 'client'];

    public function index(): JsonResponse
    {
        $roles = Role::with('permissions:id,name,module')
            ->where('name', '!=', 'client')
            ->withCount('users')
            ->orderBy('display_name')
            ->get()
            ->map(fn (Role $role) => $this->formatRole($role));

        return response()->json(['success' => true, 'data' => $roles]);
    }

    public function permissions(): JsonResponse
    {
        $grouped = Permission::orderBy('module')->orderBy('name')->get()
            ->groupBy('module')
            ->map(fn ($items, $module) => [
                'module' => $module,
                'label' => ucfirst(str_replace('_', ' ', $module)),
                'permissions' => $items->map(fn (Permission $p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'label' => $this->permissionLabel($p->name),
                ])->values(),
            ])
            ->values();

        return response()->json(['success' => true, 'data' => $grouped]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'display_name' => 'required|string|max:100',
            'name' => 'nullable|string|max:50|unique:roles,name|regex:/^[a-z0-9_]+$/',
            'description' => 'nullable|string|max:500',
            'permission_ids' => 'nullable|array',
            'permission_ids.*' => 'integer|exists:permissions,id',
        ]);

        $name = $validated['name'] ?? Str::slug($validated['display_name'], '_');
        if (in_array($name, self::PROTECTED_ROLES, true)) {
            return response()->json(['success' => false, 'message' => 'This role name is reserved.'], 422);
        }

        $role = DB::transaction(function () use ($validated, $name) {
            $role = Role::create([
                'name' => $name,
                'display_name' => $validated['display_name'],
                'description' => $validated['description'] ?? null,
            ]);

            if (! empty($validated['permission_ids'])) {
                $role->permissions()->sync($validated['permission_ids']);
            }

            return $role->load('permissions:id,name,module');
        });

        return response()->json(['success' => true, 'data' => $this->formatRole($role)], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        if ($role->name === 'client') {
            return response()->json(['success' => false, 'message' => 'Cannot modify client role.'], 422);
        }

        $validated = $request->validate([
            'display_name' => 'sometimes|string|max:100',
            'description' => 'nullable|string|max:500',
            'permission_ids' => 'sometimes|array',
            'permission_ids.*' => 'integer|exists:permissions,id',
        ]);

        DB::transaction(function () use ($role, $validated) {
            $fields = collect($validated)->except(['permission_ids'])->filter(fn ($v) => $v !== null)->toArray();
            if (! empty($fields)) {
                $role->update($fields);
            }
            if (array_key_exists('permission_ids', $validated)) {
                $role->permissions()->sync($validated['permission_ids'] ?? []);
            }
        });

        return response()->json([
            'success' => true,
            'data' => $this->formatRole($role->fresh()->load('permissions:id,name,module')),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $role = Role::withCount('users')->findOrFail($id);

        if (in_array($role->name, self::PROTECTED_ROLES, true)) {
            return response()->json(['success' => false, 'message' => 'This system role cannot be deleted.'], 422);
        }

        if ($role->users_count > 0) {
            return response()->json(['success' => false, 'message' => 'Remove users from this role before deleting it.'], 422);
        }

        $role->permissions()->detach();
        $role->delete();

        return response()->json(['success' => true, 'message' => 'Role deleted.']);
    }

    private function formatRole(Role $role): array
    {
        return [
            'id' => $role->id,
            'name' => $role->name,
            'display_name' => $role->display_name,
            'description' => $role->description,
            'is_protected' => in_array($role->name, self::PROTECTED_ROLES, true),
            'users_count' => $role->users_count ?? $role->users()->count(),
            'permissions' => $role->relationLoaded('permissions')
                ? $role->permissions->map(fn (Permission $p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'module' => $p->module,
                    'label' => $this->permissionLabel($p->name),
                ])
                : [],
        ];
    }

    private function permissionLabel(string $name): string
    {
        $parts = explode('.', $name);
        $action = str_replace('_', ' ', end($parts));
        $module = count($parts) > 1 ? str_replace('_', ' ', $parts[0]) : '';

        return ucfirst($module).' — '.ucfirst($action);
    }
}
