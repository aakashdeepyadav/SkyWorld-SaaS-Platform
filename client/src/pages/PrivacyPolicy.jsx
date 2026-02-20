import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-surface-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto card sm:p-12 animate-fade-in">
                <Link to="/" className="text-primary-500 hover:text-primary-600 text-sm font-medium mb-6 inline-flex items-center group">
                    &larr; Back to Home
                </Link>

                <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
                <p className="text-sm text-gray-500 mb-8">Last updated: February 20, 2026</p>

                <div className="prose prose-gray max-w-none space-y-6">
                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
                        <p className="text-gray-600 leading-relaxed">
                            SkyWorld Ventures ("we", "our", or "us") operates the SkyWorld SaaS Platform.
                            This Privacy Policy explains how we collect, use, disclose, and safeguard your
                            information when you visit our platform and use our services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
                        <h3 className="text-lg font-medium text-gray-800 mb-2">Personal Information</h3>
                        <p className="text-gray-600 leading-relaxed mb-3">
                            When you register or use our services, we may collect:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-1">
                            <li>Name and email address</li>
                            <li>Profile picture (if provided or via Google OAuth)</li>
                            <li>Account credentials</li>
                            <li>Project and communication data</li>
                            <li>Payment information (processed securely through third-party providers)</li>
                        </ul>

                        <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Automatically Collected Information</h3>
                        <ul className="list-disc pl-6 text-gray-600 space-y-1">
                            <li>Browser type and version</li>
                            <li>IP address</li>
                            <li>Usage data and access timestamps</li>
                            <li>Cookies and similar tracking technologies</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
                        <p className="text-gray-600 leading-relaxed mb-3">We use the collected information to:</p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-1">
                            <li>Create and manage your account</li>
                            <li>Provide and improve our services (App Development, Web Development, Branding & Creative)</li>
                            <li>Facilitate communication between clients and developers</li>
                            <li>Process payments and transactions</li>
                            <li>Send important updates about your projects</li>
                            <li>Ensure platform security and prevent fraud</li>
                            <li>Comply with legal obligations</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Google OAuth</h2>
                        <p className="text-gray-600 leading-relaxed">
                            If you choose to sign in with Google, we receive your name, email address, and
                            profile picture from Google. We do not access any other Google account data.
                            You can revoke our access at any time through your
                            <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline"> Google Account settings</a>.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Storage & Security</h2>
                        <p className="text-gray-600 leading-relaxed">
                            We implement industry-standard security measures including encrypted connections (HTTPS),
                            secure password hashing (bcrypt), JWT-based authentication with HttpOnly cookies,
                            and role-based access control. Your data is stored on secure cloud infrastructure
                            (MongoDB Atlas) with encryption at rest.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Data Sharing</h2>
                        <p className="text-gray-600 leading-relaxed mb-3">
                            We do not sell your personal information. We may share data with:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-1">
                            <li><strong>Service Providers:</strong> Cloud hosting, file storage (Cloudinary), and payment processors</li>
                            <li><strong>Platform Users:</strong> Developers assigned to your project can see relevant project details</li>
                            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Your Rights</h2>
                        <p className="text-gray-600 leading-relaxed mb-3">You have the right to:</p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-1">
                            <li>Access and review your personal data</li>
                            <li>Request correction of inaccurate data</li>
                            <li>Request deletion of your account and data</li>
                            <li>Withdraw consent for data processing</li>
                            <li>Export your data in a portable format</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Cookies</h2>
                        <p className="text-gray-600 leading-relaxed">
                            We use essential cookies for authentication (JWT refresh tokens stored as HttpOnly cookies).
                            These are necessary for the platform to function and cannot be disabled.
                            We do not use advertising or tracking cookies.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Contact Us</h2>
                        <p className="text-gray-600 leading-relaxed">
                            If you have questions about this Privacy Policy, contact us at{' '}
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

export default PrivacyPolicy;
