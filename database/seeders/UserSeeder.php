<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Enums\Role;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin E-Learning',
                'password' => Hash::make('password'),
                'role' => Role::Admin,
                'email_verified_at' => now(),
            ]
        );

        User::updateOrCreate(
            ['email' => 'student@example.com'],
            [
                'name' => 'Student Demo',
                'password' => Hash::make('password'),
                'role' => Role::Student,
                'email_verified_at' => now(),
            ]
        );
    }
}
