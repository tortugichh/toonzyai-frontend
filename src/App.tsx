import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import BackendStatus from '@/components/common/BackendStatus';

// Pages
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import AvatarsPage from '@/pages/AvatarsPage';
import AnimationPage from '@/pages/AnimationPage';
import AnimationDetailPage from '@/pages/AnimationDetailPage';
import AnimationStudioPage from '@/pages/AnimationStudioPage';
import StoryGeneratorPage from '@/pages/StoryGeneratorPage';
import StoryDetailPage from '@/pages/StoryDetailPage';
import ProjectPage from '@/pages/ProjectPage';

// Hooks
import { useCurrentUser } from '@/hooks/useAuth';

// Constants
const QUERY_CACHE_TIME = 1000 * 60 * 5; // 5 minutes
const QUERY_STALE_TIME = 1000 * 60 * 2; // 2 minutes

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_TIME,
      gcTime: QUERY_CACHE_TIME, // In newer versions of React Query, gcTime is used instead of cacheTime
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const { data: user, isLoading } = useCurrentUser();
  const isAuthenticated = !!user;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <BackendStatus />
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected routes */}
              <Route
                path="/dashboard"
                element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/avatars"
                element={isAuthenticated ? <AvatarsPage /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/animations"
                element={isAuthenticated ? <AnimationPage /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/animation/:projectId"
                element={isAuthenticated ? <AnimationDetailPage /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/studio"
                element={isAuthenticated ? <AnimationStudioPage /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/project/:projectId"
                element={isAuthenticated ? <ProjectPage /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/story-generator"
                element={isAuthenticated ? <StoryGeneratorPage /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/story/:storyId"
                element={isAuthenticated ? <StoryDetailPage /> : <Navigate to="/login" replace />}
              />

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </ErrorBoundary>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
