import { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const { googleLogin } = useAuth();
  const navigate = useNavigate();

  const authIntent = useMemo(() => sessionStorage.getItem('googleAuthIntent') || 'login', []);

  useEffect(() => {
    const clearGoogleAuthState = () => {
      sessionStorage.removeItem('postAuthRedirect');
      sessionStorage.removeItem('googleAuthIntent');
    };

    const redirectToFallback = () => {
      clearGoogleAuthState();
      navigate(authIntent === 'register' ? '/register' : '/login', { replace: true });
    };

    const handleCallback = async () => {
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        redirectToFallback();
        return;
      }

      if (!code) {
        redirectToFallback();
        return;
      }

      try {
        await googleLogin(code);
        const redirectTo = sessionStorage.getItem('postAuthRedirect') || '/dashboard';
        clearGoogleAuthState();
        navigate(redirectTo, { replace: true });
      } catch (err) {
        clearGoogleAuthState();
        navigate(authIntent === 'register' ? '/register' : '/login', { replace: true });
      }
    };

    handleCallback();
  }, [searchParams, googleLogin, navigate, authIntent]);

  return null;
};

export default GoogleCallback;
