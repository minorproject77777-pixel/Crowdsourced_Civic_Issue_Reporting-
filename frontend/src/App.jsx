import { Routes, Route } from 'react-router-dom';

import PublicLayout from './layouts/PublicLayout';
import CitizenLayout from './layouts/CitizenLayout';
import AdminLayout from './layouts/AdminLayout';
import StaffLayout from './layouts/StaffLayout';
import ProtectedRoute from './components/ProtectedRoute';

import Landing from './pages/public/Landing';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import PublicIssues from './pages/public/PublicIssues';
import IssueDetails from './pages/public/IssueDetails';

import CitizenDashboard from './pages/citizen/CitizenDashboard';
import ReportIssue from './pages/citizen/ReportIssue';
import MyIssues from './pages/citizen/MyIssues';
import Profile from './pages/citizen/Profile';
import Notifications from './pages/citizen/Notifications';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminIssues from './pages/admin/AdminIssues';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDepartments from './pages/admin/AdminDepartments';
import AdminCategories from './pages/admin/AdminCategories';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminMap from './pages/admin/AdminMap';

import StaffDashboard from './pages/staff/StaffDashboard';
import StaffTasks from './pages/staff/StaffTasks';
import StaffTaskDetails from './pages/staff/StaffTaskDetails';

import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      {/* Public + citizen-facing pages share the top navbar */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/issues" element={<PublicIssues />} />
        <Route path="/issues/:id" element={<IssueDetails />} />
      </Route>

      {/* Citizen dashboard area */}
      <Route
        element={
          <ProtectedRoute roles={['citizen']}>
            <CitizenLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<CitizenDashboard />} />
        <Route path="/report" element={<ReportIssue />} />
        <Route path="/my-issues" element={<MyIssues />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />
      </Route>

      {/* Admin area */}
      <Route
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/issues" element={<AdminIssues />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/departments" element={<AdminDepartments />} />
        <Route path="/admin/categories" element={<AdminCategories />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/admin/map" element={<AdminMap />} />
      </Route>

      {/* Staff area */}
      <Route
        element={
          <ProtectedRoute roles={['staff']}>
            <StaffLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/staff" element={<StaffDashboard />} />
        <Route path="/staff/tasks" element={<StaffTasks />} />
        <Route path="/staff/tasks/:id" element={<StaffTaskDetails />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
