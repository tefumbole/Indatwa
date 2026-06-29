<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::with('roles:id,name,display_name')
            ->whereHas('roles', fn ($q) => $q->where('name', '!=', 'client'))
            ->orderBy('name');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%");
            });
        }

        $users = $query->get()->map(fn (User $user) => $this->formatUser($user));

        return response()->json(['success' => true, 'data' => $users]);
    }

    public function roles(): JsonResponse
    {
        $roles = Role::where('name', '!=', 'client')
            ->select('id', 'name', 'display_name')
            ->orderBy('display_name')
            ->get();

        return response()->json(['success' => true, 'data' => $roles]);
    }

    public function store(Request $request): JsonResponse
    {
        $staffRoles = Role::where('name', '!=', 'client')->pluck('name')->toArray();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'nullable|string|max:50|unique:users,username',
            'email' => 'nullable|email|max:255|unique:users,email',
            'phone' => 'required|string|max:20|unique:users,phone',
            'password' => 'required|string|min:6',
            'roles' => 'required|array|min:1',
            'roles.*' => ['string', Rule::in($staffRoles)],
            'is_active' => 'boolean',
        ]);

        $user = DB::transaction(function () use ($validated) {
            $user = User::create([
                'name' => $validated['name'],
                'username' => $validated['username'] ?? null,
                'email' => $validated['email'] ?? null,
                'phone' => $validated['phone'],
                'password' => $validated['password'],
                'is_active' => $validated['is_active'] ?? true,
            ]);

            $roleIds = Role::whereIn('name', $validated['roles'])->pluck('id');
            $user->roles()->sync($roleIds);

            return $user->load('roles:id,name,display_name');
        });

        return response()->json(['success' => true, 'data' => $this->formatUser($user)], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $staffRoles = Role::where('name', '!=', 'client')->pluck('name')->toArray();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'username' => ['nullable', 'string', 'max:50', Rule::unique('users', 'username')->ignore($user->id)],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['sometimes', 'string', 'max:20', Rule::unique('users', 'phone')->ignore($user->id)],
            'password' => 'nullable|string|min:6',
            'roles' => 'sometimes|array|min:1',
            'roles.*' => ['string', Rule::in($staffRoles)],
            'is_active' => 'boolean',
        ]);

        DB::transaction(function () use ($user, $validated) {
            $fields = collect($validated)->except(['roles', 'password'])->filter(fn ($v) => $v !== null)->toArray();
            if (! empty($fields)) {
                $user->update($fields);
            }
            if (! empty($validated['password'])) {
                $user->password = $validated['password'];
                $user->save();
            }
            if (isset($validated['roles'])) {
                $roleIds = Role::whereIn('name', $validated['roles'])->pluck('id');
                $user->roles()->sync($roleIds);
            }
        });

        return response()->json([
            'success' => true,
            'data' => $this->formatUser($user->fresh()->load('roles:id,name,display_name')),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($user->hasRole('super_admin') && User::whereHas('roles', fn ($q) => $q->where('name', 'super_admin'))->count() <= 1) {
            return response()->json(['success' => false, 'message' => 'Cannot delete the only super admin.'], 422);
        }

        $user->delete();

        return response()->json(['success' => true, 'message' => 'User removed.']);
    }

    private function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'phone' => $user->phone,
            'is_active' => $user->is_active,
            'roles' => $user->roles->pluck('name'),
            'role_labels' => $user->roles->pluck('display_name'),
            'created_at' => $user->created_at?->toIso8601String(),
        ];
    }
}
