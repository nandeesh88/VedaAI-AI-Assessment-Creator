'use client';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between">
      {/* Mobile Logo */}
      <div className="flex items-center gap-3">
        <div className="md:hidden flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          <span className="font-semibold">VedaAI</span>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3 ml-auto">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full"></span>
        </Button>
        <div className="w-9 h-9 rounded-full bg-gray-300 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1590650213165-c1fef80648c4?w=100&h=100&fit=crop&crop=faces"
            alt="Profile"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </header>
  );
}
