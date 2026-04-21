'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  Calendar, 
  UserCircle, 
  Users,
  ClipboardList, 
  FileText, 
  Table, 
  Files,
  MessageSquare,
  Mail,
  Receipt
} from 'lucide-react';
import Image from 'next/image'; 

const Sidebar = () => {
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
          label: 'Chat',
          icon: <MessageSquare className="w-5 h-5" />,
          href: '/chat'
        },
        {
          label: 'Email',
          icon: <Mail className="w-5 h-5" />,
          href: '/email'
        },
        {
          label: 'Factures',
          icon: <Receipt className="w-5 h-5" />,
          href: '/invoices'
        }
      ]
    }
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 z-30">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-200">
          <div className="relative w-20 h-20">
          <Image src="/logo.png" alt="Logo AllôDocta" fill className="object-contain" />
        </div>
      
      </div>

      <nav className="p-4">
        {menuItems.map((section, idx) => (
          <div key={idx} className="mb-6">
            <h2 className="text-xs font-semibold text-gray-400 mb-4 px-4">
              {section.title}
            </h2>
            <ul className="space-y-1">
              {section.items.map((item, itemIdx) => {
                const isActive = pathname === item.href;
                return (
                  <li key={itemIdx}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm ${
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {item.icon}
                      {item.label}
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