<?php
// api/get_cliente_by_id.php
// Retorna dados do cliente pelo id

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.inc';

header('Content-Type: application/json');

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;
if ($id <= 0) {
    echo json_encode(['erro' => 'ID inválido']);
    exit;
}

// Ativar relatório de erros para debug
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

try {
    $stmt = $pdo->prepare('SELECT c.nome, c.imagem FROM cliente c LEFT JOIN utilizador u ON c.email = u.email WHERE u.id = ?');
    $stmt->execute([$id]);
    $cliente = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($cliente) {
        echo json_encode($cliente);
    } else {
        echo json_encode(['erro' => 'Cliente não encontrado']);
    }
} catch (Exception $e) {
    echo json_encode(['erro' => 'Erro ao consultar a base de dados: ' . $e->getMessage()]);
}
