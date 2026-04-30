'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(prev => !prev)} />
      <Header sidebarCollapsed={sidebarCollapsed} />
      <main className={`pt-16 p-6 transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div key={pathname} className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
} 
