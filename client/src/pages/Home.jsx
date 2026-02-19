import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">SW</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">SkyWorld</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium">
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-primary-500 to-primary-700 text-white py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                        Build Your Digital Vision with SkyWorld
                    </h1>
                    <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
                        A professional services platform connecting businesses with expert developers
                        and designers for App Development, Web Development, and Branding & Creative projects.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link
                            to="/register"
                            className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
                        >
                            Start a Project
                        </Link>
                        <a
                            href="#services"
                            className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
                        >
                            Learn More
                        </a>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section id="services" className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Our Services</h2>
                    <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
                        From concept to launch, we deliver end-to-end digital solutions tailored to your needs.
                    </p>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* App Development */}
                        <div className="bg-white rounded-xl shadow-sm p-8 hover:shadow-md transition-shadow border border-gray-100">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-5">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">App Development</h3>
                            <p className="text-gray-600">
                                Custom mobile and desktop applications built with modern frameworks.
                                From iOS and Android apps to cross-platform solutions.
                            </p>
                        </div>

                        {/* Web Development */}
                        <div className="bg-white rounded-xl shadow-sm p-8 hover:shadow-md transition-shadow border border-gray-100">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-5">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Web Development</h3>
                            <p className="text-gray-600">
                                Responsive websites and web applications powered by React, Node.js,
                                and cutting-edge technologies for optimal performance.
                            </p>
                        </div>

                        {/* Branding & Creative */}
                        <div className="bg-white rounded-xl shadow-sm p-8 hover:shadow-md transition-shadow border border-gray-100">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-5">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Branding & Creative</h3>
                            <p className="text-gray-600">
                                Complete brand identity design, logos, marketing materials, and creative
                                assets that make your business stand out.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="bg-white py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">How It Works</h2>
                    <div className="grid sm:grid-cols-3 gap-8 text-center">
                        <div>
                            <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">1</div>
                            <h3 className="font-semibold text-gray-900 mb-2">Submit a Request</h3>
                            <p className="text-gray-600 text-sm">Describe your project requirements and we'll match you with the right team.</p>
                        </div>
                        <div>
                            <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">2</div>
                            <h3 className="font-semibold text-gray-900 mb-2">Track Progress</h3>
                            <p className="text-gray-600 text-sm">Monitor milestones, communicate with developers, and share files through your dashboard.</p>
                        </div>
                        <div>
                            <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">3</div>
                            <h3 className="font-semibold text-gray-900 mb-2">Launch & Grow</h3>
                            <p className="text-gray-600 text-sm">Receive your deliverables, make payments securely, and launch with confidence.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl font-bold mb-4">Ready to Build Something Great?</h2>
                    <p className="text-gray-400 mb-8">
                        Join SkyWorld and bring your digital ideas to life with our expert team.
                    </p>
                    <Link
                        to="/register"
                        className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors inline-block"
                    >
                        Create Your Account
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 border-t border-gray-800 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-primary-700 rounded flex items-center justify-center">
                            <span className="text-white font-bold text-xs">SW</span>
                        </div>
                        <span className="text-gray-400 text-sm">&copy; 2026 SkyWorld Ventures. All rights reserved.</span>
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                        <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
                            Privacy Policy
                        </Link>
                        <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
                            Terms of Service
                        </Link>
                        <a href="mailto:ventures.skyworld@gmail.com" className="text-gray-400 hover:text-white transition-colors">
                            Contact
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
