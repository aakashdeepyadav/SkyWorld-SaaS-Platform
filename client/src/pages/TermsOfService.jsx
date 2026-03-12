import { Link } from 'react-router-dom';

const TermsOfService = () => {
    return (
        <div className="min-h-screen bg-surface-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto card sm:p-12 animate-fade-in">
                <Link to="/" className="text-primary-500 hover:text-primary-600 text-sm font-medium mb-6 inline-flex items-center group">
                    &larr; Back to Home
                </Link>

                <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
                <p className="text-sm text-gray-500 mb-8">Last updated: March 7, 2026</p>

                <div className="prose prose-gray max-w-none space-y-6">
                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
                        <p className="text-gray-600 leading-relaxed">
                            By accessing or using the SkyWorld platform operated by SkyWorld Ventures ("we", "our", "us"),
                            you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Description of Services</h2>
                        <p className="text-gray-600 leading-relaxed mb-3">
                            SkyWorld provides a digital services platform connecting clients with professional services in:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-1">
                            <li><strong>Web Development</strong> — Launch Pages, Starter Websites, and Growth Websites for businesses of all sizes</li>
                            <li><strong>App Development</strong> — Progressive Web Apps (PWA) and full-stack applications with dashboards</li>
                            <li><strong>Branding &amp; Design</strong> — Logo design, brand identity kits, business collateral, and social media assets</li>
                            <li><strong>Combo Packages</strong> — Bundled service packages (e.g., Restaurant Starter, Medical Growth, Premium Business) at discounted rates</li>
                            <li><strong>Monthly Maintenance Plans</strong> — Recurring plans for website updates, monitoring, SEO, and ongoing support (Care Plan Lite, Growth Plan, Local Growth Plus)</li>
                            <li><strong>Add-On Services</strong> — Optional extras such as Google Business Profile setup, local SEO, chatbot integration, WhatsApp API setup, and more</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">3. User Accounts</h2>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2">
                            <li>You must provide accurate and complete information during registration</li>
                            <li>You are responsible for maintaining the security of your account credentials</li>
                            <li>You must notify us immediately of any unauthorized access to your account</li>
                            <li>You must be at least 18 years old to create an account</li>
                            <li>One person or entity may not maintain more than one account</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">4. User Roles &amp; Responsibilities</h2>

                        <h3 className="text-lg font-medium text-gray-800 mb-2">Clients</h3>
                        <ul className="list-disc pl-6 text-gray-600 space-y-1 mb-4">
                            <li>Provide clear and accurate project requirements</li>
                            <li>Respond to communications in a timely manner</li>
                            <li>Make payments as agreed upon for services rendered</li>
                            <li>Review deliverables and approve project completion</li>
                        </ul>

                        <h3 className="text-lg font-medium text-gray-800 mb-2">Developers</h3>
                        <ul className="list-disc pl-6 text-gray-600 space-y-1">
                            <li>Deliver work that meets the agreed-upon specifications</li>
                            <li>Maintain professional communication with clients</li>
                            <li>Respect project deadlines and milestones</li>
                            <li>Keep client information confidential</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Intellectual Property</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Upon full payment, clients receive ownership rights to the deliverables created
                            specifically for their project — including source code, design files, and brand assets.
                            SkyWorld retains ownership of the platform, its underlying technology, tools, and any
                            pre-existing intellectual property. Developers retain the right to use general knowledge
                            and non-proprietary techniques gained during projects.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Pricing &amp; Payment Terms</h2>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2">
                            <li><strong>Fixed-Price Plans:</strong> Prices are displayed on the platform. Payment follows a 50/50 model — 50% advance to start the project, and the remaining 50% upon delivery and client approval</li>
                            <li><strong>Combo Packages:</strong> Bundled at discounted rates (12–18% off). Payment follows the same 50/50 model</li>
                            <li><strong>Monthly Plans:</strong> Billed monthly starting from the subscription date. You can pause or cancel with 7 days notice. No long-term contracts</li>
                            <li><strong>Add-On Services:</strong> Charged upfront in full at the time of purchase</li>
                            <li><strong>Custom Requests:</strong> Pricing is quoted based on scope after review. Payment terms are agreed upon before work begins</li>
                            <li>All payments are processed securely through Razorpay</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Refunds</h2>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2">
                            <li>Refund requests are evaluated on a case-by-case basis</li>
                            <li>Advance payments may be partially refundable if significant work has not yet been started</li>
                            <li>Monthly plan payments for the current billing cycle are non-refundable</li>
                            <li>We reserve the right to suspend services for overdue payments</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Revisions &amp; Delivery</h2>
                        <p className="text-gray-600 leading-relaxed">
                            All fixed-price plans include unlimited revisions until you are satisfied. Delivery
                            timelines are estimates and may vary based on project complexity, feedback turnaround,
                            and scope changes. We commit to regular progress updates throughout the project lifecycle.
                            Source code and all deliverables are handed over upon project completion and full payment.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Prohibited Activities</h2>
                        <p className="text-gray-600 leading-relaxed mb-3">You agree not to:</p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-1">
                            <li>Use the platform for any unlawful purpose</li>
                            <li>Attempt to gain unauthorized access to other accounts or systems</li>
                            <li>Upload malicious code, viruses, or harmful content</li>
                            <li>Harass, abuse, or harm other users</li>
                            <li>Circumvent security measures or rate limits</li>
                            <li>Scrape, crawl, or use automated tools without permission</li>
                            <li>Impersonate another person or entity</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Limitation of Liability</h2>
                        <p className="text-gray-600 leading-relaxed">
                            SkyWorld Ventures is provided "as is" without warranties of any kind. We shall not be
                            liable for any indirect, incidental, special, or consequential damages arising from
                            your use of the platform. Our total liability shall not exceed the amount you have
                            paid us in the 12 months preceding the claim.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Termination</h2>
                        <p className="text-gray-600 leading-relaxed">
                            We may suspend or terminate your account at any time for violation of these terms
                            or for any reason with reasonable notice. You may delete your account at any time.
                            Upon termination, your right to use the platform ceases immediately, though we may
                            retain certain data as required by law. Active monthly subscriptions will be cancelled
                            upon account termination.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Changes to Terms</h2>
                        <p className="text-gray-600 leading-relaxed">
                            We reserve the right to modify these terms at any time. Material changes will be
                            communicated via email or platform notification. Continued use of the platform after
                            changes constitutes acceptance of the updated terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Contact Us</h2>
                        <p className="text-gray-600 leading-relaxed">
                            For questions about these Terms of Service, contact us at{' '}
                            <a href="mailto:support@skyworld.buzz" className="text-primary-500 hover:underline">
                                support@skyworld.buzz
                            </a>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
