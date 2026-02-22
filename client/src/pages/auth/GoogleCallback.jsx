import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const GoogleCallback = () => {
    const [searchParams] = useSearchParams();
    const { googleLogin } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get('code');
            const errorParam = searchParams.get('error');

            if (errorParam) {
                setError('Google authentication was cancelled.');
                setTimeout(() => navigate('/login'), 2000);
                return;
            }

            if (!code) {
                setError('No authorization code received.');
                setTimeout(() => navigate('/login'), 2000);
                return;
            }

            try {
                await googleLogin(code);
                const redirectTo = sessionStorage.getItem('postAuthRedirect') || '/dashboard';
                sessionStorage.removeItem('postAuthRedirect');
                navigate(redirectTo, { replace: true });
            } catch (err) {
                sessionStorage.removeItem('postAuthRedirect');
                setError('Google authentication failed. Please try again.');
                setTimeout(() => navigate('/login'), 3000);
            }
        };

        handleCallback();
    }, [searchParams, googleLogin, navigate]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
                <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md">
                    <div className="text-red-500 text-5xl mb-4">✕</div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Failed</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <p className="text-sm text-gray-400">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
            <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Signing you in...</h2>
                <p className="text-gray-600">Completing Google authentication</p>
            </div>
        </div>
    );
};

export default GoogleCallback;
