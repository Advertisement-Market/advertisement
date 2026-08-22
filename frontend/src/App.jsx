import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '@/context/ToastProvider';
import { AuthModalProvider } from '@/context/AuthModalProvider';
import { AuthProvider } from '@/context/AuthProvider';
import { AppRoutes } from '@/router/AppRoutes';

/**
 * App root: Router → global providers → routes.
 * Providers sit inside the Router so the auth modal can use navigation.
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AuthModalProvider>
            <AppRoutes />
          </AuthModalProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
