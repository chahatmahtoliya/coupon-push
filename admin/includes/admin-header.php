<?php

/**
 * Admin Header
 */

// Start output buffering to prevent "headers already sent" errors
ob_start();

require_once dirname(dirname(__DIR__)) . '/includes/functions.php';
requireLogin();

$currentUser = getCurrentUser();
$currentPage = basename($_SERVER['PHP_SELF'], '.php');
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $pageTitle ?? 'Admin Panel'; ?> - <?php echo SITE_NAME; ?></title>

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">

    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">

    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">

    <!-- Admin CSS (Embedded) -->
    <style>
        :root {
            --primary: #6366f1;
            --primary-dark: #4f46e5;
            --sidebar-width: 260px;
            --header-height: 64px;
            --gray-100: #f1f5f9;
            --gray-200: #e2e8f0;
            --gray-300: #cbd5e1;
            --gray-400: #94a3b8;
            --gray-500: #64748b;
            --gray-600: #475569;
            --gray-700: #334155;
            --gray-800: #1e293b;
            --gray-900: #0f172a;
            --white: #ffffff;
        }

        * {
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', sans-serif;
            background: var(--gray-100);
            margin: 0;
        }

        .admin-wrapper {
            display: flex;
            min-height: 100vh;
        }

        .admin-sidebar {
            width: var(--sidebar-width);
            background: linear-gradient(180deg, var(--gray-900) 0%, var(--gray-800) 100%);
            color: var(--white);
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            overflow-y: auto;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            transition: all 0.3s;
        }

        .sidebar-header {
            padding: 1.25rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .sidebar-brand {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            color: var(--white);
            text-decoration: none;
            font-size: 1.25rem;
            font-weight: 700;
        }

        .sidebar-brand i {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--primary);
            border-radius: 10px;
            font-size: 1.125rem;
        }

        .sidebar-nav {
            flex: 1;
            padding: 1rem 0;
        }

        .sidebar-nav .nav {
            gap: 0.25rem;
            padding: 0 0.75rem;
        }

        .sidebar-nav .nav-item {
            list-style: none;
        }

        .sidebar-nav .nav-link {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1rem;
            color: var(--gray-400);
            text-decoration: none;
            border-radius: 8px;
            transition: all 0.2s;
            font-size: 0.9375rem;
        }

        .sidebar-nav .nav-link:hover {
            color: var(--white);
            background: rgba(255, 255, 255, 0.08);
        }

        .sidebar-nav .nav-link.active {
            color: var(--white);
            background: var(--primary);
        }

        .sidebar-nav .nav-link i {
            width: 20px;
            text-align: center;
            font-size: 1rem;
        }

        .nav-section {
            font-size: 0.6875rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--gray-500);
            padding: 1.25rem 1rem 0.5rem;
            font-weight: 600;
            list-style: none;
        }

        .sidebar-footer {
            padding: 1rem 1.25rem;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .admin-main {
            flex: 1;
            margin-left: var(--sidebar-width);
            display: flex;
            flex-direction: column;
        }

        .admin-header {
            height: var(--header-height);
            background: var(--white);
            border-bottom: 1px solid var(--gray-200);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 1.5rem;
            position: sticky;
            top: 0;
            z-index: 100;
        }

        .header-search input {
            width: 300px;
            background: var(--gray-100);
            border: 1px solid var(--gray-200);
            border-radius: 8px;
            padding: 0.5rem 1rem;
        }

        .admin-content {
            flex: 1;
            padding: 1.5rem;
        }

        .page-header {
            margin-bottom: 1.5rem;
        }

        .page-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--gray-900);
            margin: 0 0 0.25rem;
        }

        .page-subtitle {
            color: var(--gray-500);
            margin: 0;
        }

        .avatar {
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--gray-200);
            border-radius: 50%;
            color: var(--gray-600);
        }

        @media (max-width: 991.98px) {
            .admin-sidebar {
                transform: translateX(-100%);
            }

            .admin-sidebar.show {
                transform: translateX(0);
            }

            .admin-main {
                margin-left: 0;
            }
        }
    </style>
</head>

