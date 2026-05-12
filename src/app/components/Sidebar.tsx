'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  Calendar, 
  UserCircle, 
  Users,
  UsersRound,
  ClipboardList, 
  FileText, 
  Table, 
  Files,
  MessageSquare,
  Mail,
  Receipt,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Image from 'next/image'; 

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  const pathname = usePathname();
  const { profil } = useAuth();

  const menuItems = [
    {
      title: 'MENU',
      items: [
        {
          label: 'Dashboard',
          icon: <LayoutDashboard className="w-5 h-5" />,
          href: '/dashboard'
        },
        {
          label: 'Agenda',
          icon: <Calendar className="w-5 h-5" />,
          href: '/appointments'
        }
      ]
    },
    {
      title: 'GESTION',
      items: [
        {
          label: 'Patients',
          icon: <Users className="w-5 h-5" />,
          href: '/patients'
        },
        {
          label: 'Consultation',
          icon: <ClipboardList className="w-5 h-5" />,
          href: '/consultation'
        },
        {
          label: 'Dossier médical',
          icon: <FileText className="w-5 h-5" />,
          href: '/documents'
        },
        {
          label: 'Ordonnances',
          icon: <Files className="w-5 h-5" />,
          href: '/prescriptions'
        }
      ]
    },
    {
      title: 'SUPPORT',
      items: [
        {
          label: 'Équipe',
          icon: <UsersRound className="w-5 h-5" />,
          href: '/equipe'
        },
        {
          label: 'Factures',
          icon: <Receipt className="w-5 h-5" />,
          href: '/invoices'
        },
        {
          label: 'Email',
          icon: <Mail className="w-5 h-5" />,
          href: '/email'
        }
      ]
    }
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 shadow-sm z-30 transition-all duration-300 flex flex-col ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      <div className="flex items-center justify-between px-3 py-4 border-b border-gray-200">
        <div className={`relative transition-all duration-300 ${collapsed ? 'w-9 h-9 mx-auto' : 'w-14 h-14'}`}>
          <Image src="/logo.png" alt="Logo AllôDocta" fill className="object-contain" />
        </div>
        {!collapsed && (
          <button
            onClick={onToggle}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
            title="Réduire le menu"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {collapsed && (
        <div className="flex justify-center py-2 border-b border-gray-200">
          <button
            onClick={onToggle}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
            title="Ouvrir le menu"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <nav className={`flex-1 min-h-0 overflow-y-auto p-3 ${collapsed ? 'px-2' : ''}`}>
        {menuItems.map((section, idx) => (
          <div key={idx} className="mb-4">
            {!collapsed && (
              <h2 className="text-xs font-semibold tracking-[0.08em] text-gray-500 mb-3 px-3">
                {section.title}
              </h2>
            )}
            <ul className="space-y-1">
              {section.items.map((item, itemIdx) => {
                const isActive = pathname === item.href;
                return (
                  <li key={itemIdx}>
                    <Link
                      href={item.href}
                      prefetch={false}
                      title={collapsed ? item.label : undefined}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-100 text-blue-700 font-semibold shadow-sm'
                          : 'text-gray-700 hover:bg-gray-100'
                      } ${collapsed ? 'justify-center px-2' : ''}`}
                    >
                      {item.icon}
                      {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className={`p-3 border-t border-gray-200 mt-auto ${collapsed ? 'px-2' : ''}`}>
        <Link
          href="/profile"
          prefetch={false}
          title={collapsed ? "Profil" : undefined}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
            pathname === '/profile'
              ? 'bg-blue-100 text-blue-700 font-semibold shadow-sm'
              : 'text-gray-700 hover:bg-gray-100'
          } ${collapsed ? 'justify-center px-2' : ''}`}
        >
          <UserCircle className="w-5 h-5" />
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="whitespace-nowrap font-medium text-gray-900">Mon Profil</span>
              {profil?.nom && (
                <span className="text-xs text-gray-500 truncate">{profil.prenom} {profil.nom}</span>
              )}
            </div>
          )}
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;