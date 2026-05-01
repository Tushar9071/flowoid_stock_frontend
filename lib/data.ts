import {
  User, Design, Worker, WorkerAssignment, FinishedGoodsEntry, WorkerPayment,
  RawMaterial, InventoryItem, PackagingFormEntry, Dealer, Supplier,
  Order, Dispatch, Invoice, PaymentRecord, DealerLedger, DashboardAlert, OrderItem,
  Permission, Role, WorkflowTemplate, Approval, AuditLog, Tenant
} from './types';

// =============================================================
// AUTH & RBAC DATA (Removed - Using Backend API)
// =============================================================

// =============================================================
// MOCK TENANTS — for Flowoid Admin panel
// =============================================================
export const mockTenants: Tenant[] = [
  {
    id: 'tenant-1',
    businessName: 'Ayanshi Imitation',
    ownerName: 'Rajesh Kumar',
    email: 'owner@ayanshi.com',
    phone: '+91 9876543210',
    city: 'Jaipur',
    plan: 'standard',
    subscriptionStatus: 'active',
    startDate: new Date('2024-01-05'),
    expiryDate: new Date('2025-01-05'),
    activeStaff: 2,
    maxStaff: 5,
  },
  {
    id: 'tenant-2',
    businessName: 'Meena Jewels',
    ownerName: 'Sanjay Mehta',
    email: 'sanjay@meenajewels.com',
    phone: '+91 9988776655',
    city: 'Surat',
    plan: 'basic',
    subscriptionStatus: 'active',
    startDate: new Date('2024-03-10'),
    expiryDate: new Date('2025-03-10'),
    activeStaff: 1,
    maxStaff: 2,
  },
  {
    id: 'tenant-3',
    businessName: 'Priya Gold House',
    ownerName: 'Kavita Joshi',
    email: 'kavita@priyagold.com',
    phone: '+91 9811223344',
    city: 'Mumbai',
    plan: 'premium',
    subscriptionStatus: 'active',
    startDate: new Date('2024-02-01'),
    expiryDate: new Date('2025-02-01'),
    activeStaff: 8,
    maxStaff: 999,
  },
  {
    id: 'tenant-4',
    businessName: 'Raj Creations',
    ownerName: 'Vikram Rao',
    email: 'vikram@rajcreations.com',
    phone: '+91 9765432100',
    city: 'Hyderabad',
    plan: 'basic',
    subscriptionStatus: 'suspended',
    startDate: new Date('2023-11-01'),
    expiryDate: new Date('2024-11-01'),
    activeStaff: 0,
    maxStaff: 2,
  },
];

// =============================================================
// MOCK USERS (Removed - Using Backend API)
// =============================================================
export const mockUsers: User[] = [];

// Mock Designs
export const mockDesigns: Design[] = [
  {
    id: 'design-1',
    code: 'D001',
    name: 'Classic Pearl Necklace',
    category: 'necklace',
    material: 'Brass with Pearl Coating',
    diamondCount: 12,
    pieceRate: 45,
    salePricePerDozen: 540,
    status: 'active',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'design-2',
    code: 'D002',
    name: 'Modern Earring Pair',
    category: 'earring',
    material: 'Alloy with Crystal',
    diamondCount: 4,
    pieceRate: 28,
    salePricePerDozen: 336,
    status: 'active',
    createdAt: new Date('2024-01-20'),
  },
  {
    id: 'design-3',
    code: 'D003',
    name: 'Elegant Bracelet',
    category: 'bracelet',
    material: 'Copper with Gold Plating',
    diamondCount: 24,
    pieceRate: 65,
    salePricePerDozen: 780,
    status: 'active',
    createdAt: new Date('2024-02-10'),
  },
  {
    id: 'design-4',
    code: 'D004',
    name: 'Traditional Maang Tikka',
    category: 'maang_tikka',
    material: 'Brass with Stone Setting',
    diamondCount: 20,
    pieceRate: 85,
    salePricePerDozen: 1020,
    status: 'active',
    createdAt: new Date('2024-02-15'),
  },
  {
    id: 'design-5',
    code: 'D005',
    name: 'Delicate Ring Set',
    category: 'ring',
    material: 'Silver Alloy with Zirconia',
    diamondCount: 6,
    pieceRate: 35,
    salePricePerDozen: 420,
    status: 'active',
    createdAt: new Date('2024-03-01'),
  },
  {
    id: 'design-6',
    code: 'D006',
    name: 'Anklet with Bells',
    category: 'anklet',
    material: 'Copper with Enamel',
    diamondCount: 8,
    pieceRate: 38,
    salePricePerDozen: 456,
    status: 'active',
    createdAt: new Date('2024-03-05'),
  },
];

