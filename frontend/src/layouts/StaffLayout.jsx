import { Outlet } from 'react-router-dom';
import { LayoutDashboard, ClipboardList } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const items = [
  { to: '/staff', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/staff/tasks', label: 'Assigned Tasks', icon: ClipboardList },
];

export default function StaffLayout() {
  return (
    <div className="flex min-h-screen bg-paper lg:flex-row flex-col">
      <Sidebar items={items} title="Staff" />
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
