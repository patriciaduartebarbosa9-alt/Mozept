<?php
// update_cliente_form.php
// Formulário HTML para editar perfil do cliente (imagem e senha)

require_once 'config.php';

// Obter o ID do cliente
$id = isset($_GET['id']) ? intval($_GET['id']) : 0;
if ($id <= 0) {
    echo 'ID inválido.';
    exit;
}

// Buscar dados atuais do cliente
$sql = "SELECT imagem FROM cliente WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param('i', $id);
$stmt->execute();
$result = $stmt->get_result();
$cliente = $result->fetch_assoc();

$imgUrl = isset($cliente['imagem']) && $cliente['imagem'] ? '../assets/images/' . $cliente['imagem'] : '../assets/images/default.png';

?>
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <title>Editar Perfil Cliente</title>
    <style>
        .preview-img { width: 120px; height: 120px; border-radius: 50%; object-fit: cover; }
        .form-group { margin-bottom: 16px; }
    </style>
</head>
<body>
    <h2>Editar Perfil Cliente</h2>
    <form method="POST" enctype="multipart/form-data" action="update_cliente_form.php?id=<?php echo $id; ?>">
        <div class="form-group">
            <label>Imagem de Perfil:</label><br>
            <img src="<?php echo $imgUrl; ?>" class="preview-img" id="preview-img"><br>
            <input type="file" name="profile-image" id="profile-image" accept="image/*">
        </div>
        <div class="form-group">
            <label>Nova Senha:</label><br>
            <input type="password" name="password" id="password">
        </div>
        <button type="submit">Salvar</button>
    </form>
    <?php
    // Processar submissão
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $senha = isset($_POST['password']) ? $_POST['password'] : '';
        $imgName = $cliente['imagem'];
        if (isset($_FILES['profile-image']) && $_FILES['profile-image']['error'] === UPLOAD_ERR_OK) {
            $ext = pathinfo($_FILES['profile-image']['name'], PATHINFO_EXTENSION);
            $imgName = 'cliente_' . $id . '_' . time() . '.' . $ext;
            $imgPath = '../assets/images/' . $imgName;
            if (!move_uploaded_file($_FILES['profile-image']['tmp_name'], $imgPath)) {
                echo '<p style="color:red">Erro ao salvar imagem.</p>';
            }
        }
        $senhaSql = '';
        $params = [];
        if ($senha !== '') {
            $senhaHash = password_hash($senha, PASSWORD_DEFAULT);
            $senhaSql = ', senha = ?';
            $params[] = $senhaHash;
        }
        $imgSql = '';
        if ($imgName !== $cliente['imagem']) {
            $imgSql = ', imagem = ?';
            $params[] = $imgName;
        }
        $params[] = $id;
        $sql = "UPDATE cliente SET 1=1$senhaSql$imgSql WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        if ($stmt->affected_rows > 0) {
            echo '<p style="color:green">Perfil atualizado com sucesso!</p>';
            // Atualizar preview
            echo '<script>document.getElementById(\'preview-img\').src = \'' . $imgUrl . '\';</script>';
        } else {
            echo '<p style="color:red">Nada foi alterado ou erro ao atualizar.</p>';
        }
    }
    ?>
</body>
</html>
