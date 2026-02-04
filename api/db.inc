<?php
// Database connection details

$host = 'sql100.infinityfree.com';
$username = 'if0_40999093';
$password = 'mozept123';
$database = 'if0_40999093_moze';

// Create a connection
$conn = new mysqli($host, $username, $password, $database);

// Check the connection
if ($conn->connect_error) {
    die('Database connection failed: ' . $conn->connect_error);
}
?>
