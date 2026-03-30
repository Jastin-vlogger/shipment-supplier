'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PropsWithChildren, useState } from 'react';

interface PortalShellProps extends PropsWithChildren {
  supplierName: string;
  supplierStatus: string;
  registrationStage: string;
  profileCompletionPercent: number;
  profileComplete: boolean;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: 'M4 6h16M4 12h16M4 18h16' },  // menu 
  { href: '/profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }, // user 
  { href: '/schedules', label: 'Schedules', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' }, // calendar
];

export function PortalShell({
  supplierName,
  supplierStatus,
  registrationStage,
  profileCompletionPercent,
  profileComplete,
  children,
}: PortalShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <div className={`flex min-h-screen bg-white transition-[grid-template-columns] duration-200 ${isSidebarCollapsed ? 'md:grid md:grid-cols-[92px_minmax(0,1fr)]' : 'md:grid md:grid-cols-[232px_minmax(0,1fr)]'} max-md:flex max-md:flex-col`}>
      
      {/* Sidebar */}
      <aside className={`relative flex flex-col gap-8 bg-white py-5 text-slate-900 border-r border-slate-200 max-md:border-b max-md:border-r-0 max-md:shrink-0 max-md:w-full ${isSidebarCollapsed ? 'items-center px-3 max-md:items-stretch max-md:px-4' : 'px-4'}`}>
        <span className="absolute inset-y-4 right-0 w-px bg-slate-200 max-md:hidden" aria-hidden="true"></span>
        <button
          type="button"
          className="absolute right-[-0.7rem] top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:border-slate-300 hover:text-slate-600 max-md:hidden"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        >
          <svg className={`h-4 w-4 transition-transform ${isSidebarCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className={`py-2 ${isSidebarCollapsed ? 'w-full px-2 max-md:px-3' : 'px-1'}`}>
          {isSidebarCollapsed ? (
            <div className="flex justify-center max-md:hidden">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl p-0.5">
                <Image src="/rh-mark.svg" alt="Royal Horizon Logo" width={44} height={44} className="h-full w-full object-contain" />
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-4 shadow-sm">
              <div className="relative h-[76px] w-full">
                <Image
                  src="/royal-horizon-supplier-logo.jpeg"
                  alt="Royal Horizon"
                  fill
                  className="object-contain object-left"
                  sizes="220px"
                  priority
                />
              </div>
              <p className="mt-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Supplier Scheduler
              </p>
            </div>
          )}
        </div>

        <nav className={`flex gap-2 max-md:flex-row max-md:overflow-x-auto max-md:pb-2 ${isSidebarCollapsed ? 'flex-col w-full items-center max-md:items-start' : 'flex-col'}`} aria-label="Primary navigation">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isSidebarCollapsed ? item.label : undefined}
                className={`inline-flex items-center gap-3 rounded-2xl transition-all font-bold ${isSidebarCollapsed ? 'h-12 w-12 justify-center px-0 max-md:h-auto max-md:w-auto max-md:px-4 max-md:py-3' : 'px-4 py-3'} text-sm ${isActive ? 'bg-blue-600 !text-white shadow-lg shadow-blue-900/20' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                </span>
                <span className={isSidebarCollapsed ? 'hidden max-md:block' : 'block'}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Content Shell */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Navbar */}
        <header className="z-20 border-b border-slate-200 bg-white/90 px-4 py-3 sm:px-5 md:px-6 backdrop-blur-[12px]">
          <div className="mx-auto flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Supplier Workspace</p>
              <h2 className="truncate text-lg font-black tracking-tight text-slate-900">{supplierName}</h2>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`status-badge status-${registrationStage.toLowerCase().replace(/\s+/g, '-')}`}>
                {profileComplete ? 'Draft' : `${profileCompletionPercent}% complete`}
              </span>
              <span className={`status-badge status-${supplierStatus.toLowerCase()} hidden sm:inline-flex`}>{supplierStatus}</span>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-600 shadow-sm transition-colors hover:bg-red-100 disabled:opacity-50"
                title="Logout"
                aria-label="Logout"
              >
               <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto custom-scrollbar">
          <div className="mx-auto max-w-[1600px] p-4 md:p-6 lg:p-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
