import { Outlet } from 'react-router-dom';
import { LayoutDashboard, ListChecks, Users, Building2, Tags, BarChart3, Map } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const items = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/issues', label: 'Manage Issues', icon: ListChecks },
  { to: '/admin/users', label: 'Manage Users', icon: Users },
  { to: '/admin/departments', label: 'Departments', icon: Building2 },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/map', label: 'Issue Map', icon: Map },
];

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-paper lg:flex-row flex-col">
      <Sidebar items={items} title="Admin" />
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
