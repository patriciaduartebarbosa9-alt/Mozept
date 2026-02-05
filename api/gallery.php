<?php
// gallery.php
// Defina DEBUG como false para produção, true para depuração
if (!defined('DEBUG')) {
    define('DEBUG', false);
}


require_once __DIR__ . '/config.php';
// Garante que SITEURL está definida
if (!defined('SITEURL')) {
    define('SITEURL', 'http://localhost/Mozept');
}

// Your PHP code for the gallery API will go here.

header('Content-Type: application/json');

// Directory containing images
$imagesDir = __DIR__ . '/../assets/images/gallery/';

$imagesUrl = SITEURL . '/assets/images/gallery/';

// Allowed image extensions
$allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

// Scan directory for images
$images = [];
if (is_dir($imagesDir)) {
    foreach (scandir($imagesDir) as $file) {
        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        if (in_array($ext, $allowedExtensions)) {
            $images[] = [
                'url' => $imagesUrl . $file,
                'caption' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' . substr(md5($file), 0, 8)
            ];
        }
    }
}


// Debugging function
function debug($varName, $varValue)
{
    if (DEBUG) {
        error_log("DEBUG: $varName = " . print_r($varValue, true));
    }
}

// Return JSON response
echo json_encode(['images' => $images]);