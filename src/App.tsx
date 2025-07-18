import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { QUERY_STALE_TIME, QUERY_CACHE_TIME, IS_DEVELOPMENT } from '@/constants';
import { createSecureOnError } from '@/utils/globalErrorHandler';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useCurrentUser, simpleLogout } from '@/hooks/useAuth';
import { ErrorBoundary } from '@/components/common';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import AvatarsPage from '@/pages/AvatarsPage';
import AnimationPage from '@/pages/AnimationPage';
import AnimationDetailPage from '@/pages/AnimationDetailPage';
import AnimationStudioPage from '@/pages/AnimationStudioPage';
import ProjectPage from '@/pages/ProjectPage';
import { StoryGeneratorPage } from '@/pages/StoryGeneratorPage';
import StoryDetailPage from '@/pages/StoryDetailPage';

// Emergency logout function available in console
if (typeof window !== 'undefined') {
  (window as any).emergencyLogout = simpleLogout;
}

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: QUERY_STALE_TIME,
      gcTime: QUERY_CACHE_TIME, // In newer versions of React Query, gcTime is used instead of cacheTime
    },
    mutations: {
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { data: user } = useCurrentUser();

  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <HomePage />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/avatars"
          element={
            <ProtectedRoute>
              <AvatarsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/animations"
          element={<Navigate to="/studio" replace />}
        />
        <Route
          path="/animations/:id"
          element={<Navigate to="/studio/:id" replace />}
        />
        <Route
          path="/studio"
          element={
            <ProtectedRoute>
              <AnimationStudioPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/studio/:projectId"
          element={
            <ProtectedRoute>
              <ProjectPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/story-generator"
          element={
            <ProtectedRoute>
              <StoryGeneratorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stories"
          element={
            <ProtectedRoute>
              <StoryGeneratorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stories/:id"
          element={
            <ProtectedRoute>
              <StoryDetailPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ duration: 5000 }} />
        {IS_DEVELOPMENT && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
