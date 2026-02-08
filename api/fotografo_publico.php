<?php
require 'api/db.inc';
header('Content-Type: application/json; charset=utf-8');

if (!isset($_GET['email'])) {
    echo json_encode(['erro' => 'Email em falta']);
    exit;
}

$email = trim($_GET['email']);

$sql = "SELECT 
            nome,
            especialidade,
            email,
            portfolio,
            foto_perfil,
            certificado,
            distrito,
            concelho
        FROM utilizador
        WHERE email = ? AND tipo = 'fotografo'
        LIMIT 1";

$stmt = $pdo->prepare($sql);
$stmt->execute([$email]);
$f = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$f) {
    echo json_encode(['erro' => 'Fotógrafo não encontrado']);
    exit;
}

echo json_encode($f);