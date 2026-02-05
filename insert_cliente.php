<?php
require_once 'api/db.inc';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    // === 1️⃣ Receber e validar dados ===
    $nome = trim($_POST['nome'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    if (empty($nome) || empty($email) || empty($password)) {
        die("Por favor, preencha todos os campos obrigatórios.");
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        die("Email inválido.");
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    // === 2️⃣ Verificar duplicados ===
    $stmt = $pdo->prepare("SELECT email FROM cliente WHERE email = :email");
    $stmt->execute([':email' => $email]);
    if ($stmt->fetch()) die("Este email já está registado como cliente.");

    $stmt = $pdo->prepare("SELECT email FROM utilizador WHERE email = :email");
    $stmt->execute([':email' => $email]);
    if ($stmt->fetch()) die("Este email já está registado como utilizador.");

    try {
        $pdo->beginTransaction();

        // === 3️⃣ Inserir na tabela cliente ===
        $stmt = $pdo->prepare("INSERT INTO cliente (nome, email, password) VALUES (:nome, :email, :password)");
        $stmt->execute([
            ':nome' => $nome,
            ':email' => $email,
            ':password' => $passwordHash
        ]);

        // === 4️⃣ Inserir na tabela utilizador ===
        $stmt = $pdo->prepare("INSERT INTO utilizador (email, password, tipo) VALUES (:email, :password, :tipo)");
        $stmt->execute([
            ':email' => $email,
            ':password' => $passwordHash,
            ':tipo' => 'cliente'
        ]);

        $pdo->commit();

        // Redirecionar para login
        header("Location: login.html");
        exit();

    } catch (PDOException $e) {
        $pdo->rollBack();
        die("Erro ao registar: " . $e->getMessage());
    }

} else {
    die("Acesso inválido.");
}
?>
