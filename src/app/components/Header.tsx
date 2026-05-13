'use client';

import { LogOut, UserCircle, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  sidebarCollapsed: boolean;
  onMobileMenuToggle?: () => void;
}

const Header = ({ sidebarCollapsed, onMobileMenuToggle }: HeaderProps) => {
  const { profil, logout } = useAuth();

  return (
    <header className={`fixed top-0 right-0 h-16 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm z-20 transition-all duration-300 left-0 ${
      sidebarCollapsed ? 'md:left-16' : 'md:left-56'
    }`}>
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        {/* Mobile hamburger */}
        <button
          onClick={onMobileMenuToggle}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        <div className="hidden md:block" />

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
            <UserCircle className="w-5 h-5 text-blue-600" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-gray-900">{profil?.prenom} {profil?.nom}</p>
            <p className="text-xs text-gray-500 capitalize">{profil?.role?.replace('_', ' ')}</p>
          </div>
          <button onClick={logout} className="p-2 hover:bg-gray-100 rounded-lg ml-1 sm:ml-2 transition-colors" title="Se déconnecter">
            <LogOut className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;