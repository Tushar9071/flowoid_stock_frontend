'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { navigationItems, navigationVisibility } from '@/lib/constants';
import { normalizeRole } from '@/lib/roles';
import {
  Activity,
  BarChart3,
  Boxes,
  CreditCard,
  FileText,
  Grid2X2,
  LayoutDashboard,
  MoreHorizontal,
  Package,
  Settings,
  Shield,
  ShoppingCart,
  Terminal,
  Users,
  Users2,
} from 'lucide-react';

type NavItem = {
  id: string;
  label: string;
  href: string;
  desc?: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  badge?: number;
};

const ICON_MAP: Record<string, ComponentType<{ className?: string; strokeWidth?: number }>> = {
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

const ADMIN_PRIMARY_TABS: NavItem[] = [
  { id: 'admin-dashboard', label: 'Dashboard', href: '/admin', icon: BarChart3 },
  { id: 'admin-users', label: 'Users', href: '/admin/users', icon: Users },
  { id: 'admin-roles', label: 'Roles', href: '/admin/roles', icon: Shield },
  { id: 'admin-monitoring', label: 'Monitor', href: '/admin/monitoring', icon: Activity },
];

const ADMIN_MORE_PAGES: NavItem[] = [
  { id: 'permissions', label: 'Permissions', href: '/admin/permissions', desc: 'Manage granular permissions', icon: CreditCard },
  { id: 'logs', label: 'System Logs', href: '/admin/logs', desc: 'View platform system events', icon: Terminal },
  { id: 'backup', label: 'Database Backup', href: '/admin/backup', desc: 'Manage database snapshots', icon: Boxes },
  { id: 'audit', label: 'Audit Logs', href: '/admin/audit-logs', desc: 'Track administrative changes', icon: FileText },
  { id: 'workflows', label: 'Workflows', href: '/admin/workflows', desc: 'Monitor approval chains', icon: Grid2X2 },
  { id: 'settings', label: 'Settings', href: '/admin/settings', desc: 'Configure platform options', icon: Settings },
];

const PRIMARY_DASHBOARD_IDS = ['dashboard', 'inventory', 'orders-dispatch', 'worker-management'];

const NAV_DESCRIPTIONS: Record<string, string> = {
  'design-catalogue': 'Manage product designs',
  'worker-management': 'Track worker assignments',
  inventory: 'Review finished stock',
  'party-management': 'Manage parties and vendors',
  'raw-materials': 'Track material stock',
  'orders-dispatch': 'Manage orders and dispatch',
  'payments-ledger': 'Review payment activity',
  reports: 'View business reports',
  'user-management': 'Manage account access',
  'role-management': 'Manage role permissions',
  settings: 'Configure business options',
  profile: 'View your profile',
};

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, hasPermission, isFullAccess } = useAuth();
  const [showMore, setShowMore] = useState(false);

  const dashboardItems = useMemo(() => {
    const roleKey = normalizeRole(role);
    const visibleNav = navigationVisibility[roleKey] || navigationVisibility.viewer;

    return navigationItems
      .filter((item) => {
        if (item.adminOnly && roleKey !== 'owner' && roleKey !== 'flowoid_admin') return false;
        if (
          'permission' in item &&
          item.permission &&
          !isFullAccess &&
          roleKey !== 'flowoid_admin' &&
          !hasPermission(item.permission)
        ) {
          return false;
        }
        return visibleNav.includes(item.id);
      })
      .map((item) => ({
        id: item.id,
        label: item.label,
        href: item.href,
        desc: NAV_DESCRIPTIONS[item.id] || item.label,
        icon: ICON_MAP[item.icon as keyof typeof ICON_MAP] || LayoutDashboard,
      }));
  }, [hasPermission, isFullAccess, role]);

  const navConfig = useMemo(() => {
    if (pathname.startsWith('/admin')) {
      return { primaryTabs: ADMIN_PRIMARY_TABS, morePages: ADMIN_MORE_PAGES };
    }

    if (pathname.startsWith('/dashboard')) {
      const preferredPrimary = PRIMARY_DASHBOARD_IDS
        .map((id) => dashboardItems.find((item) => item.id === id))
        .filter(Boolean) as NavItem[];
      const primaryTabs = (preferredPrimary.length > 0 ? preferredPrimary : dashboardItems).slice(0, 4);
      const morePages = dashboardItems.filter((item) => !primaryTabs.some((tab) => tab.id === item.id));

      return { primaryTabs, morePages };
    }

    return null;
  }, [dashboardItems, pathname]);

  useEffect(() => {
    setShowMore(false);
  }, [pathname]);

  useEffect(() => {
    if (!showMore) return undefined;

    const close = () => setShowMore(false);
    window.addEventListener('popstate', close);
    return () => window.removeEventListener('popstate', close);
  }, [showMore]);

  if (!navConfig) return null;

  const { primaryTabs, morePages } = navConfig;
  const navigate = (href: string) => router.push(href);
  const isActive = (href: string) => pathname === href || (href !== '/admin' && href !== '/dashboard' && pathname.startsWith(`${href}/`));
  const hasMorePages = morePages.length > 0;
  const isMoreActive = hasMorePages && morePages.some((page) => isActive(page.href));

  return (
    <>
      <div className="mobile-nav-spacer" />

      {showMore && (
        <div
          className="mobile-nav-backdrop"
          onClick={() => setShowMore(false)}
          aria-hidden="true"
        />
      )}

      {showMore && (
        <div className="mobile-nav-drawer" role="dialog" aria-label="More navigation options">
          <div className="mobile-nav-drawer-handle" />
          <p className="mobile-nav-drawer-title">More Pages</p>
          {morePages.map((page) => {
            const Icon = page.icon;
            return (
              <button
                key={page.id}
                type="button"
                className={`mobile-nav-drawer-item ${isActive(page.href) ? 'active' : ''}`}
                onClick={() => navigate(page.href)}
              >
                <Icon className="mobile-nav-drawer-item-icon" strokeWidth={1.8} />
                <div className="mobile-nav-drawer-item-text">
                  <span className="mobile-nav-drawer-item-name">{page.label}</span>
                  <span className="mobile-nav-drawer-item-desc">{page.desc}</span>
                </div>
                <span className="mobile-nav-drawer-chevron" aria-hidden="true">›</span>
              </button>
            );
          })}
        </div>
      )}

      <nav className="mobile-bottom-nav" aria-label="Main navigation">
        {primaryTabs.map((tab) => {
          const active = isActive(tab.href);
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              className={`mobile-nav-tab ${active ? 'active' : ''}`}
              onClick={() => navigate(tab.href)}
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
            >
              {active && <span className="mobile-nav-pill" aria-hidden="true" />}
              <span className="mobile-nav-icon" aria-hidden="true">
                <Icon strokeWidth={active ? 2.5 : 1.8} />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="mobile-nav-badge">{tab.badge > 99 ? '99+' : tab.badge}</span>
                )}
              </span>
              <span className="mobile-nav-label">{tab.label}</span>
            </button>
          );
        })}

        {hasMorePages && (
          <button
            type="button"
            className={`mobile-nav-tab ${showMore || isMoreActive ? 'active' : ''}`}
            onClick={() => setShowMore((value) => !value)}
            aria-label="More pages"
            aria-expanded={showMore}
          >
            {(showMore || isMoreActive) && <span className="mobile-nav-pill" aria-hidden="true" />}
            <span className="mobile-nav-icon" aria-hidden="true">
              <MoreHorizontal strokeWidth={showMore || isMoreActive ? 2.5 : 1.8} />
            </span>
            <span className="mobile-nav-label">More</span>
          </button>
        )}
      </nav>
    </>
  );
}
