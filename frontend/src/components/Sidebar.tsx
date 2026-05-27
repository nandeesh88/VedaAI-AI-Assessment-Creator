'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, FileText, Sparkles, BookOpen, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

const menuItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Users, label: 'My Groups', path: '/groups' },
  { icon: FileText, label: 'Assignments', path: '/assignments', badge: '3' },
  { icon: Sparkles, label: "AI Teacher's Toolkit", path: '/ai-toolkit' },
  { icon: BookOpen, label: 'My Library', path: '/library', badge: '32' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="p-6 flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-lg">V</span>
        </div>
        <span className="font-semibold text-lg">VedaAI</span>
      </div>

      {/* Create Assignment Button */}
      <div className="px-4 mb-4">
        <Button asChild className="w-full bg-black hover:bg-gray-800 text-white rounded-full">
          <Link href="/assignments/create">
            <span className="mr-2">+</span>
            Create Assignment
          </Link>
        </Button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3">
        {menuItems.map((item) => {
          const isActive =
            pathname === item.path ||
            (item.path !== '/' && pathname.startsWith(item.path));
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="flex-1 text-sm">{item.label}</span>
              {item.badge && (
                <span className="px-2 py-0.5 text-xs bg-orange-500 text-white rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Settings and School Info */}
      <div className="p-3 border-t border-gray-200">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors mb-3"
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm">Settings</span>
        </Link>

        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">DS</span>
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">Delhi Public School</div>
            <div className="text-xs text-gray-500">Active Since 01/04</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
