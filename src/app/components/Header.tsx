 'use client';

import { Search, Bell, Moon, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

const Header = () => {
  const { user } = useAuth();

  console.log(user);

  return (
    <header className="fixed top-0 right-0 left-64 h-16 bg-white border-b border-gray-200 z-20">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">
              ⌘K
            </kbd>
          </div>
        </div>
      

        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Moon className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg relative">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="relative w-8 h-8 rounded-full overflow-hidden">
              <Image
                src="/default-avatar.png"
                alt="Photo de profil"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex items-center gap-2 cursor-pointer">
              <div>
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;