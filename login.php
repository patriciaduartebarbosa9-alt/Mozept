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

// Inicializar dados do fotógrafo
// Inicializar dados do utilizador
$utilizador_id = null;
$certificado_verificado = false;
$status_certificado = 'pendente';
if ($user['tipo'] === 'fotografo') {
    $stmt = $pdo->prepare("SELECT email, certificado, certificado_verificado FROM fotografo WHERE email = :email");
    $stmt->execute([':email' => $user['email']]);
    $foto = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($foto) {
        $utilizador_id = $foto['email'];
        if (!empty($foto['certificado'])) {
            $certificado_verificado = (bool)$foto['certificado_verificado'];
            $status_certificado = $certificado_verificado ? 'verificado' : 'pendente_verificacao';
        }
    }
} elseif ($user['tipo'] === 'cliente') {
    // Buscar o id da tabela utilizador para este email
    $stmt = $pdo->prepare("SELECT id FROM utilizador WHERE email = :email");
    $stmt->execute([':email' => $user['email']]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $utilizador_id = $row ? $row['id'] : $user['email'];
}

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

// Se for fotógrafo, adicionar status do certificado
if ($user['tipo'] === 'fotografo') {
    $userData['certificado'] = [
        'status' => $status_certificado,
        'verificado' => $certificado_verificado
    ];
    
    if ($status_certificado === 'pendente') {
        $userData['mensagem_certificado'] = 'Por favor, faça upload do seu certificado profissional para completar o perfil';
    }
}

response('success', 'Login realizado com sucesso!', $userData);
// Não existe $conn, não fechar
?>