// Mock Workers
export const mockWorkers: Worker[] = [
  {
    id: 'worker-1',
    code: 'W001',
    name: 'Suresh Gupta',
    phone: '+91 9111111111',
    address: 'Jaipur, Rajasthan',
    totalEarnings: 45000,
    totalPaid: 40000,
    status: 'active',
    joinDate: new Date('2023-06-01'),
  },
  {
    id: 'worker-2',
    code: 'W002',
    name: 'Neha Singh',
    phone: '+91 9222222222',
    address: 'Jaipur, Rajasthan',
    totalEarnings: 52000,
    totalPaid: 52000,
    status: 'active',
    joinDate: new Date('2023-05-15'),
  },
  {
    id: 'worker-3',
    code: 'W003',
    name: 'Arjun Reddy',
    phone: '+91 9333333333',
    address: 'Jaipur, Rajasthan',
    totalEarnings: 38000,
    totalPaid: 35000,
    status: 'active',
    joinDate: new Date('2023-08-20'),
  },
  {
    id: 'worker-4',
    code: 'W004',
    name: 'Meera Khanna',
    phone: '+91 9444444444',
    address: 'Jaipur, Rajasthan',
    totalEarnings: 48000,
    totalPaid: 48000,
    status: 'active',
    joinDate: new Date('2023-07-10'),
  },
  {
    id: 'worker-5',
    code: 'W005',
    name: 'Rajesh Yadav',
    phone: '+91 9555555555',
    address: 'Jaipur, Rajasthan',
    totalEarnings: 35000,
    totalPaid: 30000,
    status: 'inactive',
    joinDate: new Date('2023-04-01'),
  },
];

// Mock Worker Assignments
export const mockAssignments: WorkerAssignment[] = [
  {
    id: 'assign-1',
    workerId: 'worker-1',
    designId: 'design-1',
    designCode: 'D001',
    designName: 'Classic Pearl Necklace',
    issuedQty: 100,
    returnedQty: 95,
    rejectedQty: 2,
    issueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    expectedReturnDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    status: 'in_progress',
  },
  {
    id: 'assign-2',
    workerId: 'worker-2',
    designId: 'design-3',
    designCode: 'D003',
    designName: 'Elegant Bracelet',
    issuedQty: 80,
    returnedQty: 75,
    rejectedQty: 1,
    issueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    expectedReturnDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    status: 'in_progress',
  },
  {
    id: 'assign-3',
    workerId: 'worker-3',
    designId: 'design-4',
    designCode: 'D004',
    designName: 'Traditional Maang Tikka',
    issuedQty: 60,
    returnedQty: 58,
    rejectedQty: 0,
    issueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    expectedReturnDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    status: 'in_progress',
  },
  {
    id: 'assign-4',
    workerId: 'worker-4',
    designId: 'design-2',
    designCode: 'D002',
    designName: 'Modern Earring Pair',
    issuedQty: 120,
    returnedQty: 120,
    rejectedQty: 3,
    issueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    expectedReturnDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: 'completed',
  },
];

// Mock Finished Goods
export const mockFinishedGoods: FinishedGoodsEntry[] = [
  {
    id: 'fg-1',
    workerId: 'worker-1',
    workerName: 'Suresh Gupta',
    designId: 'design-1',
    designCode: 'D001',
    designName: 'Classic Pearl Necklace',
    quantity: 95,
    collectedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    quality: 'pass',
  },
  {
    id: 'fg-2',
    workerId: 'worker-2',
    workerName: 'Neha Singh',
    designId: 'design-3',
    designCode: 'D003',
    designName: 'Elegant Bracelet',
    quantity: 75,
    collectedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    quality: 'pass',
  },
];

// Mock Worker Payments
export const mockWorkerPayments: WorkerPayment[] = [
  {
    id: 'pay-1',
    workerId: 'worker-1',
    workerName: 'Suresh Gupta',
    workDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    amount: 4500,
    paymentDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    status: 'paid',
  },
  {
    id: 'pay-2',
    workerId: 'worker-2',
    workerName: 'Neha Singh',
    workDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    amount: 5200,
    paymentDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    status: 'paid',
  },
  {
    id: 'pay-3',
    workerId: 'worker-3',
    workerName: 'Arjun Reddy',
    workDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    amount: 3800,
    status: 'pending',
  },
];

