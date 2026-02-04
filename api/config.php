<?php
// config.php
define('DEBUG', false); // Set to true to enable debugging
define('SITEURL', "http://localhost/mustache-website/"); // Set to true to enable debugging

// Database connection settings
$db_host = 'sql100.infinityfree.com';
$db_user = 'if0_40999093'; // Altere para o seu utilizador MySQL
$db_pass = 'mozept123';
$db_name = 'if0_40999093_moze'; // Altere para o nome da sua base de dados

// Create MySQLi connection
$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
if ($conn->connect_error) {
	die('Erro na ligação à base de dados: ' . $conn->connect_error);
}


?>
