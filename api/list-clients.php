<?php
// list-clients.php
// API endpoint to list all clients

// Include the database connection
require_once __DIR__ . '/db.inc';

// Set response header to JSON
header('Content-Type: application/json');

// Ensure the request method is GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['message' => 'Method Not Allowed. GET required.']);
    exit;
}

// Ensure the request comes from the same server
if (!isset($_SERVER['HTTP_REFERER']) || parse_url($_SERVER['HTTP_REFERER'], PHP_URL_HOST) !== $_SERVER['SERVER_NAME']) {
    http_response_code(403);
    echo json_encode(['message' => 'Forbidden. Invalid referer.']);
    exit;
}

try {
    // Query to fetch clients
    $sql = "SELECT id, nome, id, cliente FROM cliente";
    $result = $conn->query($sql);
    if ($result === false) {
        http_response_code(500);
        echo json_encode(['message' => 'Database query failed.']);
        exit;
    }

    $cliente = [];
    while ($row = $result->fetch_assoc()) {
        $cliente[] = $row;
    }

    // Return JSON response
    http_response_code(200);
    echo json_encode(['cliente' => $cliente]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => $e->getMessage()]);
}

// Close the database connection
$conn->close();
