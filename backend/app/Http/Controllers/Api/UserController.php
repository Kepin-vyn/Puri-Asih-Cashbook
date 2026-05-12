<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Requests\User\UpdateRoleRequest;
use App\Http\Requests\User\UpdateShiftRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserController extends BaseApiController
{
    /**
     * GET /api/v1/users
     * List semua user + filter + summary
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::query();

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('shift')) {
            $query->where('shift', $request->shift);
        }

        $users = $query->orderBy('name', 'asc')->paginate(20);

        // Summary counts
        $totalFo       = User::where('role', 'fo')->count();
        $totalActive   = User::where('status', 'active')->count();
        $totalInactive = User::where('status', 'inactive')->count();

        return $this->successResponse(
            UserResource::collection($users->items()),
            'Data user berhasil diambil.',
            200,
            [
                'summary' => [
                    'total_fo'       => $totalFo,
                    'total_active'   => $totalActive,
                    'total_inactive' => $totalInactive,
                ],
                'pagination' => [
                    'current_page' => $users->currentPage(),
                    'last_page'    => $users->lastPage(),
                    'per_page'     => $users->perPage(),
                    'total'        => $users->total(),
                ],
            ]
        );
    }

    /**
     * POST /api/v1/users
     * Buat user baru
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => $request->password, // auto-hashed via cast
            'role'     => $request->role,
            'shift'    => $request->shift,
            'status'   => 'active',
        ]);

        return $this->successResponse(
            new UserResource($user),
            'User berhasil dibuat.',
            201
        );
    }

    /**
     * GET /api/v1/users/{id}
     * Detail user + statistik
     */
    public function show(string $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return $this->notFoundResponse('User tidak ditemukan.');
        }

        $stats = [
            'total_shift'       => $user->shifts()->count(),
            'total_kas'         => $user->kasTransactions()->count(),
            'total_expenses'    => $user->expenses()->count(),
            'total_reservations' => $user->reservations()->count(),
            'total_deposits'    => $user->deposits()->count(),
        ];

        return $this->successResponse([
            'user'  => new UserResource($user),
            'stats' => $stats,
        ], 'Detail user berhasil diambil.');
    }

    /**
     * PUT /api/v1/users/{id}
     * Update data user
     */
    public function update(UpdateUserRequest $request, string $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return $this->notFoundResponse('User tidak ditemukan.');
        }

        $data = $request->only(['name', 'email', 'shift']);

        // Hanya update password jika diisi
        if ($request->filled('password')) {
            $data['password'] = $request->password; // auto-hashed via cast
        }

        $user->update($data);

        return $this->successResponse(
            new UserResource($user),
            'User berhasil diperbarui.'
        );
    }

    /**
     * DELETE /api/v1/users/{id}
     * Soft delete: set status = inactive + hapus semua token
     */
    public function destroy(string $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return $this->notFoundResponse('User tidak ditemukan.');
        }

        // Manager tidak bisa nonaktifkan dirinya sendiri
        if ($user->id === Auth::id()) {
            return $this->errorResponse('Tidak dapat menonaktifkan akun sendiri.', null, 422);
        }

        $user->update(['status' => 'inactive']);

        // Hapus semua token agar user otomatis logout
        $user->tokens()->delete();

        return $this->successResponse(null, 'Staff berhasil dinonaktifkan.');
    }

    /**
     * PUT /api/v1/users/{id}/role
     * Update role user
     */
    public function updateRole(UpdateRoleRequest $request, string $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return $this->notFoundResponse('User tidak ditemukan.');
        }

        // Tidak bisa ubah role diri sendiri
        if ($user->id === Auth::id()) {
            return $this->errorResponse('Tidak dapat mengubah role akun sendiri.', null, 422);
        }

        $user->update(['role' => $request->role]);

        return $this->successResponse(
            new UserResource($user),
            'Role user berhasil diperbarui.'
        );
    }

    /**
     * PUT /api/v1/users/{id}/shift
     * Update jadwal shift (hanya untuk role FO)
     */
    public function updateShift(UpdateShiftRequest $request, string $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return $this->notFoundResponse('User tidak ditemukan.');
        }

        if ($user->role !== 'fo') {
            return $this->errorResponse('Shift hanya berlaku untuk role Front Office.', null, 422);
        }

        $user->update(['shift' => $request->shift]);

        return $this->successResponse(
            new UserResource($user),
            'Shift user berhasil diperbarui.'
        );
    }
}
