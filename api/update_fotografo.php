
<?php

// update_fotografo.php
header('Content-Type: application/json');
// DEBUG: mostrar todos os erros PHP no output
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.inc';


if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['sucesso' => false, 'erro' => 'Método inválido']);
    exit;
}

// DEBUG: dump POST and FILES for troubleshooting
if (isset($_GET['debug'])) {
    echo '<pre>POST: ' . print_r($_POST, true) . "\nFILES: " . print_r($_FILES, true) . '</pre>';
}

$id = isset($_POST['id']) ? $_POST['id'] : '';
$categoria = isset($_POST['categoria']) ? $_POST['categoria'] : '';
// Adicione outros campos conforme necessário

if (!$id) {
    echo json_encode(['sucesso' => false, 'erro' => 'ID ausente']);
    exit;
}


$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);
if ($conn->connect_error) {
    echo json_encode(['sucesso' => false, 'erro' => 'Erro de conexão: ' . $conn->connect_error]);
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


// Inicializar variável antes do log
$imagemPerfilUrl = isset($imagemPerfilUrl) ? $imagemPerfilUrl : '';
file_put_contents(__DIR__.'/debug_update_fotografo.log', print_r([
    'POST' => $_POST,
    'FILES' => $_FILES,
    'email' => $email,
    'categoria' => $categoria,
    'imagemPerfilUrl' => $imagemPerfilUrl,
    'portfolioUrls' => $portfolioUrls ?? null
], true), FILE_APPEND);

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

// Processar uploads do portfólio e inserir/atualizar na tabela portfolio com idfotografo
$portfolioIds = [];
if (isset($_POST['portfolio_count'])) {
    $count = intval($_POST['portfolio_count']);
    for ($i = 0; $i < $count; $i++) {
        $key = 'portfolio_img_' . $i;
        $nameKey = 'portfolio_name_' . $i;
        $descKey = 'portfolio_desc_' . $i;
        $imgPath = null;
        if (isset($_FILES[$key]) && $_FILES[$key]['error'] === UPLOAD_ERR_OK) {
            $ext = pathinfo($_FILES[$key]['name'], PATHINFO_EXTENSION);
            $nomeArquivo = 'portfolio_' . $id . '_' . $i . '_' . time() . '.' . $ext;
            $destino = '../assets/images/' . $nomeArquivo;
            if (move_uploaded_file($_FILES[$key]['tmp_name'], $destino)) {
                $imgPath = 'assets/images/' . $nomeArquivo;
            }
        }
        $nome = isset($_POST[$nameKey]) ? $_POST[$nameKey] : '';
        $desc = isset($_POST[$descKey]) ? $_POST[$descKey] : '';
        // Verifica se já existe um item de portfólio com este nome para este fotógrafo
        $stmtCheck = $conn->prepare("SELECT idportfolio FROM portfolio WHERE idfotografo=? AND nome=? LIMIT 1");
        $stmtCheck->bind_param('is', $id, $nome);
        $stmtCheck->execute();
        $stmtCheck->bind_result($idportfolio);
        if ($stmtCheck->fetch()) {
            // Atualiza o item existente
            $stmtCheck->close();
            if ($imgPath) {
                $stmtUpdate = $conn->prepare("UPDATE portfolio SET imagem=?, descricao=? WHERE idportfolio=?");
                $stmtUpdate->bind_param('ssi', $imgPath, $desc, $idportfolio);
            } else {
                $stmtUpdate = $conn->prepare("UPDATE portfolio SET descricao=? WHERE idportfolio=?");
                $stmtUpdate->bind_param('si', $desc, $idportfolio);
            }
            $stmtUpdate->execute();
            $stmtUpdate->close();
            $portfolioIds[] = $idportfolio;
        } else {
            $stmtCheck->close();
            // Insere novo item
            if ($imgPath) {
                $stmtP = $conn->prepare("INSERT INTO portfolio (idfotografo, imagem, nome, descricao) VALUES (?, ?, ?, ?)");
                $stmtP->bind_param('isss', $id, $imgPath, $nome, $desc);
            } else {
                $stmtP = $conn->prepare("INSERT INTO portfolio (idfotografo, nome, descricao) VALUES (?, ?, ?)");
                $stmtP->bind_param('iss', $id, $nome, $desc);
            }
            if ($stmtP->execute()) {
                $portfolioIds[] = $conn->insert_id;
            }
            $stmtP->close();
        }
    }
}

// Atualizar BD
if ($imagemPerfilUrl) {
    $stmt = $conn->prepare("UPDATE fotografo SET Categoria=?, imagemperfil=? WHERE email=?");
    $stmt->bind_param('sss', $categoria, $imagemPerfilUrl, $email);
} else {
    $stmt = $conn->prepare("UPDATE fotografo SET Categoria=? WHERE email=?");
    $stmt->bind_param('ss', $categoria, $email);
}

if ($stmt->execute()) {
    echo json_encode(['sucesso' => true, 'imagemperfil' => $imagemPerfilUrl, 'portfolio' => $portfolioIds]);
} else {
    echo json_encode(['sucesso' => false, 'erro' => 'Erro ao atualizar']);
}
$stmt->close();
$conn->close();
