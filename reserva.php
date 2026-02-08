<?php
require 'api/db.inc';
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);

$distrito  = trim($input['distrito']  ?? '');
$concelho  = trim($input['concelho']  ?? '');
$categoria = trim($input['categoria'] ?? '');

if ($distrito === '' || $concelho === '') {
    echo json_encode(['status' => 'error', 'message' => 'Campos obrigatórios']);
    exit;
}

$sql = "
    SELECT 
        u.id,
        f.nome,
        f.Distrito,
        f.Concelho,
        f.Categoria,
        f.imagemperfil
    FROM utilizador u
    INNER JOIN fotografo f ON f.email = u.email
    WHERE u.tipo = 'fotografo'
      AND f.Distrito = :distrito
      AND f.Concelho = :concelho
";

$params = [
    ':distrito' => $distrito,
    ':concelho' => $concelho
];

if ($categoria !== '') {
    $sql .= " AND f.Categoria = :categoria";
    $params[':categoria'] = $categoria;
}

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$fotografos = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    'status' => 'success',
    'data' => $fotografos,
    'debug' => [
        'filtros_recebidos' => [
            'distrito' => $distrito,
            'concelho' => $concelho,
            'categoria' => $categoria
        ],
        'total_encontrados' => count($fotografos)
    ]
]);
