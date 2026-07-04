<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Resource extends Model
{
    protected $fillable = [
        'title',
        'file_path',
        'type',
        'user_id',
        'formation_id',
    ];

    public function formation()
    {
        return $this->belongsTo(Formation::class, 'formation_id');
    }
}
