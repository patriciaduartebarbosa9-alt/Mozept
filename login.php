<?php
header('Content-Type: application/json; charset=utf-8');
error_reporting(E_ALL);
ini_set('display_errors', '0');
require_once 'config.php';

// Função para retornar respostas JSON
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
$data = json_decode(file_get_contents('php://input'), true);

// Validações
$email = isset($data['email']) ? trim($data['email']) : '';
$password = isset($data['password']) ? $data['password'] : '';

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    response('error', 'Email inválido');
}

if (empty($password)) {
    response('error', 'Password é obrigatória');
}

// Buscar utilizador
$stmt = $conn->prepare("SELECT * FROM utilizador WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    response('error', 'Email ou password incorretos');
}

$user = $result->fetch_assoc();
$stmt->close();

// Verificar password
if (!password_verify($password, $user['password'])) {
    response('error', 'Email ou password incorretos');
}

// Inicializar dados do fotógrafo
$certificado_verificado = false;
$status_certificado = 'pendente';
$fotografo_id = null;

// Se for fotógrafo, buscar dados na tabela fotografos
if ($user['tipo'] === 'fotografo') {
    $stmt = $conn->prepare("SELECT id, certificado, certificado_verificado FROM fotografo WHERE email = ?");
    $stmt->bind_param("s", $user['email']);
    $stmt->execute();
    $foto_result = $stmt->get_result();

    if ($foto_result->num_rows > 0) {
        $foto = $foto_result->fetch_assoc();
        $fotografo_id = $foto['email'];
        if (!empty($foto['certificado'])) {
            $certificado_verificado = (bool)$foto['certificado_verificado'];
            $status_certificado = $certificado_verificado ? 'verificado' : 'pendente_verificacao';
        }
    }
    $stmt->close();
}

// Gerar token simples (pode usar JWT em produção)
$token = bin2hex(random_bytes(32));

// Salvar token em sessão
session_start();
$_SESSION['utilizador_email'] = $user['email'];
$_SESSION['utilizador_tipo'] = $user['tipo'];
$_SESSION['token'] = $token;

// Preparar dados para retorno
$userData = [
    'email' => $user['email'],
    'nome' => $user['nome_completo'] ?? '',
    'tipo' => $user['tipo'],
    'foto_perfil' => $user['foto_perfil'] ?? null,
    'token' => $token,
    'fotografo_id' => $fotografo_id
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

$conn->close();
?>
