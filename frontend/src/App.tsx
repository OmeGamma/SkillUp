import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

// Student Pages
import { StudentDashboard } from './pages/student/Dashboard';
import { StudentProfilePage } from './pages/student/Profile';
import { ResumeAnalyzerPage } from './pages/student/ResumeAnalyzer';
import { SkillMatchingPage } from './pages/student/SkillMatching';
import { JobExplorerPage } from './pages/student/JobExplorer';
import { JobDetailPage } from './pages/student/JobDetail';
import { StudentReportsPage } from './pages/student/Reports';

// Recruiter Pages
import { RecruiterDashboard } from './pages/recruiter/Dashboard';
import { RecruiterJobsPage } from './pages/recruiter/Jobs';
import { JobCreateEditPage } from './pages/recruiter/JobCreateEdit';
import { CandidateRankingPage } from './pages/recruiter/CandidateRanking';
import { CandidateComparisonPage } from './pages/recruiter/CandidateComparison';

// Admin Pages
import { AdminDashboard } from './pages/admin/Dashboard';
import { ModelTrainingCenterPage } from './pages/admin/ModelTrainingCenter';
import { FairnessAuditPage } from './pages/admin/FairnessAudit';
import { RecruiterApprovalsPage } from './pages/admin/RecruiterApprovals';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles
}) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-slate-500">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-600 border-r-transparent mb-2" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If not allowed, redirect to user's appropriate workspace
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'recruiter') return <Navigate to="/recruiter/dashboard" replace />;
    return <Navigate to="/student/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Student Workspace */}
                <Route path="/student/dashboard" element={
                  <ProtectedRoute allowedRoles={['student', 'admin']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/student/profile" element={
                  <ProtectedRoute allowedRoles={['student', 'admin']}>
                    <StudentProfilePage />
                  </ProtectedRoute>
                } />
                <Route path="/student/resume" element={
                  <ProtectedRoute allowedRoles={['student', 'admin']}>
                    <ResumeAnalyzerPage />
                  </ProtectedRoute>
                } />
                <Route path="/student/matching" element={
                  <ProtectedRoute allowedRoles={['student', 'admin']}>
                    <SkillMatchingPage />
                  </ProtectedRoute>
                } />
                <Route path="/student/jobs" element={
                  <ProtectedRoute allowedRoles={['student', 'admin']}>
                    <JobExplorerPage />
                  </ProtectedRoute>
                } />
                <Route path="/student/jobs/:jobId" element={
                  <ProtectedRoute allowedRoles={['student', 'admin']}>
                    <JobDetailPage />
                  </ProtectedRoute>
                } />
                <Route path="/student/reports" element={
                  <ProtectedRoute allowedRoles={['student', 'admin']}>
                    <StudentReportsPage />
                  </ProtectedRoute>
                } />

                {/* Recruiter Workspace */}
                <Route path="/recruiter/dashboard" element={
                  <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
                    <RecruiterDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/recruiter/jobs" element={
                  <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
                    <RecruiterJobsPage />
                  </ProtectedRoute>
                } />
                <Route path="/recruiter/jobs/new" element={
                  <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
                    <JobCreateEditPage />
                  </ProtectedRoute>
                } />
                <Route path="/recruiter/jobs/:jobId/edit" element={
                  <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
                    <JobCreateEditPage />
                  </ProtectedRoute>
                } />
                <Route path="/recruiter/candidates" element={
                  <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
                    <CandidateRankingPage />
                  </ProtectedRoute>
                } />
                <Route path="/recruiter/comparison" element={
                  <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
                    <CandidateComparisonPage />
                  </ProtectedRoute>
                } />

                {/* Admin Workspace */}
                <Route path="/admin/dashboard" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/training" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ModelTrainingCenterPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/fairness" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <FairnessAuditPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/recruiters" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <RecruiterApprovalsPage />
                  </ProtectedRoute>
                } />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
