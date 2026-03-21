<?php
// Enable error display
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "Step 1: Starting...<br>";

require_once 'config.php';
echo "Step 2: Config loaded<br>";

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
    echo "Step 3: Database connected<br>";

    $sql = "SELECT * FROM seasonal_offers WHERE is_active = 1 LIMIT 1";
    $stmt = $pdo->query($sql);
    $offers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "Step 4: Query successful<br>";
    echo "Found " . count($offers) . " offers<br>";

    if (count($offers) > 0) {
        echo "<pre>";
        print_r($offers[0]);
        echo "</pre>";
    }
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "<br>";
    echo "Line: " . $e->getLine() . "<br>";
    echo "File: " . $e->getFile() . "<br>";
}
