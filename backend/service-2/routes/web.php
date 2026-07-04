<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
Route::get('/health-test', function () {
    $matching = @fsockopen('127.0.0.1', 5001, $errno, $errstr, 2) ? 'online' : 'offline';
    $embedding = @fsockopen('127.0.0.1', 5002, $errno, $errstr, 2) ? 'online' : 'offline';
    return response()->json(['matching' => $matching, 'embedding' => $embedding]);
});
});
