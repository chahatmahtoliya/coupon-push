import { useState } from 'react';
import { useSEO } from '@/hooks/useSEO';

export function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [submitted, setSubmitted] = useState(false);

    useSEO({
        title: 'Contact Us - CouponPush | Get in Touch',
        description: 'Have questions, feedback, or want to partner with CouponPush? Contact us today for support, partnerships, and advertising inquiries.',
        url: 'https://couponpush.com/contact'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In production, this would send to an API
        console.log('Form submitted:', formData);
        setSubmitted(true);
    };

    return (
        <div className="contact-page">
            {/* Hero Section */}
            <section className="contact-hero">
                <div className="container">
                    <h1>Contact Us</h1>
                    <p className="contact-hero-subtitle">
                        Have questions, feedback, or want to partner with us? We'd love to hear from you!
                    </p>
                </div>
            </section>

            {/* Contact Content */}
            <section className="contact-content">
                <div className="container">
                    <div className="row">
                        {/* Contact Form */}
                        <div className="col-lg-8">
                            <div className="contact-form-card">
                                <h2>Send Us a Message</h2>

                                {submitted ? (
                                    <div className="success-message">
                                        <i className="fas fa-check-circle"></i>
                                        <h3>Thank You!</h3>
                                        <p>Your message has been sent successfully. We'll get back to you within 24-48 hours.</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit}>
                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label htmlFor="name">Your Name *</label>
                                                    <input
                                                        type="text"
                                                        id="name"
                                                        name="name"
                                                        value={formData.name}
                                                        onChange={handleChange}
                                                        placeholder="Enter your name"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label htmlFor="email">Email Address *</label>
                                                    <input
                                                        type="email"
                                                        id="email"
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={handleChange}
                                                        placeholder="Enter your email"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="subject">Subject *</label>
                                            <select
                                                id="subject"
                                                name="subject"
                                                value={formData.subject}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="">Select a subject</option>
                                                <option value="general">General Inquiry</option>
                                                <option value="partnership">Brand Partnership</option>
                                                <option value="coupon-issue">Coupon Not Working</option>
                                                <option value="feedback">Feedback & Suggestions</option>
                                                <option value="advertising">Advertising Inquiry</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="message">Your Message *</label>
                                            <textarea
                                                id="message"
                                                name="message"
                                                value={formData.message}
                                                onChange={handleChange}
                                                placeholder="Write your message here..."
                                                rows={6}
                                                required
                                            />
                                        </div>
                                        <button type="submit" className="btn-submit">
                                            Send Message <i className="fas fa-paper-plane"></i>
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>

                        {/* Contact Info Sidebar */}
                        <div className="col-lg-4">
                            <div className="contact-info-card">
                                <h3>Get in Touch</h3>
                                <div className="contact-info-item">
                                    <i className="fas fa-clock"></i>
                                    <div>
                                        <span className="info-label">Response Time</span>
                                        <span>24-48 hours</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default ContactPage;
