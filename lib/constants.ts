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
    canManageUsers: false,
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
    group: 'Dashboard',
    href: '/dashboard',
    icon: 'LayoutDashboard',
    permission: 'dashboard.read',
  },
  {
    id: 'design-catalogue',
    label: 'Design Catalogue',
    group: 'Operations',
    href: '/dashboard/design-catalogue',
    icon: 'Grid2X2',
    permission: 'designs.read',
    subItems: [
      { id: 'dc-designs', label: 'Designs', href: '/dashboard/design-catalogue' },
      { id: 'dc-categories', label: 'Categories', href: '/dashboard/design-catalogue/categories' }
    ]
  },
  {
    id: 'worker-management',
    label: 'Worker Management',
    group: 'Operations',
    href: '/dashboard/worker-management',
    icon: 'Users',
    permission: 'workers.read',
    subItems: [
      { id: 'worker-list', label: 'Worker List', href: '/dashboard/worker-management' },
      { id: 'assignments', label: 'Assignments', href: '/dashboard/worker-management/assignments' },
      { id: 'goods-returns', label: 'Goods Returns', href: '/dashboard/worker-management/goods-returns' },
      { id: 'payments', label: 'Payment Settlement', href: '/dashboard/worker-management/payments' }
    ]
  },
  {
    id: 'raw-materials',
    label: 'Raw Materials',
    group: 'Inventory',
    href: '/dashboard/raw-materials',
    icon: 'Package',
    permission: 'raw_materials.read',
    subItems: [
      { id: 'rm-stock', label: 'Stock Overview', href: '/dashboard/raw-materials' },
      { id: 'rm-material-list', label: 'Material List', href: '/dashboard/raw-materials/material-list' },
      { id: 'rm-stock-in', label: 'Material Purchases', href: '/dashboard/raw-materials/stock-in' },
      { id: 'rm-stock-out', label: 'Material Usage', href: '/dashboard/raw-materials/stock-out' },
    ]
  },
  {
    id: 'inventory',
    label: 'Inventory',
    group: 'Inventory',
    href: '/dashboard/inventory',
    icon: 'Boxes',
    permission: 'stock_items.read',
    subItems: [
      { id: 'inv-finished', label: 'Finished Stock', href: '/dashboard/inventory' },
      { id: 'inv-packaging', label: 'Packaging Batches', href: '/dashboard/inventory/packaging' },
      { id: 'inv-supplementary', label: 'Supplementary Stock', href: '/dashboard/inventory/supplementary' },
    ]
  },
  {
    id: 'party-management',
    label: 'Party Management',
    group: 'Parties',
    href: '/dashboard/dealers',
    icon: 'Users2',
    permission: 'dealer_management.read',
    subItems: [
      { id: 'pm-dealers', label: 'Dealer Management', href: '/dashboard/dealers' },
      { id: 'pm-suppliers', label: 'Supplier Management', href: '/dashboard/suppliers' }
    ]
  },
  {
    id: 'orders-dispatch',
    label: 'Orders & Dispatch',
    group: 'Sales',
    href: '/dashboard/orders-dispatch',
    icon: 'ShoppingCart',
    permission: 'sales_orders.read',
    subItems: [
      { id: 'od-orders', label: 'All Orders', href: '/dashboard/orders-dispatch' },
      { id: 'od-dispatch', label: 'Dispatch Status', href: '/dashboard/orders-dispatch/dispatch' },
    ]
  },
  {
    id: 'payments-ledger',
    label: 'Payments & Ledger',
    group: 'Sales',
    href: '/dashboard/payments-ledger',
    icon: 'CreditCard',
    permission: 'payments.read',
    subItems: [
      { id: 'pl-payments', label: 'Payments', href: '/dashboard/payments-ledger' },
      { id: 'pl-ledger', label: 'Party Ledger', href: '/dashboard/payments-ledger/ledger' },
      { id: 'pl-ageing', label: 'Ageing', href: '/dashboard/payments-ledger/ageing' },
      { id: 'pl-cashflow', label: 'Cash Flow', href: '/dashboard/payments-ledger/cashflow' }
    ]
  },
  {
    id: 'reports',
    label: 'Reports',
    group: 'Analytics',
    href: '/dashboard/reports',
    icon: 'BarChart3',
    permission: 'reports.read',
  },
  {
    id: 'user-management',
    label: 'User Management',
    group: 'System',
    href: '/dashboard/user-management',
    icon: 'Shield',
    adminOnly: true,
    permission: 'users.read',
  },
  {
    id: 'role-management',
    label: 'Roles & Permissions',
    group: 'System',
    href: '/dashboard/roles',
    icon: 'Shield',
    adminOnly: true,
    permission: 'roles.read',
  },
  {
    id: 'settings',
    label: 'Settings',
    group: 'System',
    href: '/dashboard/settings',
    icon: 'Settings',
    permission: 'settings.read',
  },
  {
    id: 'profile',
    label: 'Profile',
    group: 'System',
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
