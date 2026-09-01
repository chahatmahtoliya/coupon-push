<?php

/**
 * Database bootstrap for the deployable admin package.
 * Keep real credentials in database.local.php, which is excluded from Git.
 */

$credentialsFile = __DIR__ . '/database.local.php';

if (!is_file($credentialsFile)) {
    error_log('Missing admin database configuration: ' . $credentialsFile);
    http_response_code(500);
    exit('Admin database configuration is missing.');
}

$credentials = require $credentialsFile;
$requiredKeys = ['host', 'name', 'user', 'password'];

foreach ($requiredKeys as $key) {
    if (!array_key_exists($key, $credentials) || $credentials[$key] === '') {
        error_log('Invalid admin database configuration key: ' . $key);
        http_response_code(500);
        exit('Admin database configuration is incomplete.');
    }
}

define('DB_HOST', $credentials['host']);
define('DB_NAME', $credentials['name']);
define('DB_USER', $credentials['user']);
define('DB_PASS', $credentials['password']);
define('DB_CHARSET', $credentials['charset'] ?? 'utf8mb4');
unset($credentials);

class Database
{
    private static $instance = null;
    private $pdo;

    private function __construct()
    {
        try {
            $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci',
            ];

            $this->pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            error_log('Database Connection Error: ' . $e->getMessage());
            http_response_code(500);
            exit('Unable to connect to the admin database.');
        }
    }

    public static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    public function getConnection()
    {
        return $this->pdo;
    }

    public function query($sql, $params = [])
    {
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            error_log('Query Error: ' . $e->getMessage());
            return false;
        }
    }

    public function fetchAll($sql, $params = [])
    {
        $stmt = $this->query($sql, $params);
        return $stmt ? $stmt->fetchAll() : [];
    }

    public function fetch($sql, $params = [])
    {
        $stmt = $this->query($sql, $params);
        return $stmt ? $stmt->fetch() : null;
    }

    public function insert($sql, $params = [])
    {
        $stmt = $this->query($sql, $params);
        return $stmt ? $this->pdo->lastInsertId() : false;
    }

    public function update($sql, $params = [])
    {
        $stmt = $this->query($sql, $params);
        return $stmt ? $stmt->rowCount() : 0;
    }

    public function delete($sql, $params = [])
    {
        return $this->update($sql, $params);
    }

    public function count($table, $where = '', $params = [])
    {
        $sql = "SELECT COUNT(*) AS count FROM {$table}";
        if ($where) {
            $sql .= " WHERE {$where}";
        }

        $result = $this->fetch($sql, $params);
        return $result ? (int) $result['count'] : 0;
    }

    private function __clone()
    {
    }

    public function __wakeup()
    {
        throw new Exception('Cannot unserialize the database singleton.');
    }
}

function db()
{
    return Database::getInstance();
}
