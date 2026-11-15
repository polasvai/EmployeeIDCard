import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import VerificationPage from './pages/VerificationPage';
import DashboardPage from './pages/DashboardPage';
import DesignerPage from './pages/DesignerPage';
import RecordsPage from './pages/RecordsPage';
import DataEntryPage from './pages/DataEntryPage';
import SuperAdminPage from './pages/SuperAdminPage';

function ProtectedLayout() {
  const { currentUser, isSuperAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-xs text-slate-400">Loading ID Card Studio...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/entry" element={<DataEntryPage />} />
            <Route path="/designer" element={<DesignerPage />} />
            <Route path="/records" element={<RecordsPage />} />
            <Route
              path="/admin"
              element={isSuperAdmin ? <SuperAdminPage /> : <Navigate to="/dashboard" replace />}
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/verify" element={<VerificationPage />} />
          <Route path="/verify/:id" element={<VerificationPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
