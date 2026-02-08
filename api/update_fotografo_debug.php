<?php
// update_fotografo.php (debug upload)
header('Content-Type: application/json');
require 'db.inc';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['sucesso' => false, 'erro' => 'Método inválido']);
    exit;
}

$id = isset($_POST['id']) ? $_POST['id'] : '';
$categoria = isset($_POST['categoria']) ? $_POST['categoria'] : '';

if (!$id) {
    echo json_encode(['sucesso' => false, 'erro' => 'ID ausente']);
    exit;
}

$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
if ($conn->connect_error) {
    echo json_encode(['sucesso' => false, 'erro' => 'Erro de conexão']);
    exit;
}

$uploadDebug = [];
$imagemPerfilUrl = '';
if (isset($_FILES['imagemperfil'])) {
    $uploadDebug['error'] = $_FILES['imagemperfil']['error'];
    $uploadDebug['name'] = $_FILES['imagemperfil']['name'];
    $uploadDebug['type'] = $_FILES['imagemperfil']['type'];
    $uploadDebug['size'] = $_FILES['imagemperfil']['size'];
    $uploadDebug['tmp_name'] = $_FILES['imagemperfil']['tmp_name'];
    if ($_FILES['imagemperfil']['error'] === UPLOAD_ERR_OK) {
        $ext = pathinfo($_FILES['imagemperfil']['name'], PATHINFO_EXTENSION);
        $nomeArquivo = 'profile_' . $id . '_' . time() . '.' . $ext;
        $destino = '../assets/images/' . $nomeArquivo;
        if (move_uploaded_file($_FILES['imagemperfil']['tmp_name'], $destino)) {
            $imagemPerfilUrl = 'assets/images/' . $nomeArquivo;
        } else {
            $uploadDebug['move_error'] = 'move_uploaded_file falhou';
        }
    } else {
        $uploadDebug['upload_error'] = 'Erro no upload';
    }
}

if ($imagemPerfilUrl) {
    $stmt = $conn->prepare("UPDATE fotografo SET Categoria=?, imagemperfil=? WHERE id=?");
    $stmt->bind_param('ssi', $categoria, $imagemPerfilUrl, $id);
} else {
    $stmt = $conn->prepare("UPDATE fotografo SET Categoria=? WHERE id=?");
    $stmt->bind_param('si', $categoria, $id);
}

if ($stmt->execute()) {
    echo json_encode(['sucesso' => true, 'imagemperfil' => $imagemPerfilUrl, 'uploadDebug' => $uploadDebug]);
} else {
    echo json_encode(['sucesso' => false, 'erro' => 'Erro ao atualizar', 'uploadDebug' => $uploadDebug]);
}
$stmt->close();
$conn->close();
