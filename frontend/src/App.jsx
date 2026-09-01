import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';
import AnalyticsPage from './pages/AnalyticsPage';
import BookingDetailPage from './pages/BookingDetailPage';
import BookingsPage from './pages/BookingsPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import CustomersPage from './pages/CustomersPage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import MechanicDetailPage from './pages/MechanicDetailPage';
import MechanicsPage from './pages/MechanicsPage';
import { Spinner } from './components/ui';
function Protected() { const { user, loading } = useAuth(); if (loading) return <div className="grid min-h-screen place-items-center"><Spinner className="h-8 w-8" /></div>; return user ? <AppLayout /> : <Navigate to="/login" replace />; }
function LoginRoute() { const { user, loading } = useAuth(); if (loading) return null; return user ? <Navigate to="/dashboard" replace /> : <LoginPage />; }
export default function App() { return <Routes><Route path="/login" element={<LoginRoute />} /><Route element={<Protected />}><Route path="/dashboard" element={<DashboardPage />} /><Route path="/bookings" element={<BookingsPage />} /><Route path="/bookings/:id" element={<BookingDetailPage />} /><Route path="/mechanics" element={<MechanicsPage />} /><Route path="/mechanics/:id" element={<MechanicDetailPage />} /><Route path="/customers" element={<CustomersPage />} /><Route path="/customers/:id" element={<CustomerDetailPage />} /><Route path="/analytics" element={<AnalyticsPage />} /></Route><Route path="*" element={<Navigate to="/dashboard" replace />} /></Routes>; }
