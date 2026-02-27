import { Link } from 'react-router-dom';

const TermsOfService = () => {
    return (
        <div className="min-h-screen bg-surface-50 dark:bg-surface-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto card dark:bg-surface-800 dark:border-surface-700 sm:p-12 animate-fade-in">
                <Link to="/" className="text-primary-500 hover:text-primary-600 text-sm font-medium mb-6 inline-flex items-center group">
                    &larr; Back to Home
                </Link>

                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Terms of Service</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Last updated: February 20, 2026</p>

                <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">1. Acceptance of Terms</h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            By accessing or using the SkyWorld SaaS Platform operated by SkyWorld Ventures ("we", "our", "us"),
                            you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">2. Description of Services</h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                            SkyWorld provides a platform connecting clients with professional services in:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-1">
                            <li><strong>App Development</strong> — Mobile and desktop application development</li>
                            <li><strong>Web Development</strong> — Website and web application development</li>
                            <li><strong>Branding &amp; Creative</strong> — Brand identity, design, and creative services</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">3. User Accounts</h2>
                        <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                            <li>You must provide accurate and complete information during registration</li>
                            <li>You are responsible for maintaining the security of your account credentials</li>
                            <li>You must notify us immediately of any unauthorized access to your account</li>
                            <li>You must be at least 18 years old to create an account</li>
                            <li>One person or entity may not maintain more than one account</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">4. User Roles &amp; Responsibilities</h2>

                        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">Clients</h3>
                        <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-1 mb-4">
                            <li>Provide clear and accurate project requirements</li>
                            <li>Respond to communications in a timely manner</li>
                            <li>Make payments as agreed upon for services rendered</li>
                        </ul>

                        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">Developers</h3>
                        <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-1">
                            <li>Deliver work that meets the agreed-upon specifications</li>
                            <li>Maintain professional communication with clients</li>
                            <li>Respect project deadlines and milestones</li>
                            <li>Keep client information confidential</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">5. Intellectual Property</h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            Upon full payment, clients receive ownership rights to the deliverables created
                            specifically for their project. SkyWorld retains ownership of the platform, its
                            underlying technology, tools, and any pre-existing intellectual property.
                            Developers retain the right to use general knowledge and non-proprietary techniques
                            gained during projects.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">6. Payments &amp; Refunds</h2>
                        <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                            <li>All payments are processed through secure third-party payment providers</li>
                            <li>Pricing is determined on a per-project basis and agreed upon before work begins</li>
                            <li>Refund requests are evaluated on a case-by-case basis</li>
                            <li>We reserve the right to suspend services for overdue payments</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">7. Prohibited Activities</h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">You agree not to:</p>
                        <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-1">
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
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">8. File Uploads</h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            Files uploaded to the platform are stored securely via Cloudinary. You are responsible
                            for ensuring you have the rights to upload any content. We reserve the right to remove
                            content that violates these terms. Maximum file sizes and supported formats are
                            enforced by the platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">9. Limitation of Liability</h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            SkyWorld Ventures is provided "as is" without warranties of any kind. We shall not be
                            liable for any indirect, incidental, special, or consequential damages arising from
                            your use of the platform. Our total liability shall not exceed the amount you have
                            paid us in the 12 months preceding the claim.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">10. Termination</h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            We may suspend or terminate your account at any time for violation of these terms
                            or for any reason with reasonable notice. You may delete your account at any time.
                            Upon termination, your right to use the platform ceases immediately, though we may
                            retain certain data as required by law.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">11. Changes to Terms</h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            We reserve the right to modify these terms at any time. Material changes will be
                            communicated via email or platform notification. Continued use of the platform after
                            changes constitutes acceptance of the updated terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">12. Contact Us</h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            For questions about these Terms of Service, contact us at{' '}
                            <a href="mailto:ventures.skyworld@gmail.com" className="text-primary-500 hover:underline">
                                ventures.skyworld@gmail.com
                            </a>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
