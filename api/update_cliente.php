<?php
// update_cliente.php
// Atualiza imagem de perfil e senha do cliente

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.inc';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['sucesso' => false, 'erro' => 'Método inválido']);
    exit;
}

$id = isset($_POST['id']) ? intval($_POST['id']) : 0;
if ($id <= 0) {
    echo json_encode(['sucesso' => false, 'erro' => 'ID inválido']);
    exit;
}

// Acumular status das operações
$senha = isset($_POST['senha']) ? $_POST['senha'] : '';
$imagemperfil = isset($_FILES['imagemperfil']) ? $_FILES['imagemperfil'] : null;
$result = ["sucesso" => true];

// Atualizar imagem
if ($imagemperfil && $imagemperfil['error'] === UPLOAD_ERR_OK) {
    $ext = pathinfo($imagemperfil['name'], PATHINFO_EXTENSION);
    $imgName = 'cliente_' . $id . '_' . time() . '.' . $ext;
    $imgPath = '../assets/images/' . $imgName;
    if (move_uploaded_file($imagemperfil['tmp_name'], $imgPath)) {
        // Buscar o email do utilizador
        $stmtEmail = $pdo->prepare('SELECT email FROM utilizador WHERE id = ?');
        $stmtEmail->execute([$id]);
        $rowEmail = $stmtEmail->fetch(PDO::FETCH_ASSOC);
        if (!$rowEmail || !isset($rowEmail['email'])) {
            $result["sucesso"] = false;
            $result["erro"] = 'Email não encontrado para este utilizador';
        } else {
            $email = $rowEmail['email'];
            // Atualizar imagem na tabela cliente usando email
            $stmtUpdate = $pdo->prepare('UPDATE cliente SET imagem = ? WHERE email = ?');
            if (!$stmtUpdate->execute([$imgName, $email])) {
                $result["sucesso"] = false;
                $result["erro"] = 'Erro ao atualizar imagem na tabela cliente';
            }
        }
    } else {
        $result["sucesso"] = false;
        $result["erro"] = 'Falha ao salvar imagem';
    }
}

// Atualizar senha
if ($senha !== '') {
    $senhaHash = password_hash($senha, PASSWORD_DEFAULT);
    $sql = 'UPDATE utilizador SET senha = ? WHERE id = ?';
    $stmt = $pdo->prepare($sql);
    if (!$stmt->execute([$senhaHash, $id])) {
        $result["sucesso"] = false;
        $result["erro"] = 'Erro ao atualizar senha';
    }
}

echo json_encode($result);