// Mock Raw Materials
export const mockRawMaterials: RawMaterial[] = [
  {
    id: 'rm-1',
    code: 'RM001',
    type: 'Brass Wire',
    unitType: 'kg',
    currentStock: 450,
    threshold: 200,
    lastRestockDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    supplier: 'Prem Metals',
    costPerUnit: 280,
  },
  {
    id: 'rm-2',
    code: 'RM002',
    type: 'Artificial Pearls',
    unitType: 'pack',
    currentStock: 85,
    threshold: 100,
    lastRestockDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    supplier: 'Global Suppliers',
    costPerUnit: 450,
  },
  {
    id: 'rm-3',
    code: 'RM003',
    type: 'Gold Plating Solution',
    unitType: 'liter',
    currentStock: 12,
    threshold: 20,
    lastRestockDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    supplier: 'Chemical Works',
    costPerUnit: 2500,
  },
  {
    id: 'rm-4',
    code: 'RM004',
    type: 'Zirconia Stones',
    unitType: 'pack',
    currentStock: 200,
    threshold: 150,
    lastRestockDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    supplier: 'Stone House',
    costPerUnit: 1200,
  },
];

// Mock Inventory Items
export const mockInventoryItems: InventoryItem[] = [
  {
    id: 'inv-1',
    designId: 'design-1',
    designCode: 'D001',
    designName: 'Classic Pearl Necklace',
    unpackagedPieces: 120,
    packagedDozens: 15,
    lowStockThreshold: 50,
    lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 'inv-2',
    designId: 'design-2',
    designCode: 'D002',
    designName: 'Modern Earring Pair',
    unpackagedPieces: 30,
    packagedDozens: 8,
    lowStockThreshold: 60,
    lastUpdated: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
  {
    id: 'inv-3',
    designId: 'design-3',
    designCode: 'D003',
    designName: 'Elegant Bracelet',
    unpackagedPieces: 45,
    packagedDozens: 20,
    lowStockThreshold: 40,
    lastUpdated: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
];

// Mock Dealers
export const mockDealers: Dealer[] = [
  {
    id: 'dealer-1',
    code: 'DEL001',
    name: 'Sharma Jewellers',
    city: 'Delhi',
    phone: '+91 8111111111',
    gstNumber: '07AABCT1234A1Z0',
    creditLimit: 200000,
    creditPeriod: 30,
    outstanding: 45000,
    status: 'active',
    joinDate: new Date('2023-01-10'),
  },
  {
    id: 'dealer-2',
    code: 'DEL002',
    name: 'Gupta Fashion Store',
    city: 'Mumbai',
    phone: '+91 8222222222',
    gstNumber: '27AABCT5678B1Z0',
    creditLimit: 300000,
    creditPeriod: 45,
    outstanding: 0,
    status: 'active',
    joinDate: new Date('2023-02-15'),
  },
  {
    id: 'dealer-3',
    code: 'DEL003',
    name: 'Royal Collection',
    city: 'Bangalore',
    phone: '+91 8333333333',
    gstNumber: '29AABCT9012C1Z0',
    creditLimit: 250000,
    creditPeriod: 30,
    outstanding: 78000,
    status: 'active',
    joinDate: new Date('2023-03-20'),
  },
  {
    id: 'dealer-4',
    code: 'DEL004',
    name: 'Premier Exports',
    city: 'Chennai',
    phone: '+91 8444444444',
    gstNumber: '33AABCT3456D1Z0',
    creditLimit: 400000,
    creditPeriod: 60,
    outstanding: 125000,
    status: 'active',
    joinDate: new Date('2023-04-05'),
  },
];

// Mock Orders
export const mockOrders: Order[] = [
  {
    id: 'order-1',
    orderId: 'ORD001',
    dealerId: 'dealer-1',
    dealerName: 'Sharma Jewellers',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    items: [
      {
        designId: 'design-1',
        designCode: 'D001',
        designName: 'Classic Pearl Necklace',
        quantity: 24,
        unitPrice: 540,
        total: 12960,
      },
      {
        designId: 'design-2',
        designCode: 'D002',
        designName: 'Modern Earring Pair',
        quantity: 12,
        unitPrice: 336,
        total: 4032,
      },
    ],
    totalValue: 16992,
    paymentStatus: 'credit',
    orderStatus: 'dispatched',
  },
  {
    id: 'order-2',
    orderId: 'ORD002',
    dealerId: 'dealer-2',
    dealerName: 'Gupta Fashion Store',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    items: [
      {
        designId: 'design-3',
        designCode: 'D003',
        designName: 'Elegant Bracelet',
        quantity: 36,
        unitPrice: 780,
        total: 28080,
      },
    ],
    totalValue: 28080,
    paymentStatus: 'paid',
    orderStatus: 'packed',
  },
  {
    id: 'order-3',
    orderId: 'ORD003',
    dealerId: 'dealer-3',
    dealerName: 'Royal Collection',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    items: [
      {
        designId: 'design-4',
        designCode: 'D004',
        designName: 'Traditional Maang Tikka',
        quantity: 12,
        unitPrice: 1020,
        total: 12240,
      },
      {
        designId: 'design-5',
        designCode: 'D005',
        designName: 'Delicate Ring Set',
        quantity: 24,
        unitPrice: 420,
        total: 10080,
      },
    ],
    totalValue: 22320,
    paymentStatus: 'credit',
    orderStatus: 'confirmed',
  },
];

// Mock Dispatches
export const mockDispatches: Dispatch[] = [
  {
    id: 'dispatch-1',
    orderId: 'order-1',
    dealerId: 'dealer-1',
    dealerName: 'Sharma Jewellers',
    dispatchDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    trackerNumber: 'TRK001001',
    expectedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    status: 'in_transit',
  },
];

// Mock Invoices
export const mockInvoices: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV001',
    orderId: 'order-1',
    dealerId: 'dealer-1',
    dealerName: 'Sharma Jewellers',
    invoiceDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    amount: 16992,
    paidAmount: 0,
    status: 'overdue',
  },
  {
    id: 'inv-2',
    invoiceNumber: 'INV002',
    orderId: 'order-2',
    dealerId: 'dealer-2',
    dealerName: 'Gupta Fashion Store',
    invoiceDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
    amount: 28080,
    paidAmount: 28080,
    status: 'paid',
  },
];

