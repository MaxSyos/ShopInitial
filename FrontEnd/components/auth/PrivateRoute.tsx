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
    if (!loading && !isAuthenticated) {
      router.replace({
        pathname: redirectTo,
        query: { redirect: router.pathname }
      });
    }

    if (!loading && isAuthenticated && requiredRole && user?.role !== requiredRole) {
      // Redirecionar se o role não corresponde
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
