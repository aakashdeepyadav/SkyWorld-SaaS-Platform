import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

const Home = () => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-surface-50">
            {/* Navigation */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-xl shadow-sm' : 'bg-transparent'
                }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-2">
                            <img src="/logo.png" alt="SkyWorld" className="w-8 h-8 object-contain" />
                            <span className={`text-xl font-bold transition-colors ${scrolled ? 'text-gray-900' : 'text-white'}`}>
                                SkyWorld
                            </span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Link to="/login" className={`font-medium px-4 py-2 rounded-lg transition-all ${scrolled ? 'text-gray-600 hover:text-gray-900' : 'text-white/80 hover:text-white'
                                }`}>
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="btn-primary !py-2 !px-5 !text-sm"
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-hero-pattern">
                {/* Floating elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/4 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-float" />
                    <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
                    <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-primary-300/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
                    {/* Grid pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
                </div>

                <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
                    <div className="animate-fade-in">
                        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-sm text-white/90 font-medium mb-8">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse" />
                            Trusted by 150+ businesses worldwide
                        </div>

                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 text-balance">
                            Build Your Digital
                            <br />
                            <span className="bg-gradient-to-r from-primary-200 to-accent-300 bg-clip-text text-transparent">
                                Vision With Us
                            </span>
                        </h1>

                        <p className="text-lg sm:text-xl text-white/70 mb-10 max-w-2xl mx-auto">
                            A professional services platform connecting businesses with expert developers
                            and designers. From concept to launch, we deliver excellence.
                        </p>

                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link
                                to="/register"
                                className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 rounded-2xl font-semibold text-lg hover:bg-primary-50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
                            >
                                Start a Project
                                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>
                            <a
                                href="#services"
                                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 text-white rounded-2xl font-semibold text-lg hover:bg-white/10 transition-all duration-300"
                            >
                                Learn More
                            </a>
                        </div>
                    </div>

                    {/* Stats bar */}
                    <div className="mt-20 grid grid-cols-3 gap-6 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.3s' }}>
                        {[
                            { value: '500+', label: 'Projects Delivered' },
                            { value: '99%', label: 'Client Satisfaction' },
                            { value: '24/7', label: 'Support Available' },
                        ].map((stat) => (
                            <div key={stat.label} className="p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl">
                                <p className="text-3xl sm:text-4xl font-bold text-white">{stat.value}</p>
                                <p className="text-sm text-white/50 mt-1">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section id="services" className="py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <p className="text-primary-600 font-semibold text-sm uppercase tracking-wider mb-3">What We Do</p>
                        <h2 className="section-title mb-4">Our Services</h2>
                        <p className="section-subtitle">
                            End-to-end digital solutions tailored to your business needs.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                title: 'App Development',
                                desc: 'Custom mobile and desktop applications built with modern frameworks. iOS, Android, and cross-platform solutions.',
                                icon: (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                ),
                                gradient: 'from-blue-500 to-cyan-500',
                                bg: 'bg-blue-50',
                            },
                            {
                                title: 'Web Development',
                                desc: 'Responsive websites and web applications powered by React, Node.js, and cutting-edge technologies.',
                                icon: (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                    </svg>
                                ),
                                gradient: 'from-emerald-500 to-teal-500',
                                bg: 'bg-emerald-50',
                            },
                            {
                                title: 'Branding & Creative',
                                desc: 'Complete brand identity, logos, marketing materials, and creative assets that make your business stand out.',
                                icon: (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                    </svg>
                                ),
                                gradient: 'from-purple-500 to-pink-500',
                                bg: 'bg-purple-50',
                            },
                        ].map((service, i) => (
                            <div
                                key={service.title}
                                className="group card-hover p-8 animate-slide-up"
                                style={{ animationDelay: `${i * 0.1}s` }}
                            >
                                <div className={`w-14 h-14 ${service.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    <div className={`bg-gradient-to-br ${service.gradient} bg-clip-text text-transparent`}>
                                        {service.icon}
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{service.title}</h3>
                                <p className="text-gray-500 leading-relaxed">{service.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <p className="text-primary-600 font-semibold text-sm uppercase tracking-wider mb-3">Process</p>
                        <h2 className="section-title mb-4">How It Works</h2>
                        <p className="section-subtitle">Three simple steps to bring your project to life.</p>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-8 relative">
                        {/* Connecting line */}
                        <div className="hidden sm:block absolute top-16 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200" />

                        {[
                            { step: '1', title: 'Submit a Request', desc: 'Describe your project requirements and we\'ll match you with the right team.' },
                            { step: '2', title: 'Track Progress', desc: 'Monitor milestones, communicate with developers, and share files.' },
                            { step: '3', title: 'Launch & Grow', desc: 'Receive deliverables, make payments securely, and launch with confidence.' },
                        ].map((item, i) => (
                            <div key={item.step} className="text-center relative animate-slide-up" style={{ animationDelay: `${i * 0.15}s` }}>
                                <div className="relative z-10 w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center font-bold text-white text-lg mx-auto mb-6 shadow-glow">
                                    {item.step}
                                </div>
                                <h3 className="font-bold text-gray-900 text-lg mb-2">{item.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
                <div className="absolute inset-0 bg-hero-pattern" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />

                <div className="relative z-10 max-w-3xl mx-auto text-center">
                    <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                        Ready to Build Something
                        <br />
                        <span className="text-primary-200">Great?</span>
                    </h2>
                    <p className="text-white/60 text-lg mb-10 max-w-xl mx-auto">
                        Join SkyWorld today and bring your digital ideas to life with our expert team.
                    </p>
                    <Link
                        to="/register"
                        className="inline-flex items-center justify-center px-10 py-4 bg-white text-primary-600 rounded-2xl font-bold text-lg hover:bg-primary-50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
                    >
                        Create Your Account
                        <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-surface-900 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center space-x-3">
                            <img src="/logo.png" alt="SkyWorld" className="w-7 h-7 object-contain" />
                            <span className="text-gray-400 text-sm">&copy; 2026 SkyWorld Ventures. All rights reserved.</span>
                        </div>
                        <div className="flex items-center space-x-8 text-sm">
                            <Link to="/privacy" className="text-gray-500 hover:text-white transition-colors">Privacy</Link>
                            <Link to="/terms" className="text-gray-500 hover:text-white transition-colors">Terms</Link>
                            <a href="mailto:ventures.skyworld@gmail.com" className="text-gray-500 hover:text-white transition-colors">Contact</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
