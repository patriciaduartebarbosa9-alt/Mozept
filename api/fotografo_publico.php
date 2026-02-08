
<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
require 'db.inc';
header('Content-Type: application/json; charset=utf-8');


if (!isset($_GET['id'])) {
    echo json_encode(['erro' => 'ID em falta']);
    exit;
}

$id = intval($_GET['id']);


// Buscar email e dados básicos na tabela utilizador
$sqlU = "SELECT email FROM utilizador WHERE id = ? AND tipo = 'fotografo' LIMIT 1";
$stmtU = $pdo->prepare($sqlU);
$stmtU->execute([$id]);
$utilizador = $stmtU->fetch(PDO::FETCH_ASSOC);

if (!$utilizador) {
    echo json_encode(['erro' => 'Fotógrafo não encontrado']);
    exit;
}

$email = $utilizador['email'];

// Buscar dados na tabela fotografo pelo email
$sqlF = "SELECT nome, email, serviços, idportfolio, imagemperfil, Distrito, Concelho, Categoria FROM fotografo WHERE email = ? LIMIT 1";

try {
    $stmtF = $pdo->prepare($sqlF);
    $stmtF->execute([$email]);
    $dadosFotografo = $stmtF->fetch(PDO::FETCH_ASSOC);
    if (!$dadosFotografo) {
        echo json_encode(['erro' => 'Dados do fotógrafo não encontrados']);
        exit;
    }
    // Juntar email do utilizador com os dados do fotógrafo
    $resposta = array_merge([
        'email' => $utilizador['email'],
    ], $dadosFotografo);
    echo json_encode($resposta);
} catch (Exception $e) {
    echo json_encode(['erro' => 'Erro PDO: ' . $e->getMessage()]);
    exit;
}