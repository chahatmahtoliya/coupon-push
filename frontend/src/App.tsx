import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header, Footer, CategoryBar } from '@/components/layout';
import { ScrollToTop } from '@/components/common';
import {
    HomePage,
    StorePage,
    AllStoresPage,
    CategoryPage,
    CategoriesPage,
    CouponPage,
    SearchPage,
    ContactPage,
    AboutPage,
    TermsPage,
    PrivacyPage,
    SeasonalPage,
    NotFoundPage,
} from '@/pages';
import '@/styles/style.css';
import '@/styles/store-hero.css';

function App() {
    return (
        <Router>
            <ScrollToTop />
            <div className="app">
                <Header />
                <CategoryBar />

                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/store/:slug" element={<StorePage />} />
                        <Route path="/stores" element={<AllStoresPage />} />
                        <Route path="/categories" element={<CategoriesPage />} />
                        <Route path="/category/:slug" element={<CategoryPage />} />
                        <Route path="/coupon/:id" element={<CouponPage />} />
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="/contact" element={<ContactPage />} />
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/terms" element={<TermsPage />} />
                        <Route path="/privacy-policy" element={<PrivacyPage />} />
                        <Route path="/offers/:slug" element={<SeasonalPage />} />
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </main>

                <Footer />
            </div>
        </Router>
    );
}

export default App;