// Mock Payment Records
export const mockPaymentRecords: PaymentRecord[] = [
  {
    id: 'payment-1',
    invoiceId: 'inv-2',
    dealerId: 'dealer-2',
    dealerName: 'Gupta Fashion Store',
    amount: 28080,
    paymentDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    paymentMethod: 'bank_transfer',
    referenceNumber: 'REF001',
  },
];

// Mock Dealer Ledgers
export const mockDealerLedgers: DealerLedger[] = [
  {
    dealerId: 'dealer-1',
    dealerName: 'Sharma Jewellers',
    totalInvoiced: 45000,
    totalPaid: 0,
    outstanding: 45000,
    lastTransaction: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    status: 'overdue',
  },
  {
    dealerId: 'dealer-2',
    dealerName: 'Gupta Fashion Store',
    totalInvoiced: 28080,
    totalPaid: 28080,
    outstanding: 0,
    lastTransaction: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    status: 'good',
  },
  {
    dealerId: 'dealer-3',
    dealerName: 'Royal Collection',
    totalInvoiced: 78000,
    totalPaid: 0,
    outstanding: 78000,
    lastTransaction: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    status: 'warning',
  },
];

// Mock Dashboard Alerts
export const mockDashboardAlerts: DashboardAlert[] = [
  {
    id: 'alert-1',
    type: 'inventory',
    title: 'Low Stock Warning',
    message: 'Gold Plating Solution stock is below threshold',
    severity: 'warning',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    actionUrl: '/dashboard/raw-materials',
  },
  {
    id: 'alert-2',
    type: 'payment',
    title: 'Overdue Payment',
    message: 'Sharma Jewellers payment is overdue by 5 days',
    severity: 'error',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
    actionUrl: '/dashboard/payments-ledger',
  },
  {
    id: 'alert-3',
    type: 'order',
    title: 'Order Dispatched',
    message: 'Order ORD001 has been dispatched successfully',
    severity: 'info',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
    actionUrl: '/dashboard/orders-dispatch',
  },
];

// =============================================================
// RBAC MOCKS (Removed - Using Backend API)
// =============================================================
export const mockPermissions: Permission[] = [];
export const mockRoles: Role[] = [];
export const mockWorkflowTemplates: WorkflowTemplate[] = [];
export const mockApprovals: Approval[] = [];
export const mockAuditLogs: AuditLog[] = [];
