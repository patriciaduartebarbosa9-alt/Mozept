<?php
// api/get_cliente.php
// Retorna dados do cliente pelo email

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.inc';

header('Content-Type: application/json');

$email = isset($_GET['email']) ? $_GET['email'] : '';
if (!$email) {
    echo json_encode(['erro' => 'Email não fornecido']);
    exit;
}

$stmt = $pdo->prepare('SELECT nome, imagem FROM cliente WHERE email = ?');
$stmt->execute([$email]);
$cliente = $stmt->fetch(PDO::FETCH_ASSOC);

if ($cliente) {
    echo json_encode($cliente);
} else {
    echo json_encode(['erro' => 'Cliente não encontrado']);
}
