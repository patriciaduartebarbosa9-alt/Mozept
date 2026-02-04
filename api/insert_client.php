<?php
// Iniciar sessão
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Se já está autenticado, redirecionar
if (isset($_SESSION['id'])) {
    header('Location: index.html');
    exit;
}

$erro = '';
$sucesso = '';

// Processar formulário
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nome = trim($_POST['nome'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $password_confirm = $_POST['password_confirm'] ?? '';
    $id = $_POST['id'] ?? '';

    // Validações
    if (empty($nome) || empty($email) || empty($password) || empty($password_confirm)) {
        $erro = 'Todos os campos são obrigatórios';
    } elseif ($password !== $password_confirm) {
        $erro = 'As passwords não coincidem';
    } elseif (strlen($password) < 6) {
        $erro = 'A password deve ter no mínimo 6 caracteres';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $erro = 'Email inválido';
    } else {
        // Ligação à BD
            $host = 'sql100.infinityfree.com';
            $username = 'if0_40999093';
            $password = 'mozept123';
            $database = 'if0_40999093_moze';

        $conn = mysqli_connect($host, $user, $pass, $db);

        if (!$conn) {
            $erro = 'Erro ao conectar à base de dados';
        } else {
            mysqli_set_charset($conn, "utf8mb4");

            // Verificar se email já existe
            $stmt = $conn->prepare("SELECT id FROM utilizador WHERE email = ?");
            if ($stmt) {
                $stmt->bind_param("s", $email);
                $stmt->execute();
                $result = $stmt->get_result();

                if ($result->num_rows > 0) {
                    $erro = 'Este email já está registado';
                } else {
                    // Hash da password
                    $password_hash = password_hash($password, PASSWORD_BCRYPT);

                    // Inserir utilizador
                    $stmt = $conn->prepare("
                        INSERT INTO utilizador (id, idfotografo, idcliente, email, password)
                        VALUES (?, ?, ?, ?, ?)
                    ");

                    if ($stmt) {
                        $stmt->bind_param("sssss", $id, $idfotografo, $idcliente, $email, $password_hash);

                        if ($stmt->execute()) {
                            $utilizador_id = $stmt->insert_id;

                            // Criar registo em clientes
                            $stmt2 = $conn->prepare("INSERT INTO clientes (id, nome) VALUES (?, ?)");
                            if ($stmt2) {
                                $localizacao = '';
                                $stmt2->bind_param("is", $id, $nome);
                                $stmt2->execute();
                                $stmt2->close();
                            }

                            // Login automático
                            $_SESSION['id'] = $id;
                            $_SESSION['tipo'] = 'cliente';

                            header('Location: perfil-cliente.php');
                            exit;
                        } else {
                            $erro = 'Erro ao registar utilizador: ' . mysqli_error($conn);
                        }
                    } else {
                        $erro = 'Erro na preparação da query';
                    }
                }
                $stmt->close();
            } else {
                $erro = 'Erro ao verificar email';
            }

            mysqli_close($conn);
        }
    }
}