<body>
    <div class="admin-wrapper">
        <!-- Sidebar -->
        <aside class="admin-sidebar">
            <div class="sidebar-header">
                <a href="<?php echo SITE_URL; ?>/admin/" class="sidebar-brand">
                    <i class="fas fa-percentage"></i>
                    <span><?php echo SITE_NAME; ?></span>
                </a>
            </div>

            <nav class="sidebar-nav">
                <ul class="nav flex-column">
                    <li class="nav-item">
                        <a class="nav-link <?php echo $currentPage === 'index' ? 'active' : ''; ?>" href="<?php echo SITE_URL; ?>/admin/">
                            <i class="fas fa-tachometer-alt"></i>
                            <span>Dashboard</span>
                        </a>
                    </li>

                    <li class="nav-section">Manage</li>

                    <li class="nav-item">
                        <a class="nav-link <?php echo $currentPage === 'coupons' ? 'active' : ''; ?>" href="<?php echo SITE_URL; ?>/admin/coupons.php">
                            <i class="fas fa-ticket-alt"></i>
                            <span>Coupons</span>
                        </a>
                    </li>

                    <li class="nav-item">
                        <a class="nav-link <?php echo $currentPage === 'stores' ? 'active' : ''; ?>" href="<?php echo SITE_URL; ?>/admin/stores.php">
                            <i class="fas fa-store"></i>
                            <span>Stores</span>
                        </a>
                    </li>

                    <li class="nav-item">
                        <a class="nav-link <?php echo $currentPage === 'categories' ? 'active' : ''; ?>" href="<?php echo SITE_URL; ?>/admin/categories.php">
                            <i class="fas fa-folder"></i>
                            <span>Categories</span>
                        </a>
                    </li>

                    <li class="nav-item">
                        <a class="nav-link <?php echo $currentPage === 'deals' ? 'active' : ''; ?>" href="<?php echo SITE_URL; ?>/admin/deals.php">
                            <i class="fas fa-fire"></i>
                            <span>Deals</span>
                        </a>
                    </li>

                    <li class="nav-item">
                        <a class="nav-link <?php echo $currentPage === 'seasonal-offers' ? 'active' : ''; ?>" href="<?php echo SITE_URL; ?>/admin/seasonal-offers.php">
                            <i class="fas fa-gift"></i>
                            <span>Seasonal Offers</span>
                        </a>
                    </li>

                    <li class="nav-section">Communication</li>

                    <li class="nav-item">
                        <a class="nav-link <?php echo $currentPage === 'subscribers' ? 'active' : ''; ?>" href="<?php echo SITE_URL; ?>/admin/subscribers.php">
                            <i class="fas fa-users"></i>
                            <span>Subscribers</span>
                        </a>
                    </li>

                    <li class="nav-item">
                        <a class="nav-link <?php echo $currentPage === 'messages' ? 'active' : ''; ?>" href="<?php echo SITE_URL; ?>/admin/messages.php">
                            <i class="fas fa-envelope"></i>
                            <span>Messages</span>
                        </a>
                    </li>

                    <li class="nav-section">Settings</li>

                    <li class="nav-item">
                        <a class="nav-link <?php echo $currentPage === 'settings' ? 'active' : ''; ?>" href="<?php echo SITE_URL; ?>/admin/settings.php">
                            <i class="fas fa-cog"></i>
                            <span>Settings</span>
                        </a>
                    </li>
                </ul>
            </nav>

            <div class="sidebar-footer">
                <a href="<?php echo SITE_URL; ?>" target="_blank" class="btn btn-outline-light btn-sm w-100">
                    <i class="fas fa-external-link-alt me-2"></i> View Site
                </a>
            </div>
        </aside>

        <!-- Main Content -->
        <div class="admin-main">
            <!-- Top Bar -->
            <header class="admin-header">
                <button class="sidebar-toggle d-lg-none" id="sidebarToggle">
                    <i class="fas fa-bars"></i>
                </button>

                <div class="header-search d-none d-md-block">
                    <form action="<?php echo SITE_URL; ?>/admin/search.php" method="GET">
                        <input type="text" name="q" placeholder="Search..." class="form-control">
                    </form>
                </div>

                <div class="header-actions">
                    <div class="dropdown">
                        <button class="btn btn-link dropdown-toggle" type="button" data-bs-toggle="dropdown">
                            <span class="avatar">
                                <i class="fas fa-user"></i>
                            </span>
                            <span class="d-none d-md-inline ms-2"><?php echo sanitize($currentUser['full_name'] ?? $currentUser['username']); ?></span>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li>
                                <a class="dropdown-item" href="<?php echo SITE_URL; ?>/admin/profile.php">
                                    <i class="fas fa-user me-2"></i> Profile
                                </a>
                            </li>
                            <li>
                                <hr class="dropdown-divider">
                            </li>
                            <li>
                                <a class="dropdown-item text-danger" href="<?php echo SITE_URL; ?>/admin/logout.php">
                                    <i class="fas fa-sign-out-alt me-2"></i> Logout
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </header>

            <!-- Page Content -->
            <main class="admin-content">
                <?php echo displayFlash(); ?>