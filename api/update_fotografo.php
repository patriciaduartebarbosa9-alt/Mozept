<?php
// update_fotografo.php
header('Content-Type: application/json');
require 'db.inc';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['sucesso' => false, 'erro' => 'Método inválido']);
    exit;
}

$id = isset($_POST['id']) ? $_POST['id'] : '';
$categoria = isset($_POST['categoria']) ? $_POST['categoria'] : '';
// Adicione outros campos conforme necessário

if (!$id) {
    echo json_encode(['sucesso' => false, 'erro' => 'ID ausente']);
    exit;
}

$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
if ($conn->connect_error) {
    echo json_encode(['sucesso' => false, 'erro' => 'Erro de conexão']);
    exit;
}

// Buscar email pelo id
$email = '';
if ($id) {
    $sql = "SELECT email FROM utilizador WHERE id=? LIMIT 1";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $stmt->bind_result($email);
    $stmt->fetch();
    $stmt->close();
    }
if (!$email) {
    echo json_encode(['sucesso' => false, 'erro' => 'Email não encontrado para o id']);
    $conn->close();
    exit;
}

// Processar upload da imagem de perfil
$imagemPerfilUrl = '';
if (isset($_FILES['imagemperfil']) && $_FILES['imagemperfil']['error'] === UPLOAD_ERR_OK) {
    $ext = pathinfo($_FILES['imagemperfil']['name'], PATHINFO_EXTENSION);
    $nomeArquivo = 'profile_' . $id . '_' . time() . '.' . $ext;
    $destino = '../assets/images/' . $nomeArquivo;
    if (move_uploaded_file($_FILES['imagemperfil']['tmp_name'], $destino)) {
        $imagemPerfilUrl = 'assets/images/' . $nomeArquivo;
    }
}

if ($imagemPerfilUrl) {
    $stmt = $conn->prepare("UPDATE fotografo SET Categoria=?, imagemperfil=? WHERE email=?");
    $stmt->bind_param('sss', $categoria, $imagemPerfilUrl, $email);
} else {
    $stmt = $conn->prepare("UPDATE fotografo SET Categoria=? WHERE email=?");
    $stmt->bind_param('ss', $categoria, $email);
}

if ($stmt->execute()) {
    echo json_encode(['sucesso' => true, 'imagemperfil' => $imagemPerfilUrl]);
} else {
    echo json_encode(['sucesso' => false, 'erro' => 'Erro ao atualizar']);
}
$stmt->close();
$conn->close();
