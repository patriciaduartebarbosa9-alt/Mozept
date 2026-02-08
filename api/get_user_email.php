<?php
// api/get_user_email.php
// Retorna o email do utilizador pelo id

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.inc';

header('Content-Type: application/json');

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;
if ($id <= 0) {
    echo json_encode(['erro' => 'ID inválido']);
    exit;
}

$stmt = $pdo->prepare('SELECT email FROM utilizador WHERE id = ?');
$stmt->execute([$id]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if ($row && isset($row['email'])) {
    echo json_encode(['email' => $row['email']]);
} else {
    echo json_encode(['erro' => 'Email não encontrado']);
}
