import { Outlet } from 'react-router-dom';
import { LayoutDashboard, FilePlus2, ListChecks, User, Bell } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/report', label: 'Report Issue', icon: FilePlus2 },
  { to: '/my-issues', label: 'My Complaints', icon: ListChecks },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/profile', label: 'Profile', icon: User },
];

export default function CitizenLayout() {
  return (
    <div className="flex min-h-screen bg-paper lg:flex-row flex-col">
      <Sidebar items={items} title="Citizen" />
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
