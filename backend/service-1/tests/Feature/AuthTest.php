<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    // ── REGISTER ────────────────────────────────────────────────────────────

    public function test_register_creates_user_successfully(): void
    {
        $response = $this->postJson('/api/register', [
            'name'                  => 'Ahmed Test',
            'email'                 => 'ahmed@test.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('users', ['email' => 'ahmed@test.com']);
    }

    public function test_register_forces_role_stagiaire_ignores_injected_role(): void
    {
        $response = $this->postJson('/api/register', [
            'name'                  => 'Hacker',
            'email'                 => 'hacker@test.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
            'role'                  => 'admin',   // tentative d'injection
            'status'                => 'actif',
        ]);

        $response->assertStatus(201);
        $user = User::where('email', 'hacker@test.com')->first();
        $this->assertEquals('stagiaire', $user->role);
        $this->assertNotEquals('admin', $user->role);
    }

    public function test_register_fails_with_missing_fields(): void
    {
        $response = $this->postJson('/api/register', [
            'email' => 'incomplet@test.com',
        ]);

        $response->assertStatus(422);
    }

    public function test_register_fails_with_duplicate_email(): void
    {
        User::factory()->create(['email' => 'existe@test.com']);

        $response = $this->postJson('/api/register', [
            'name'                  => 'Doublon',
            'email'                 => 'existe@test.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422);
    }

    // ── LOGIN ────────────────────────────────────────────────────────────────

    public function test_login_returns_token_with_valid_credentials(): void
    {
        User::factory()->create([
            'email'    => 'user@test.com',
            'password' => bcrypt('password123'),
            'role'     => 'stagiaire',
            'status'   => 'actif',
        ]);

        $response = $this->postJson('/api/login', [
            'email'    => 'user@test.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure(['token']);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        User::factory()->create([
            'email'    => 'user@test.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email'    => 'user@test.com',
            'password' => 'mauvais_mot_de_passe',
        ]);

        $response->assertStatus(401);
    }

    public function test_login_fails_with_nonexistent_email(): void
    {
        $response = $this->postJson('/api/login', [
            'email'    => 'inexistant@test.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(401);
    }

    // ── PROFIL PROTÉGÉ ───────────────────────────────────────────────────────

    public function test_profile_route_requires_authentication(): void
    {
        $response = $this->getJson('/api/profile');
        $response->assertStatus(401);
    }
}
