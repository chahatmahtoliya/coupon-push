<?php
/**
 * Admin Logout
 */

require_once dirname(__DIR__) . '/includes/functions.php';

// Destroy session
session_destroy();

// Redirect to login
header('Location: ' . SITE_URL . '/admin/login.php');
exit;
