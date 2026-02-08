<?php
header('Content-Type: application/json; charset=utf-8');
require_once 'config.php';
require_once 'db.inc';

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;
if (!$id) {
    echo json_encode(['erro' => 'ID inválido']);
    exit;
}

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $pdo->prepare('SELECT tipo FROM utilizador WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row && isset($row['tipo'])) {
        echo json_encode(['tipo' => strtolower($row['tipo'])]);
    } else {
        echo json_encode(['erro' => 'Utilizador não encontrado']);
    }
} catch (Exception $e) {
    echo json_encode(['erro' => 'Erro no servidor: ' . $e->getMessage()]);
}
