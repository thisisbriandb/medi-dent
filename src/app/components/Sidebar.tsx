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
        },
        {
          label: 'Profil',
          icon: <UserCircle className="w-5 h-5" />,
          href: '/profile'
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
      className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-30 transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200">
        <div className={`relative transition-all duration-300 ${collapsed ? 'w-10 h-10 mx-auto' : 'w-20 h-20'}`}>
          <Image src="/logo.png" alt="Logo AllôDocta" fill className="object-contain" />
        </div>
        {!collapsed && (
          <button
            onClick={onToggle}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"
            title="Réduire le menu"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {collapsed && (
        <div className="flex justify-center py-3 border-b border-gray-200">
          <button
            onClick={onToggle}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"
            title="Ouvrir le menu"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <nav className={`p-4 overflow-y-auto h-[calc(100vh-6rem)] ${collapsed ? 'px-2' : ''}`}>
        {menuItems.map((section, idx) => (
          <div key={idx} className="mb-6">
            {!collapsed && (
              <h2 className="text-xs font-semibold text-gray-400 mb-4 px-4">
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
                      title={collapsed ? item.label : undefined}
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-50'
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
    </aside>
  );
};

export default Sidebar;