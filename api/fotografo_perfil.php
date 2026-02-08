<?php
header('Content-Type: application/json; charset=utf-8');
require_once 'config.php';
require_once 'db.inc';

// Recebe o id do fotógrafo (usuário logado)
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

    // Dados principais
    $stmt = $pdo->prepare('SELECT f.nome, u.email, f.imagemperfil, f.Distrito, f.Concelho, f.Categoria
        FROM utilizador u
        LEFT JOIN fotografo f ON u.email = f.email
        WHERE u.id = ?');
    $stmt->execute([$id]);
    $dados = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$dados) {
        echo json_encode(['erro' => 'Fotógrafo não encontrado']);
        exit;
    }

    // Buscar imagens do portfólio
    $portfolioImgs = [];
    $stmtPort = $pdo->prepare('SELECT imagem FROM portfolio WHERE idfotografo = ?');
    $stmtPort->execute([$id]);
    while ($row = $stmtPort->fetch(PDO::FETCH_ASSOC)) {
        if (!empty($row['imagem'])) {
            $portfolioImgs[] = $row['imagem'];
        }
    }
    $dados['portfolio'] = $portfolioImgs;

    echo json_encode($dados);
} catch (Exception $e) {
    echo json_encode(['erro' => 'Erro no servidor: ' . $e->getMessage()]);
}
