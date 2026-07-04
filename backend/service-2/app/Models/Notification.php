<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'message',
        'type',
        'role',
        'is_read',
        'archived',
        'link',
        'read_at'
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'archived' => 'boolean',
        'read_at' => 'datetime',
    ];

    // Scopes pour filtrer
    public function scopeActive($query)
    {
        return $query->where('archived', false);
    }

    public function scopeArchived($query)
    {
        return $query->where('archived', true);
    }

    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    public function scopeByRole($query, $role)
    {
        return $query->where('role', $role);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }
}