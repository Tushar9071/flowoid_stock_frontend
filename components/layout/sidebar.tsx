'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { navigationItems, navigationVisibility } from '@/lib/constants';
import { normalizeRole } from '@/lib/roles';
import {
  ChevronLeft,
  Menu,
  LayoutDashboard,
  Grid2X2,
  Users,
  Package,
  Boxes,
  Users2,
  ShoppingCart,
  CreditCard,
  BarChart3,
  Shield,
  Settings,
  LogOut,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import Image from 'next/image';

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  LayoutDashboard,
  Grid2X2,
  Users,
  Package,
  Boxes,
  Users2,
  ShoppingCart,
  CreditCard,
  BarChart3,
  Shield,
  Settings,
};

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  flowoid_admin: { label: 'Flowoid Admin', color: '#7C3AED' },
  owner:         { label: 'Business Owner', color: '#f5a623' },
  manager:       { label: 'Manager',        color: '#1a7a4a' },
  viewer:        { label: 'Viewer',         color: '#6b7280' },
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, user, logout, hasPermission, isFullAccess } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const scrollRef = React.useRef<HTMLElement>(null);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeFlyout, setActiveFlyout] = useState<{ item: any, top: number } | null>(null);

  React.useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    window.addEventListener('toggle-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-sidebar', handleToggle);
  }, []);

  React.useEffect(() => {
    if (scrollRef.current) {
      const savedScroll = sessionStorage.getItem('sidebarScrollPos');
      if (savedScroll) {
        scrollRef.current.scrollTop = parseInt(savedScroll, 10);
      }
    }
  }, []);

  React.useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebarCollapsed');
    if (savedCollapsed === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  React.useEffect(() => {
    const activeItem = navigationItems.find(item => {
      const isMatch = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
      const subItems = (item as any).subItems as { href: string }[] | undefined;
      const isSubMatch = subItems && subItems.some(sub => pathname === sub.href || pathname.startsWith(sub.href + '/'));
      return isMatch || isSubMatch;
    });
    if (activeItem) {
      if ((activeItem as any).subItems) {
        setExpanded(activeItem.id);
      } else {
        setExpanded(null);
      }
    } else {
      setExpanded(null);
    }
  }, [pathname]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  const roleKey = normalizeRole(role);
  const visibleNav = navigationVisibility[roleKey] || navigationVisibility.viewer;

  const visibleItems = navigationItems.filter(item => {
    if (item.adminOnly && roleKey !== 'owner' && roleKey !== 'flowoid_admin') return false;
    if ('permission' in item && item.permission && !isFullAccess && roleKey !== 'flowoid_admin' && !hasPermission(item.permission)) {
      return false;
    }
    return visibleNav.includes(item.id);
  });

  const roleMeta = ROLE_BADGE[roleKey] || { label: roleKey, color: '#f5a623' };

  return (
    <>

      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
        />
      )}

      {/* Sidebar container — background driven by --color-sidebar-bg */}
      <aside
        className={`theme-sidebar-bg fixed md:relative inset-y-0 left-0 h-full flex flex-col z-40 transition-[width,transform] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } w-[280px] ${isCollapsed ? 'md:w-[72px]' : 'md:w-[260px]'}`}
        style={{ background: 'var(--color-sidebar-bg)' }}
      >
        {/* Edge Toggle Button */}
        <button
          onClick={() => {
            const newVal = !isCollapsed;
            setIsCollapsed(newVal);
            localStorage.setItem('sidebarCollapsed', String(newVal));
            if (newVal) setActiveFlyout(null);
          }}
          className="hidden md:flex absolute -right-3 top-6 z-50 w-6 h-6 items-center justify-center bg-[#0F2A4A] border border-white/20 rounded-md shadow-md text-white/60 hover:text-white hover:bg-white/10 transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
       {/* Logo area */}
        <div className="px-3 py-0 border-b border-white/10 shrink-0">
          <div className={`flex ${isCollapsed ? 'flex-col items-center py-4 gap-4' : 'items-center justify-between py-0 gap-2'}`}>
            {!isCollapsed ? (
              <div className="flex-1 min-w-0 transition-opacity duration-300">
                <Image 
                  src="/brand/StockFlow_horizontal_blue.svg" 
                  alt="StockFlow" 
                  width={2400} 
                  height={600} 
                  className="hidden md:block w-full h-auto object-contain object-left"
                  priority
                />
                <Image 
                  src="/brand/StockFlow_horizontal_blue.svg" 
                  alt="StockFlow" 
                  width={2400} 
                  height={600} 
                  className="md:hidden w-full h-auto object-contain object-left"
                  priority
                />
              </div>
            ) : (
              <div className="hidden md:flex transition-opacity duration-300">
                <Image 
                  src="/brand/Favicon_app.svg" 
                  alt="StockFlow" 
                  width={32} 
                  height={32} 
                  className="w-8 h-8 object-contain"
                  priority
                />
              </div>
            )}

            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden p-1 hover:bg-white/10 rounded-lg transition-colors shrink-0"
            >
              <ChevronLeft className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>

        {/* Navigation list */}
        <nav 
          ref={scrollRef}
          className="flex-1 overflow-y-auto py-5 scrollbar-none"
          onScroll={(e) => {
            sessionStorage.setItem('sidebarScrollPos', e.currentTarget.scrollTop.toString());
            if (isCollapsed) setActiveFlyout(null);
          }}
        >
          <ul className="space-y-1 px-3">
            {visibleItems.map((item, index) => {
              const previousItem = index > 0 ? visibleItems[index - 1] : null;
              const showGroupHeading = (item as any).group && (!previousItem || (previousItem as any).group !== (item as any).group);
              const subItems = (item as any).subItems as { id: string; label: string; href: string }[] | undefined;
              const isGroupActive = pathname === item.href || 
                               (item.href !== '/dashboard' && pathname.startsWith(item.href + '/')) ||
                               (item.id === 'dashboard' && pathname === '/dashboard/recent-activity') ||
                               (subItems && subItems.some(sub => pathname === sub.href || pathname.startsWith(sub.href + '/')));
              const Icon = iconMap[item.icon as keyof typeof iconMap];
              const isExpanded = expanded === item.id;

              const isHovered = isCollapsed && activeFlyout?.item.id === item.id;
              const showActiveStyle = isGroupActive || isHovered;

              return (
                <React.Fragment key={item.id}>
                  {showGroupHeading && !isCollapsed && (
                    <div className="px-4 mt-6 mb-2">
                      <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest whitespace-nowrap">
                        {(item as any).group}
                      </p>
                    </div>
                  )}
                  {showGroupHeading && isCollapsed && index > 0 && (
                    <div className="mt-4 mb-2 flex justify-center">
                      <div className="w-6 h-[1px] bg-white/10" />
                    </div>
                  )}
                  
                  <li 
                    className="flex flex-col relative"
                    onMouseEnter={(e) => {
                      if (isCollapsed) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setActiveFlyout({ item, top: rect.top });
                      }
                    }}
                    onMouseLeave={() => {
                      if (isCollapsed) {
                        setActiveFlyout(null);
                      }
                    }}
                  >
                    <div className="relative group">
                      <Link
                        href={item.href}
                        onClick={(e) => { 
                          if (isCollapsed && subItems) {
                            e.preventDefault(); 
                            const rect = e.currentTarget.getBoundingClientRect();
                            setActiveFlyout({ item, top: rect.top });
                          } else if (!isCollapsed && subItems) {
                            e.preventDefault();
                            setExpanded(isExpanded ? null : item.id);
                          }
                          if (!subItems && !isCollapsed) setIsOpen(false); 
                        }}
                        className={`relative flex items-center transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] group overflow-hidden ${
                          isCollapsed 
                            ? 'justify-center p-0 mx-auto w-[42px] h-[42px] rounded-xl' 
                            : 'py-2.5 px-4 gap-3 rounded-xl text-[14px]'
                        } ${
                          showActiveStyle
                            ? 'font-bold shadow-md'
                            : isExpanded
                            ? 'font-bold text-white bg-white/10'
                            : 'text-white/60 hover:bg-white/10 hover:text-white font-medium'
                        }`}
                        style={
                          showActiveStyle
                            ? { backgroundColor: 'var(--color-sidebar-active)', color: 'var(--color-sidebar-active-text)' }
                            : undefined
                        }
                      >
                      {/* Active indicator bar */}
                      {isGroupActive && !subItems && !isCollapsed && (
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1"
                          style={{ backgroundColor: 'var(--color-accent-dark)' }}
                        />
                      )}
                      {Icon && (
                        <Icon
                          className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                            showActiveStyle ? '' : isExpanded ? 'text-white' : 'text-white/40 group-hover:text-white/80'
                          }`}
                          style={showActiveStyle ? { color: 'var(--color-sidebar-active-text)' } : undefined}
                        />
                      )}
                      
                      {!isCollapsed && (
                        <span className="flex-1 whitespace-nowrap">{item.label}</span>
                      )}
                    </Link>

                    {/* Tooltip for Collapsed State (Only for items without dropdowns) */}
                    {isCollapsed && !subItems && activeFlyout?.item.id !== item.id && (
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 bg-[#0F2A4A] text-white text-[13px] font-bold rounded-xl shadow-2xl opacity-0 translate-x-[-8px] pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] z-[60] whitespace-nowrap border border-white/10">
                        {item.label}
                        <div className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-3 bg-[#0F2A4A] border-l border-t border-white/10 -rotate-45 rounded-tl-[2px]" />
                      </div>
                    )}

                    {/* Separate toggle button for subItems */}
                    {!isCollapsed && subItems && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setExpanded(isExpanded ? null : item.id);
                        }}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 flex items-center justify-center transition-all ${
                          isExpanded 
                            ? '' 
                            : 'text-white/40 hover:text-white'
                        }`}
                        style={isExpanded ? { color: 'var(--color-sidebar-active-text)' } : undefined}
                      >
                        <ChevronRight
                          className={`w-4 h-4 transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isExpanded ? 'rotate-90' : ''}`}
                        />
                      </button>
                    )}
                  </div>

                  {!isCollapsed && subItems && (() => {
                    const activeSubItem = [...subItems]
                      .sort((a, b) => b.href.length - a.href.length)
                      .find(s => pathname === s.href || pathname.startsWith(s.href + '/'));

                    return (
                      <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                        <div className="overflow-hidden">
                          <ul className="space-y-0.5 mt-1 py-1.5">
                            {subItems.map(subItem => {
                            const isSubActive = activeSubItem?.id === subItem.id;
                            return (
                              <li key={subItem.id}>
                                <Link
                                  href={subItem.href}
                                  onClick={() => setIsOpen(false)}
                                  className={`flex items-center gap-3 py-2 text-[13px] rounded-lg mx-3 pl-[34px] pr-4 transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
                                    isSubActive
                                      ? 'text-white font-medium bg-white/10'
                                      : 'text-white/50 hover:text-white hover:bg-white/5'
                                  }`}
                                >
                                  <div className={`w-1.5 h-1.5 rounded-full transition-colors shrink-0 ${isSubActive ? 'bg-white' : 'bg-white/20'}`} />
                                  <span className="whitespace-nowrap">{subItem.label}</span>
                                </Link>
                              </li>
                            );
                          })}
                          </ul>
                        </div>
                      </div>
                    );
                  })()}
                  </li>
                </React.Fragment>
              );
            })}
          </ul>
        </nav>

        {/* User profile footer */}
        <div className="p-4 border-t border-white/10 shrink-0">
          <div className={`flex items-center gap-3 mb-3 ${isCollapsed ? 'justify-center px-0' : 'px-2'}`}>
            <div className="theme-avatar w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-sm border border-white/10">
              {user?.name?.charAt(0) || 'U'}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-[13px] font-bold truncate">{user?.name || 'User'}</p>
                <p className="text-white/50 text-[11px] font-medium truncate uppercase tracking-wider">{roleMeta.label}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] text-[13px] font-bold border border-transparent hover:border-white/10 ${
              isCollapsed ? 'px-0' : 'px-4'
            }`}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Flyout Menu for Collapsed State */}
      {isCollapsed && activeFlyout && (
        <>
          <div 
            className="fixed z-50 animate-in fade-in slide-in-from-left-2 duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
            style={{ 
              top: activeFlyout.top, 
              left: 76, 
            }}
            onMouseEnter={() => setActiveFlyout(activeFlyout)}
            onMouseLeave={() => setActiveFlyout(null)}
          >
            {/* Invisible hover bridge to prevent losing hover between icon and menu */}
            <div className="absolute inset-y-0 -left-6 w-6 bg-transparent z-0" />

            {/* The Arrow */}
            <div className="absolute top-[21px] -translate-y-1/2 -left-[5px] w-3 h-3 border-l border-t border-white/10 -rotate-45 z-0 rounded-tl-[2px]" style={{ background: 'var(--color-sidebar-bg)' }} />

            {/* Main Menu Box */}
            <div className="relative z-10 rounded-xl shadow-2xl overflow-hidden border border-white/10" style={{ minWidth: 200, background: 'var(--color-sidebar-bg)' }}>
            <div className="px-4 py-2.5 bg-white/5 border-b border-white/10 font-bold text-white text-[13px]">
              {activeFlyout.item.label}
            </div>
          {(activeFlyout.item as any).subItems ? (
            <ul className="py-1.5">
              {((activeFlyout.item as any).subItems as any[]).map(subItem => {
                const isSubActive = pathname === subItem.href || pathname.startsWith(subItem.href + '/');
                return (
                  <li key={subItem.id}>
                    <Link
                      href={subItem.href}
                      onClick={() => setActiveFlyout(null)}
                      className={`flex items-center gap-3 px-4 py-2 text-[13px] transition-colors ${
                        isSubActive 
                          ? 'text-white bg-white/10 font-medium' 
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full transition-colors shrink-0 ${isSubActive ? 'bg-white' : 'bg-white/20'}`} />
                      {subItem.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : null}
            </div>
          </div>
        </>
      )}
    </>
  );
}
