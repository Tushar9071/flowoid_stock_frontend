// RBAC Types
// SUPER_ADMIN = Flowoid Technologies platform admin
// OWNER = Tenant / Business Owner
// STAFF = Staff member
// CUSTOM roles created by owner
export type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'STAFF' | string;
export type ResourceType = string;
export type WorkflowStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';
export type ApprovalAction = 'approve' | 'reject' | 'request_clarification';

// Subscription plan type
export type SubscriptionPlan = 'basic' | 'standard' | 'premium';
export type SubscriptionStatus = 'active' | 'suspended' | 'expired' | 'trial';

// Tenant type
export interface Tenant {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  plan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  startDate: Date;
  expiryDate: Date;
  activeStaff: number;
  maxStaff: number;
}

// User & Auth Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  lastLogin?: Date;
  status: 'active' | 'inactive' | 'pending';
  phone?: string;
  department?: string;
  createdAt: Date;
  createdBy?: string;
}

// Permission & Role Types
export interface Permission {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  module?: string;
  action?: string;
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  createdById?: string | null;
  permissions: Array<{
    id: string;
    roleId: string;
    permissionId: string;
    grantedAt: string;
    permission: Permission;
  }>;
}

// Workflow & Approval Types
export interface WorkflowApprover {
  role: UserRole;
  order: number;
  required: boolean;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  trigger: ResourceType; // what triggers this workflow
  approvers: WorkflowApprover[];
  createdAt: Date;
  isActive: boolean;
}

export interface Approval {
  id: string;
  workflowId: string;
  resourceId: string;
  resourceType: ResourceType;
  resourceName: string;
  requester: {
    id: string;
    name: string;
    email: string;
  };
  currentApprover?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  approvalChain: {
    role: UserRole;
    status: 'pending' | 'approved' | 'rejected';
    approver?: {
      id: string;
      name: string;
    };
    actionDate?: Date;
    comments?: string;
  }[];
  status: WorkflowStatus;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  resource: ResourceType;
  resourceId: string;
  resourceName?: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  status: 'success' | 'failure';
  ipAddress?: string;
  timestamp: Date;
  details?: string;
}

// Design Types
export type DesignCategory = 'necklace' | 'earring' | 'bracelet' | 'ring' | 'maang_tikka' | 'anklet';

export interface Design {
  id: string;
  code: string;
  name: string;
  category: DesignCategory;
  material: string;
  diamondCount: number;
  pieceRate: number;
  salePricePerDozen: number;
  imageUrl?: string;
  status: 'active' | 'discontinued';
  createdAt: Date;
}

// Worker Types
export interface Worker {
  id: string;
  code: string;
  name: string;
  phone: string;
  address: string;
  totalEarnings: number;
  totalPaid: number;
  status: 'active' | 'inactive';
  joinDate: Date;
}

export interface WorkerAssignment {
  id: string;
  workerId: string;
  designId: string;
  designCode: string;
  designName: string;
  issuedQty: number;
  returnedQty: number;
  rejectedQty: number;
  issueDate: Date;
  expectedReturnDate: Date;
  status: 'issued' | 'in_progress' | 'partially_returned' | 'completed';
}

export interface FinishedGoodsEntry {
  id: string;
  workerId: string;
  workerName: string;
  designId: string;
  designCode: string;
  designName: string;
  quantity: number;
  collectedDate: Date;
  quality: 'pass' | 'rework' | 'reject';
}

export interface WorkerPayment {
  id: string;
  workerId: string;
  workerName: string;
  workDate: Date;
  amount: number;
  paymentDate?: Date;
  status: 'pending' | 'paid';
  notes?: string;
}

// Inventory Types
export interface RawMaterial {
  id: string;
  code: string;
  type: string;
  unitType: string;
  currentStock: number;
  threshold: number;
  lastRestockDate: Date;
  supplier?: string;
  costPerUnit: number;
}

export interface InventoryItem {
  id: string;
  designId: string;
  designCode: string;
  designName: string;
  unpackagedPieces: number;
  packagedDozens: number;
  lowStockThreshold: number;
  lastUpdated: Date;
}

export interface PackagingFormEntry {
  id: string;
  date: Date;
  designId: string;
  designCode: string;
  designName: string;
  piecesToPackage: number;
  packagingQuality: 'pass' | 'rework';
  packagedDozens: number;
  wasteQuantity: number;
  status: 'draft' | 'completed';
}

// Party Types
export interface Dealer {
  id: string;
  code: string;
  name: string;
  city: string;
  phone: string;
  gstNumber: string;
  creditLimit: number;
  creditPeriod: number; // days
  outstanding: number;
  status: 'active' | 'inactive';
  joinDate: Date;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  city: string;
  phone: string;
  materials: string[];
  status: 'active' | 'inactive';
}

// Orders & Dispatch Types
export interface OrderItem {
  designId: string;
  designCode: string;
  designName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Order {
  id: string;
  orderId: string;
  dealerId: string;
  dealerName: string;
  date: Date;
  items: OrderItem[];
  totalValue: number;
  paymentStatus: 'paid' | 'credit' | 'partial';
  orderStatus: 'draft' | 'confirmed' | 'packed' | 'dispatched' | 'delivered';
  notes?: string;
}

export interface Dispatch {
  id: string;
  orderId: string;
  dealerId: string;
  dealerName: string;
  dispatchDate: Date;
  trackerNumber?: string;
  expectedDelivery: Date;
  status: 'pending' | 'shipped' | 'in_transit' | 'delivered' | 'cancelled';
}

// Payment Types
export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  dealerId: string;
  dealerName: string;
  invoiceDate: Date;
  dueDate: Date;
  amount: number;
  paidAmount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
}

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  dealerId: string;
  dealerName: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: 'cash' | 'cheque' | 'bank_transfer' | 'upi';
  referenceNumber?: string;
}

export interface DealerLedger {
  dealerId: string;
  dealerName: string;
  totalInvoiced: number;
  totalPaid: number;
  outstanding: number;
  lastTransaction: Date;
  status: 'good' | 'warning' | 'overdue';
}

// Reports Types
export interface SalesReport {
  month: string;
  totalSales: number;
  orders: number;
  averageOrderValue: number;
  topDesign: string;
}

export interface InventoryReport {
  designCode: string;
  designName: string;
  currentStock: number;
  threshold: number;
  status: 'good' | 'low' | 'critical';
}

export interface WorkerReport {
  workerId: string;
  workerName: string;
  totalAssignments: number;
  completionRate: number;
  rejectionRate: number;
  totalEarnings: number;
  status: 'active' | 'inactive';
}

export interface AgeingReport {
  dealerId: string;
  dealerName: string;
  outstanding: number;
  days0to30: number;
  days30to60: number;
  days60plus: number;
  status: 'good' | 'warning' | 'critical';
}

// Dashboard Types
export interface DashboardKPI {
  totalSales: number;
  activeOrders: number;
  pendingPayments: number;
  lowStockItems: number;
  activeWorkers: number;
  totalInventory: number;
}

export interface DashboardAlert {
  id: string;
  type: 'inventory' | 'payment' | 'order' | 'worker';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  timestamp: Date;
  actionUrl?: string;
}
