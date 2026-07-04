<?php
$matching = @fsockopen('127.0.0.1', 5001, $errno, $errstr, 2) ? 'online' : 'offline';
$embedding = @fsockopen('127.0.0.1', 5002, $errno, $errstr, 2) ? 'online' : 'offline';

header('Content-Type: application/json');
echo json_encode(['matching' => $matching, 'embedding' => $embedding]);