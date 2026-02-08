<?php
require_once 'api/db.inc';
function response($status, $message, $data = null) {
    echo json_encode([
        'status' => $status,
        'message' => $message,
        'data' => $data
    ]);
    exit;
}

// Verificar se é POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    response('error', 'Método não permitido');
}

// Receber dados

// Receber dados do formulário tradicional ou JSON
if (!empty($_POST)) {
    $email = isset($_POST['email']) ? trim($_POST['email']) : '';
    $password = isset($_POST['password']) ? $_POST['password'] : '';
} else {
    $data = json_decode(file_get_contents('php://input'), true);
    $email = isset($data['email']) ? trim($data['email']) : '';
    $password = isset($data['password']) ? $data['password'] : '';
}

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    response('error', 'Email inválido');
}

if (empty($password)) {
    response('error', 'Password é obrigatória');
}

// Buscar utilizador

$stmt = $pdo->prepare("SELECT * FROM utilizador WHERE email = :email");
$stmt->execute([':email' => $email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$user) {
    response('error', 'Email ou password incorretos');
}

// Verificar password
if (!password_verify($password, $user['password'])) {
    response('error', 'Email ou password incorretos');
}


// Inicializar id do utilizador (usar id se existir, senão email)
$utilizador_id = isset($user['id']) ? $user['id'] : $user['email'];

// Gerar token simples (pode usar JWT em produção)
$token = bin2hex(random_bytes(32));

// Salvar token em sessão
session_start();
$_SESSION['utilizador_email'] = $user['email'];
$_SESSION['utilizador_tipo'] = $user['tipo'];
$_SESSION['token'] = $token;
$_SESSION['utilizador_id'] = $utilizador_id;

// Preparar dados para retorno


$userData = [
    'id' => $utilizador_id,
    'email' => $user['email'],
    'nome' => $user['nome_completo'] ?? '',
    'tipo' => $user['tipo'],
    'foto_perfil' => $user['foto_perfil'] ?? null,
    'token' => $token
];



response('success', 'Login realizado com sucesso!', $userData);
// Não existe $conn, não fechar
?>