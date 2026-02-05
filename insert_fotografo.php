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
    $stmt = $pdo->prepare("SELECT email FROM fotografo WHERE email = :email");
    $stmt->execute([':email' => $email]);
    if ($stmt->fetch()) die("Este email já está registado como fotógrafo.");

    $stmt = $pdo->prepare("SELECT email FROM utilizador WHERE email = :email");
    $stmt->execute([':email' => $email]);
    if ($stmt->fetch()) die("Este email já está registado como utilizador.");

    // === 3️⃣ Upload do certificado ===
    $certificadoPath = null;
    if (isset($_FILES['certificado']) && $_FILES['certificado']['error'] === 0) {

        $allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        $maxSize = 5 * 1024 * 1024; // 5MB

        if (!in_array($_FILES['certificado']['type'], $allowedTypes)) die("Tipo de ficheiro inválido.");
        if ($_FILES['certificado']['size'] > $maxSize) die("Ficheiro demasiado grande.");

        $uploadDir = __DIR__ . '/uploads/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

        $filename = uniqid() . '_' . basename($_FILES['certificado']['name']);
        $certificadoPath = $uploadDir . $filename;

        if (!move_uploaded_file($_FILES['certificado']['tmp_name'], $certificadoPath)) {
            die("Erro ao guardar o ficheiro.");
        }
    }

    try {
        $pdo->beginTransaction();

        // === 4️⃣ Inserir na tabela fotografo ===
        $distrito = trim($_POST['distrito'] ?? '');
        $concelho = trim($_POST['concelho'] ?? '');
        $stmt = $pdo->prepare("INSERT INTO fotografo (nome, email, password, certificado, distrito, concelho) VALUES (:nome, :email, :password, :certificado, :distrito, :concelho)");
        $stmt->execute([
            ':nome' => $nome,
            ':email' => $email,
            ':password' => $passwordHash,
            ':certificado' => isset($filename) ? $filename : null,
            ':distrito' => $distrito,
            ':concelho' => $concelho
        ]);

        // === 5️⃣ Inserir na tabela utilizador ===
        $stmt = $pdo->prepare("INSERT INTO utilizador (email, password, tipo) VALUES (:email, :password, :tipo)");
        $stmt->execute([
            ':email' => $email,
            ':password' => $passwordHash,
            ':tipo' => 'fotografo' // define o tipo de utilizador
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
