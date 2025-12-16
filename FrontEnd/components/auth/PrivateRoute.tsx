import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';

interface PrivateRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requiredRole?: string;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ 
  children, 
  redirectTo = '/login',
  requiredRole,
}) => {
  const router = useRouter();
  const { isAuthenticated, loading, user } = useAuth();

  useEffect(() => {
    console.log('PrivateRoute: isAuthenticated=', isAuthenticated, 'loading=', loading, 'user=', user, 'requiredRole=', requiredRole);
    
    if (!loading && !isAuthenticated) {
      console.log('PrivateRoute: redirecting to', redirectTo, '(not authenticated)');
      router.replace({
        pathname: redirectTo,
        // usar asPath para preservar params e query reais (ex: /payment/123)
        query: { redirect: router.asPath }
      });
    }

    if (!loading && isAuthenticated && requiredRole && user?.role !== requiredRole) {
      // Redirecionar se o role não corresponde
      console.log('PrivateRoute: redirecting to / (role mismatch: user.role=', user?.role, 'required=', requiredRole, ')');
      router.replace('/');
    }
  }, [isAuthenticated, loading, router, redirectTo, requiredRole, user]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
};

export default PrivateRoute;
