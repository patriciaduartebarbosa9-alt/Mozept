ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (isset($_SESSION['utilizador_id'])) {
    header('Location: login.html');
    exit;
}

$erro = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nome = trim($_POST['nome'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $imagemperfil = '';
    $certificado = '';
    if (isset($_FILES['certificado']) && $_FILES['certificado']['error'] == UPLOAD_ERR_OK) {
        $certificado = basename($_FILES['certificado']['name']);
        move_uploaded_file($_FILES['certificado']['tmp_name'], '../uploads/' . $certificado);
    }
    $servicos = trim($_POST['servicos'] ?? '');
    $idportfolio = 0;

    if (empty($nome) || empty($email) || empty($password)) {
        $erro = 'Todos os campos obrigatórios devem ser preenchidos';
    } elseif (strlen($password) < 6) {
        $erro = 'A password deve ter no mínimo 6 caracteres';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $erro = 'Email inválido';
    } else {
            $host = 'sql100.infinityfree.com';
            $username = 'if0_40999093';
            $password = 'mozept123';
            $database = 'if0_40999093_moze';

        $conn = mysqli_connect($host, $user, $pass, $db);

        if (!$conn) {
            $erro = 'Erro ao conectar à base de dados';
        } else {
            mysqli_set_charset($conn, "utf8mb4");

            $stmt = $conn->prepare("SELECT id FROM utilizador WHERE email = ?");
            if ($stmt) {
                $stmt->bind_param("s", $email);
                $stmt->execute();
                $result = $stmt->get_result();
                if ($result->num_rows > 0) {
                    $erro = 'Este email já está registado';
                } else {
                    $password_hash = password_hash($password, PASSWORD_BCRYPT);
                    $stmt2 = $conn->prepare("INSERT INTO fotografo (nome, email, password, imagemperfil, certificado, servicos, idportfolio) VALUES (?, ?, ?, ?, ?, ?, ?)");
                    if ($stmt2) {
                        $stmt2->bind_param("ssssssi", $nome, $email, $password_hash, $imagemperfil, $certificado, $servicos, $idportfolio);
                        if ($stmt2->execute()) {
                            $idfotografo = $stmt2->insert_id;
                            $stmt3 = $conn->prepare("INSERT INTO utilizador (idfotografo, nome, email) VALUES (?, ?, ?)");
                            if ($stmt3) {
                                $stmt3->bind_param("iss", $idfotografo, $nome, $email);
                                $stmt3->execute();
                                $stmt3->close();
                            }
                            header('Location: index.html');
                            exit;
                        } else {
                            $erro = 'Erro ao registar fotografo: ' . mysqli_error($conn);
                        }
                        $stmt2->close();
                    } else {
                        $erro = 'Erro na preparação da query de fotografo';
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

if (!empty($erro)) {
    echo '<div style="color:red; font-weight:bold; text-align:center; margin-top:32px;">' . htmlspecialchars($erro) . '</div>';
}
?>