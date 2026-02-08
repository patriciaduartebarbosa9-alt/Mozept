<?php
// Ativar erros
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Incluir ligação à BD
require_once 'api/db.inc';

// Verificar se $pdo existe
if (!isset($pdo)) {
    die("Erro: a variável \$pdo não está definida no db.inc");
}

// Testar ligação
try {
    $pdo->query("SELECT 1");
    echo "Ligação OK<br><br>";
} catch (PDOException $e) {
    die("Erro na ligação: " . $e->getMessage());
}

// Mostrar todos os dados da tabela 'utilizador'
try {
    $stmt = $pdo->query("SELECT * FROM utilizador");
    $rows = $stmt->fetchAll();

    if ($rows) {
        echo "<pre>";
        print_r($rows);
        echo "</pre>";
    } else {
        echo "Tabela 'utilizador' vazia.";
    }
} catch (PDOException $e) {
    echo "Erro na query: " . $e->getMessage();
}
?>
