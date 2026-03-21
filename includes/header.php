<?php
require_once dirname(__DIR__) . '/includes/functions.php';

$siteName = getSetting('site_name', SITE_NAME);
$siteTagline = getSetting('site_tagline', SITE_TAGLINE);
$metaTitle = $pageTitle ?? getSetting('meta_title', $siteName . ' - ' . $siteTagline);
$metaDescription = $pageDescription ?? getSetting('meta_description', '');

$categories = getAllCategories();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    
    <title><?php echo sanitize($metaTitle); ?></title>
    <meta name="description" content="<?php echo sanitize($metaDescription); ?>">
    <meta name="keywords" content="<?php echo getSetting('meta_keywords', ''); ?>">
    
    <!-- Open Graph -->
    <meta property="og:title" content="<?php echo sanitize($metaTitle); ?>">
    <meta property="og:description" content="<?php echo sanitize($metaDescription); ?>">
    <meta property="og:type" content="website">
    <meta property="og:url" content="<?php echo SITE_URL; ?>">
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" href="<?php echo ASSETS_URL; ?>images/favicon.png">
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    
    <!-- Font Awesome Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Custom CSS -->
    <link rel="stylesheet" href="<?php echo ASSETS_URL; ?>css/style.css">
    
    <?php if (isset($extraCSS)) echo $extraCSS; ?>
</head>
<body>
    <!-- Top Bar -->
    <div class="top-bar">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-md-6">
                    <div class="top-bar-left">
                        <span><i class="fas fa-bolt"></i> Get the best deals delivered to your inbox!</span>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="top-bar-right">
                        <a href="<?php echo getSetting('facebook_url', '#'); ?>" target="_blank"><i class="fab fa-facebook-f"></i></a>
                        <a href="<?php echo getSetting('twitter_url', '#'); ?>" target="_blank"><i class="fab fa-twitter"></i></a>
                        <a href="<?php echo getSetting('instagram_url', '#'); ?>" target="_blank"><i class="fab fa-instagram"></i></a>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Main Header -->
    <header class="main-header">
        <div class="container">
            <nav class="navbar navbar-expand-lg">
                <!-- Logo -->
                <a class="navbar-brand" href="<?php echo SITE_URL; ?>">
                    <span class="logo-icon"><i class="fas fa-percentage"></i></span>
                    <span class="logo-text"><?php echo $siteName; ?></span>
                </a>
                
                <!-- Search Bar -->
                <div class="header-search">
                    <form action="<?php echo SITE_URL; ?>/search.php" method="GET" class="search-form">
                        <input type="text" name="q" placeholder="Search for coupons, stores..." class="search-input" required>
                        <button type="submit" class="search-btn"><i class="fas fa-search"></i></button>
                    </form>
                </div>
                
                <!-- Mobile Toggle -->
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav">
                    <span class="navbar-toggler-icon"></span>
                </button>
                
                <!-- Navigation -->
                <div class="collapse navbar-collapse" id="mainNav">
                    <ul class="navbar-nav ms-auto">
                        <li class="nav-item">
                            <a class="nav-link" href="<?php echo SITE_URL; ?>">Home</a>
                        </li>
                        <li class="nav-item dropdown">
                            <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">Categories</a>
                            <ul class="dropdown-menu">
                                <?php foreach ($categories as $cat): ?>
                                <li>
                                    <a class="dropdown-item" href="<?php echo SITE_URL; ?>/category.php?slug=<?php echo $cat['slug']; ?>">
                                        <i class="<?php echo $cat['icon']; ?>"></i> <?php echo sanitize($cat['name']); ?>
                                    </a>
                                </li>
                                <?php endforeach; ?>
                            </ul>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="<?php echo SITE_URL; ?>/all-stores.php">All Stores</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="<?php echo SITE_URL; ?>/contact.php">Contact</a>
                        </li>
                    </ul>
                </div>
            </nav>
        </div>
    </header>

    <!-- Category Bar -->
    <div class="category-bar">
        <div class="container">
            <div class="category-scroll">
                <?php foreach ($categories as $cat): ?>
                <a href="<?php echo SITE_URL; ?>/category.php?slug=<?php echo $cat['slug']; ?>" class="category-item">
                    <i class="<?php echo $cat['icon']; ?>"></i>
                    <span><?php echo sanitize($cat['name']); ?></span>
                </a>
                <?php endforeach; ?>
            </div>
        </div>
    </div>

    <!-- Flash Messages -->
    <?php if ($flash = displayFlash()): ?>
    <div class="container mt-3">
        <?php echo $flash; ?>
    </div>
    <?php endif; ?>

    <!-- Main Content -->
    <main class="main-content">
