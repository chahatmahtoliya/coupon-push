    </main>

    <!-- Newsletter Section -->
    <section class="newsletter-section">
        <div class="container">
            <div class="newsletter-box">
                <div class="row align-items-center">
                    <div class="col-lg-6">
                        <div class="newsletter-content">
                            <h3><i class="fas fa-envelope-open-text"></i> Subscribe to Our Newsletter</h3>
                            <p>Get the latest coupons and deals delivered directly to your inbox!</p>
                        </div>
                    </div>
                    <div class="col-lg-6">
                        <form id="newsletterForm" class="newsletter-form">
                            <div class="input-group">
                                <input type="email" name="email" class="form-control" placeholder="Enter your email address" required>
                                <button type="submit" class="btn btn-subscribe">
                                    <span class="btn-text">Subscribe</span>
                                    <span class="btn-loading" style="display:none;"><i class="fas fa-spinner fa-spin"></i></span>
                                </button>
                            </div>
                            <div class="newsletter-message mt-2"></div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="main-footer">
        <div class="container">
            <div class="row">
                <!-- About -->
                <div class="col-lg-4 col-md-6 mb-4">
                    <div class="footer-widget">
                        <div class="footer-logo">
                            <span class="logo-icon"><i class="fas fa-percentage"></i></span>
                            <span class="logo-text"><?php echo getSetting('site_name', SITE_NAME); ?></span>
                        </div>
                        <p class="footer-about">
                            Your one-stop destination for the best coupons, promo codes, deals and offers from top online stores in India. Save money on every purchase!
                        </p>
                        <div class="footer-social">
                            <a href="<?php echo getSetting('facebook_url', '#'); ?>" target="_blank"><i class="fab fa-facebook-f"></i></a>
                            <a href="<?php echo getSetting('twitter_url', '#'); ?>" target="_blank"><i class="fab fa-twitter"></i></a>
                            <a href="<?php echo getSetting('instagram_url', '#'); ?>" target="_blank"><i class="fab fa-instagram"></i></a>
                        </div>
                    </div>
                </div>
                
                <!-- Quick Links -->
                <div class="col-lg-2 col-md-6 mb-4">
                    <div class="footer-widget">
                        <h4>Quick Links</h4>
                        <ul class="footer-links">
                            <li><a href="<?php echo SITE_URL; ?>">Home</a></li>
                            <li><a href="<?php echo SITE_URL; ?>/all-stores.php">All Stores</a></li>
                            <li><a href="<?php echo SITE_URL; ?>/contact.php">Contact Us</a></li>
                            <li><a href="<?php echo SITE_URL; ?>/privacy-policy.php">Privacy Policy</a></li>
                        </ul>
                    </div>
                </div>
                
                <!-- Categories -->
                <div class="col-lg-3 col-md-6 mb-4">
                    <div class="footer-widget">
                        <h4>Popular Categories</h4>
                        <ul class="footer-links">
                            <?php 
                            $footerCategories = array_slice($categories, 0, 6);
                            foreach ($footerCategories as $cat): 
                            ?>
                            <li>
                                <a href="<?php echo SITE_URL; ?>/category.php?slug=<?php echo $cat['slug']; ?>">
                                    <?php echo sanitize($cat['name']); ?>
                                </a>
                            </li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                </div>
                
                <!-- Contact Info -->
                <div class="col-lg-3 col-md-6 mb-4">
                    <div class="footer-widget">
                        <h4>Contact Info</h4>
                        <ul class="footer-contact">
                            <li>
                                <i class="fas fa-envelope"></i>
                                <a href="mailto:<?php echo getSetting('site_email', SITE_EMAIL); ?>">
                                    <?php echo getSetting('site_email', SITE_EMAIL); ?>
                                </a>
                            </li>
                            <li>
                                <i class="fas fa-phone"></i>
                                <span><?php echo getSetting('site_phone', ''); ?></span>
                            </li>
                            <li>
                                <i class="fas fa-map-marker-alt"></i>
                                <span><?php echo getSetting('site_address', ''); ?></span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <!-- Copyright -->
            <div class="footer-bottom">
                <div class="row align-items-center">
                    <div class="col-md-6">
                        <p class="copyright">
                            &copy; <?php echo date('Y'); ?> <?php echo getSetting('site_name', SITE_NAME); ?>. All Rights Reserved.
                        </p>
                    </div>
                    <div class="col-md-6">
                        <p class="disclaimer">
                            We may earn a commission when you use our coupons to make a purchase.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </footer>

    <!-- Back to Top Button -->
    <button id="backToTop" class="back-to-top">
        <i class="fas fa-chevron-up"></i>
    </button>

    <!-- Coupon Modal -->
    <div class="modal fade" id="couponModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content coupon-modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Get Your Coupon Code</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body text-center">
                    <div class="store-info mb-3">
                        <img id="modalStoreLogo" src="" alt="Store" class="store-logo-modal">
                        <h4 id="modalStoreName"></h4>
                    </div>
                    <div class="coupon-title mb-3">
                        <h5 id="modalCouponTitle"></h5>
                    </div>
                    <div class="coupon-code-box">
                        <span id="modalCouponCode" class="coupon-code-text"></span>
                        <button id="copyCodeBtn" class="copy-btn" onclick="copyCode()">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                    </div>
                    <p class="copy-message" id="copyMessage"></p>
                    <a id="modalAffiliateLink" href="#" target="_blank" class="btn btn-primary btn-visit-store">
                        <i class="fas fa-external-link-alt"></i> Visit Store
                    </a>
                </div>
            </div>
        </div>
    </div>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- Custom JS -->
    <script src="<?php echo ASSETS_URL; ?>js/main.js"></script>
    
    <?php if (isset($extraJS)) echo $extraJS; ?>
    
    <script>
        // Newsletter form submission
        document.getElementById('newsletterForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const form = this;
            const email = form.querySelector('input[name="email"]').value;
            const btnText = form.querySelector('.btn-text');
            const btnLoading = form.querySelector('.btn-loading');
            const messageDiv = form.querySelector('.newsletter-message');
            
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline';
            
            fetch('<?php echo SITE_URL; ?>/subscribe.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'email=' + encodeURIComponent(email)
            })
            .then(response => response.json())
            .then(data => {
                messageDiv.innerHTML = '<div class="alert alert-' + (data.success ? 'success' : 'danger') + ' py-2">' + data.message + '</div>';
                if (data.success) {
                    form.reset();
                }
            })
            .catch(error => {
                messageDiv.innerHTML = '<div class="alert alert-danger py-2">An error occurred. Please try again.</div>';
            })
            .finally(() => {
                btnText.style.display = 'inline';
                btnLoading.style.display = 'none';
            });
        });
    </script>
</body>
</html>
