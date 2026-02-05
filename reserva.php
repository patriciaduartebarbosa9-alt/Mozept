
<?php
require_once 'api/db.inc';
header('Content-Type: application/json');

// Receber dados JSON do fetch
$input = json_decode(file_get_contents('php://input'), true);

$distrito = isset($input['distrito']) ? trim($input['distrito']) : '';
$concelho = isset($input['concelho']) ? trim($input['concelho']) : '';
$categoria = isset($input['categoria']) ? trim($input['categoria']) : '';

// Filtros obrigatórios: distrito e concelho
if ($distrito === '' || $concelho === '') {
    echo json_encode(['status' => 'error', 'message' => 'Campos obrigatórios']);
    exit;
}

// Montar query dinâmica
$sql = "SELECT * FROM fotografo WHERE distrito = :distrito AND concelho = :concelho";
$params = [':distrito' => $distrito, ':concelho' => $concelho];
if ($categoria !== '') {
    $sql .= " AND categoria = :categoria";
    $params[':categoria'] = $categoria;
}

try {
    global $pdo;
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $fotografos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode([
        'status' => 'success',
        'data' => $fotografos
    ]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Erro ao buscar fotógrafos']);
}

?>