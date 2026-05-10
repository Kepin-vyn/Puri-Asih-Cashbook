<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class AuthController extends BaseApiController
{
    /**
     * Login — menghasilkan token Sanctum untuk user yang valid.
     *
     * POST /api/v1/auth/login
     */
    public function login(LoginRequest $request): JsonResponse
    {
        // Cari user berdasarkan email
        $user = User::where('email', $request->email)->first();

        // Jika user tidak ditemukan
        if (!$user) {
            return $this->errorResponse('Email atau password salah', null, 401);
        }

        // Cek password
        if (!Hash::check($request->password, $user->password)) {
            return $this->errorResponse('Email atau password salah', null, 401);
        }

        // Cek status aktif
        if ($user->status !== 'active') {
            return $this->errorResponse('Akun tidak aktif. Hubungi manager Anda.', null, 403);
        }

        // Hapus semua token lama agar hanya ada 1 sesi aktif
        $user->tokens()->delete();

        // Buat token baru
        $token = $user->createToken('auth-token')->plainTextToken;

        return $this->successResponse(
            [
                'user'       => new UserResource($user),
                'token'      => $token,
                'token_type' => 'Bearer',
            ],
            'Login berhasil'
        );
    }

    /**
     * Logout — mencabut token yang sedang aktif.
     *
     * POST /api/v1/auth/logout
     */
    public function logout(): JsonResponse
    {
        // Hapus token yang sedang digunakan
        auth()->user()->currentAccessToken()->delete();

        return $this->successResponse(null, 'Logout berhasil');
    }

    /**
     * Me — mengembalikan data user yang sedang login.
     *
     * GET /api/v1/auth/me
     */
    public function me(): JsonResponse
    {
        return $this->successResponse(
            new UserResource(auth()->user()),
            'Data user berhasil diambil'
        );
    }
}
