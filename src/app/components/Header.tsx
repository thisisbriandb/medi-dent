 'use client';

import { Bell, Moon, ChevronDown, LogOut } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  sidebarCollapsed: boolean;
}

const Header = ({ sidebarCollapsed }: HeaderProps) => {
  const { profil, logout } = useAuth();

  return (
    <header className={`fixed top-0 right-0 h-16 bg-white border-b border-gray-200 z-20 transition-all duration-300 ${
      sidebarCollapsed ? 'left-20' : 'left-64'
    }`}>
      <div className="flex items-center justify-end h-full px-6">
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
                src={profil?.photo_url || '/default-avatar.png'}
                alt="Photo de profil"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex items-center gap-2">
              <div>
                <p className="text-sm font-medium">{profil?.prenom} {profil?.nom}</p>
                <p className="text-xs text-gray-500 capitalize">{profil?.role?.replace('_', ' ')}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </div>
            <button onClick={logout} className="p-2 hover:bg-gray-100 rounded-lg" title="Se déconnecter">
              <LogOut className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;