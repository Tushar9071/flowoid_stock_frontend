import type { UserRole } from './types';

// Role-based permissions
export const rolePermissions: Record<string, {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewAdmin: boolean;
  canManageUsers: boolean;
}> = {
  flowoid_admin: {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canViewAdmin: true,
    canManageUsers: true,
  },
  owner: {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canViewAdmin: false,
    canManageUsers: true,
  },
  manager: {
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canViewAdmin: false,
    canManageUsers: false,
  },
  viewer: {
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canViewAdmin: false,
    canManageUsers: false,
  },
};

// Role-based navigation visibility
export const navigationVisibility: Record<string, string[]> = {
  flowoid_admin: [
    'dashboard',
    'design-catalogue',
    'worker-management',
    'inventory',
    'party-management',
    'raw-materials',
    'orders-dispatch',
    'payments-ledger',
    'reports',
    'role-management',
    'user-management',
    'settings',
  ],
  owner: [
    'dashboard',
    'design-catalogue',
    'worker-management',
    'inventory',
    'party-management',
    'raw-materials',
    'orders-dispatch',
    'payments-ledger',
    'reports',
    'role-management',
    'user-management',
    'settings',
  ],
  manager: [
    'dashboard',
    'design-catalogue',
    'worker-management',
    'inventory',
    'party-management',
    'raw-materials',
    'orders-dispatch',
    'reports',
  ],
  viewer: [
    'dashboard',
    'design-catalogue',
    'worker-management',
    'inventory',
    'party-management',
    'raw-materials',
    'orders-dispatch',
    'payments-ledger',
    'reports',
  ],
};

// Color scheme
export const colors = {
  navy: '#0F2A4A',
  teal: '#0D7377',
  amber: '#F5A623',
  lightBg: '#F4F6F9',
  white: '#FFFFFF',
  border: '#E2E8F0',
  text: '#1A202C',
  muted: '#64748B',
  success: '#16A34A',
  danger: '#DC2626',
  warning: '#D97706',
};

// Status badges
export const statusColors = {
  active: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  inactive: { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-500' },
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  paid: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  unpaid: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
  overdue: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
  draft: { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-500' },
  confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
  packed: { bg: 'bg-indigo-100', text: 'text-indigo-800', dot: 'bg-indigo-500' },
  dispatched: { bg: 'bg-purple-100', text: 'text-purple-800', dot: 'bg-purple-500' },
  delivered: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  completed: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
  pass: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  rework: { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500' },
  reject: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
  good: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  warning: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  critical: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
};

// Design categories
export const designCategories = [
  { value: 'necklace', label: 'Necklace' },
  { value: 'earring', label: 'Earring' },
  { value: 'bracelet', label: 'Bracelet' },
  { value: 'ring', label: 'Ring' },
  { value: 'maang_tikka', label: 'Maang Tikka' },
  { value: 'anklet', label: 'Anklet' },
];

// Payment methods
export const paymentMethods = [
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'upi', label: 'UPI' },
];

// Order status flow
export const orderStatusFlow = {
  draft: { label: 'Draft', color: 'gray' },
  confirmed: { label: 'Confirmed', color: 'blue' },
  packed: { label: 'Packed', color: 'indigo' },
  dispatched: { label: 'Dispatched', color: 'purple' },
  delivered: { label: 'Delivered', color: 'green' },
};

// Navigation items
export const navigationItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'LayoutDashboard',
    permission: 'dashboard.read',
  },
  {
    id: 'design-catalogue',
    label: 'Design Catalogue',
    href: '/dashboard/design-catalogue',
    icon: 'Grid2X2',
    permission: 'designs.read',
  },
  {
    id: 'worker-management',
    label: 'Worker Management',
    href: '/dashboard/worker-management',
    icon: 'Users',
    permission: 'workers.read',
  },
  {
    id: 'raw-materials',
    label: 'Raw Materials',
    href: '/dashboard/raw-materials',
    icon: 'Package',
    permission: 'raw_materials.read',
  },
  {
    id: 'inventory',
    label: 'Inventory',
    href: '/dashboard/inventory',
    icon: 'Boxes',
    permission: 'stock_items.read',
  },
  {
    id: 'party-management',
    label: 'Party Management',
    href: '/dashboard/party-management',
    icon: 'Users2',
    permission: 'parties.read',
  },
  {
    id: 'orders-dispatch',
    label: 'Orders & Dispatch',
    href: '/dashboard/orders-dispatch',
    icon: 'ShoppingCart',
    permission: 'sales_orders.read',
  },
  {
    id: 'payments-ledger',
    label: 'Payments & Ledger',
    href: '/dashboard/payments-ledger',
    icon: 'CreditCard',
    permission: 'payments.read',
  },
  {
    id: 'reports',
    label: 'Reports',
    href: '/dashboard/reports',
    icon: 'BarChart3',
    permission: 'reports.read',
  },
  {
    id: 'user-management',
    label: 'User Management',
    href: '/dashboard/user-management',
    icon: 'Shield',
    adminOnly: true,
    permission: 'users.read',
  },
  {
    id: 'role-management',
    label: 'Roles & Permissions',
    href: '/dashboard/roles',
    icon: 'Shield',
    adminOnly: true,
    permission: 'roles.read',
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/dashboard/settings',
    icon: 'Settings',
    adminOnly: true,
    permission: 'settings.read',
  },
  {
    id: 'profile',
    label: 'Profile',
    href: '/dashboard/profile',
    icon: 'Shield',
    permission: 'dashboard.read',
  },
];

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format date
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

// Format date time
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
