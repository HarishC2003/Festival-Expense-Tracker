import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GroupProvider, useGroup } from './context/GroupContext';
import { FestivalYearProvider } from './context/FestivalYearContext';
import { MainLayout } from './layouts/MainLayout';
import { LoadingProvider } from './components/loading/LoadingProvider';
import { Toaster } from 'sonner';
import { GlobalErrorBoundary } from './components/states/GlobalErrorBoundary';
import { NetworkStateListener } from './components/states/NetworkStateListener';
import { SessionExpiredModal } from './components/states/SessionExpiredModal';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { VerifyOTPPage } from './pages/auth/VerifyOTPPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { LandingPage } from './pages/LandingPage';
import { YearsPage } from './pages/festivals/YearsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { UsersPage } from './pages/users/UsersPage';
import { CashDonationsPage } from './pages/income/CashDonationsPage';
import { ItemDonationsPage } from './pages/income/ItemDonationsPage';
import { DonorProfilePage } from './pages/income/DonorProfilePage';
import { ExpensesListPage } from './pages/expenses/ExpensesListPage';
import { ExpenseSubmissionPage } from './pages/expenses/ExpenseSubmissionPage';
import { ApprovalQueuePage } from './pages/expenses/ApprovalQueuePage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { TransactionsPage } from './pages/dashboard/TransactionsPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { GalleryPage } from './pages/media/GalleryPage';
import { DocumentsPage } from './pages/media/DocumentsPage';
import { GroupsPage } from './pages/groups/GroupsPage';
import { GroupMembersPage } from './pages/groups/GroupMembersPage';
import { SecurityPage } from './pages/SecurityPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { AboutPage } from './pages/AboutPage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { activeGroupId, loadingGroups } = useGroup();
  const location = useLocation();
  
  if (loading || loadingGroups) return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  // Need to bypass group check for /groups, /settings, /users
  const currentPath = location.pathname;
  const isGroupExempt = currentPath === '/groups' || currentPath === '/settings' || currentPath === '/users';

  if (!activeGroupId && !isGroupExempt) {
    return <Navigate to="/groups" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <GlobalErrorBoundary>
      <BrowserRouter>
        <NetworkStateListener />
        <SessionExpiredModal />
        <LoadingProvider>
          <AuthProvider>
            <GroupProvider>
              <FestivalYearProvider>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/verify-otp" element={<VerifyOTPPage />} />
                  <Route path="/security" element={<SecurityPage />} />
                  <Route path="/privacy" element={<PrivacyPolicyPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/groups" element={<ProtectedRoute><GroupsPage /></ProtectedRoute>} />
                  
                  <Route element={<MainLayout />}>
                    <Route path="/admin" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
                    <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                    <Route path="/transactions" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
                    
                    {/* Reports & Media */}
                    <Route path="reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
                    <Route path="gallery" element={<ProtectedRoute><GalleryPage /></ProtectedRoute>} />
                    <Route path="documents" element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />

                    {/* Settings & Years */}
                    <Route path="years" element={<YearsPage />} />
                    <Route path="users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
                    <Route path="settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                    
                    {/* Management Routes */}
                    <Route path="members" element={<ProtectedRoute><GroupMembersPage /></ProtectedRoute>} />

                    {/* Income Routes */}
                    <Route path="income/cash" element={<ProtectedRoute><CashDonationsPage /></ProtectedRoute>} />
                    <Route path="income/items" element={<ProtectedRoute><ItemDonationsPage /></ProtectedRoute>} />
                    <Route path="donors/:id" element={<ProtectedRoute><DonorProfilePage /></ProtectedRoute>} />

                    {/* Expense Routes */}
                    <Route path="expenses" element={<ProtectedRoute><ExpensesListPage /></ProtectedRoute>} />
                    <Route path="expenses/new" element={<ProtectedRoute><ExpenseSubmissionPage /></ProtectedRoute>} />
                    <Route path="expenses/edit/:id" element={<ProtectedRoute><ExpenseSubmissionPage /></ProtectedRoute>} />
                    <Route path="expenses/approvals" element={<ProtectedRoute><ApprovalQueuePage /></ProtectedRoute>} />
                  </Route>
                </Routes>
              </FestivalYearProvider>
            </GroupProvider>
          </AuthProvider>
        </LoadingProvider>
        <Toaster 
          position="top-right" 
          duration={4000}
          toastOptions={{
            classNames: {
              toast: 'bg-[#1E293B] border border-white/10 text-[#F1F5F9] rounded-lg shadow-lg',
              success: 'border-l-4 border-l-green-400',
              error: 'border-l-4 border-l-red-500',
              warning: 'border-l-4 border-l-amber-500',
              info: 'border-l-4 border-l-blue-500',
            }
          }}
        />
      </BrowserRouter>
    </GlobalErrorBoundary>
  );
}

export default App;
