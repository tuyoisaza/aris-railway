import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { GlobalProvider } from '@/context/GlobalContext';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  console.log("ProtectedRoute: State check", { user: !!user, loading });

  if (loading) {
    // Minimal loader for now
    return <div className="min-h-screen flex items-center justify-center">Loading Upgrade OS...</div>;
  }

  if (!user) {
    console.warn("ProtectedRoute: No user, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading Upgrade OS...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = !!user.email && ['thetboard@gmail.com', 'dev@upgrade.local'].includes(user.email.toLowerCase());
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

import AdminLayout from '@/layouts/AdminLayout';
import Navbar from '@/components/Navbar';
import Pensum from '@/pages/Pensum';
import AdminCourses from '@/pages/AdminCourses';
import AdminLogs from '@/pages/AdminLogs';
import AdminAgents from '@/pages/AdminAgents';
import AdminMentors from '@/pages/AdminMentors';
import AdminUsers from '@/pages/AdminUsers';
import AdminQuestions from '@/pages/AdminQuestions';
import AdminContent from '@/pages/AdminContent';
import AdminSettings from '@/pages/AdminSettings';
import Admin from '@/pages/Admin';
import Journal from '@/pages/Journal';
import Test from '@/pages/Test';
import Profile from '@/pages/Profile';
import Course from '@/pages/Course';
import CoursePlayer from '@/pages/CoursePlayer';
import ChatOverlay from '@/components/Chat/ChatOverlay';
import { Pricing } from '@/pages/Pricing';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <footer className="py-8 text-center text-sm font-mono text-slate-500 border-t border-slate-200">
        SYSTEM STATUS: ONLINE | UPGRADE OS v5.0
      </footer>
      {/* Global Components */}
      <ChatOverlay />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <GlobalProvider>
        <AuthProvider>
          <LanguageProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/pensum" element={<Pensum />} />

                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/journal" element={
                  <ProtectedRoute>
                    <Journal />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/test/:axisId" element={
                  <ProtectedRoute>
                    <Test />
                  </ProtectedRoute>
                } />

                <Route path="/course/:id" element={
                  <ProtectedRoute>
                    <Course />
                  </ProtectedRoute>
                } />

                <Route path="/course/:id/learn/:stepIndex" element={
                  <ProtectedRoute>
                    <CoursePlayer />
                  </ProtectedRoute>
                } />

                {/* Admin Routes */}
                <Route path="/admin" element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }>
                  <Route index element={<div className="p-4 text-[var(--color-text-secondary)]">Select an option from the sidebar. (Overview Dashboard coming soon)</div>} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="logs" element={<AdminLogs />} />

                  {/* Legacy Routes - Nested under AdminLayout? Or separate? */}
                  {/* The Sidebar links to /admin/courses etc. */}
                  {/* If I nest them here, they render inside AdminLayout Outlet. This is cleaner. */}
                  <Route path="courses" element={<AdminCourses />} />
                  <Route path="agents" element={<AdminAgents />} />
                  <Route path="mentors" element={<AdminMentors />} />
                  <Route path="questions" element={<AdminQuestions />} />
                  <Route path="content" element={<AdminContent />} />
                </Route>

                {/* Public Routes */}
                <Route path="/pricing" element={<Pricing />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </LanguageProvider>
        </AuthProvider>
      </GlobalProvider>
    </Router>
  );
}
