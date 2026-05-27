'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, BookOpen, Sparkles } from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: FileText, label: 'Assignments', path: '/assignments' },
  { icon: BookOpen, label: 'Library', path: '/library' },
  { icon: Sparkles, label: 'AI Toolkit', path: '/ai-toolkit' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive =
            pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center justify-center gap-1 px-4 py-2 ${
                isActive ? 'text-white' : 'text-gray-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
