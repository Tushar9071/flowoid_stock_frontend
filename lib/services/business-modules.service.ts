import { api } from '../api-client';
import {
  asItemResponse,
  asListResponse,
  BackendRecord,
  buildQuery,
  PaginatedResponse,
  QueryParams,
  responseItems,
} from './api-normalizers';

const owner = (path: string) => `/owner${path}`;
const fileUrl = (path: string) => `/api${owner(path)}`;

function omitKeys(data: BackendRecord = {}, keys: string[]) {
  const blocked = new Set(keys);
  return Object.fromEntries(Object.entries(data).filter(([key, value]) => !blocked.has(key) && value !== undefined && value !== ''));
}

function normalizeStatusQuery(query: QueryParams = {}) {
  const payload: BackendRecord = { ...query };
  if (typeof payload.isActive === 'boolean' && !payload.status) payload.status = payload.isActive ? 'ACTIVE' : 'INACTIVE';
  delete payload.isActive;
  return payload;
}

function normalizeInventoryAdjustment(data: BackendRecord = {}, designId?: string) {
  const adj = Number(data.adjustment || data.quantity || data.pieces || 0);
  const type = String(data.adjustmentType || data.type || (adj < 0 ? 'DECREASE' : 'INCREASE')).toUpperCase();
  return {
    designId: data.designId || designId,
    adjustmentType: type === 'OUT' || type === 'DECREASE' || adj < 0 ? 'DECREASE' : 'INCREASE',
    quantity: Math.abs(adj),
    reason: data.reason || data.notes || 'Manual stock adjustment',
  };
}

function normalizePackagingPayload(data: BackendRecord = {}) {
  return {
    designId: data.designId,
    quantity: Number(data.quantity || data.dozensPackaged || data.dozens || 0),
    packedDate: data.packedDate || data.packagedAt,
    packedByWorkerId: data.packedByWorkerId || data.workerId || undefined,
    notes: data.notes || undefined,
  };
}

function normalizePaymentPayload(data: BackendRecord = {}, fallbackNature?: string) {
  const method = String(data.paymentMethod || data.method || 'CASH').toUpperCase();
  return omitKeys({
    ...data,
    paymentNature: data.paymentNature || data.nature || fallbackNature,
    paymentMethod: method,
    paymentDate: data.paymentDate || data.date,
    amount: Number(data.amount || 0),
    referenceNumber: data.referenceNumber || data.referenceNo || data.chequeNumber,
    status: data.status || data.paymentStatus,
  }, ['nature', 'method', 'date', 'referenceNo', 'chequeNumber', 'paymentStatus']);
}

function normalizePaymentQuery(query: QueryParams = {}) {
  const payload: BackendRecord = { ...query };
  if (payload.nature && !payload.paymentNature) payload.paymentNature = payload.nature;
  if (payload.method && !payload.paymentMethod) payload.paymentMethod = payload.method;
  if (payload.dateFrom && !payload.from) payload.from = payload.dateFrom;
  if (payload.dateTo && !payload.to) payload.to = payload.dateTo;
  delete payload.nature;
  delete payload.method;
  delete payload.dateFrom;
  delete payload.dateTo;
  return payload;
}

function normalizeDatedQuery(query: QueryParams = {}) {
  const payload: BackendRecord = { ...query };
  if (payload.dateFrom && !payload.from) payload.from = payload.dateFrom;
  if (payload.dateTo && !payload.to) payload.to = payload.dateTo;
  delete payload.dateFrom;
  delete payload.dateTo;
  return payload;
}

function normalizeOrderPayload(data: BackendRecord = {}) {
  return omitKeys({
    ...data,
    partyId: data.partyId || data.dealerId,
    orderDate: data.orderDate || data.date,
    discount: Number(data.discount ?? data.discountAmount ?? 0),
    items: Array.isArray(data.items) ? data.items.map(normalizeOrderItemPayload) : data.items,
  }, ['dealerId', 'date', 'status', 'orderNumber', 'subtotal', 'totalAmount', 'discountAmount', 'isCreditOrder']);
}

function normalizeOrderItemPayload(data: BackendRecord = {}) {
  return omitKeys({
    ...data,
    designId: data.designId,
    quantity: Number(data.quantity ?? data.quantityDozens ?? 0),
    rate: Number(data.rate ?? data.unitPrice ?? data.pricePerDozen ?? 0),
    discountPercent: Number(data.discountPercent || 0),
    taxPercent: Number(data.taxPercent || 0),
  }, ['unitPrice', 'pricePerDozen', 'quantityDozens', 'lineTotal', 'total']);
}

function normalizeDispatchPayload(data: BackendRecord = {}) {
  return omitKeys({
    ...data,
    dispatchDate: data.dispatchDate || data.dispatchedAt || data.date,
    transportDetails: data.transportDetails || data.transportMode || data.transport,
    vehicleNumber: data.vehicleNumber || data.trackingRef,
    items: Array.isArray(data.items)
      ? data.items.map((item: BackendRecord) => ({
          orderItemId: item.orderItemId || item.id,
          quantityDispatched: Number(item.quantityDispatched || item.pendingQty || item.quantity || 0),
        }))
      : data.items,
  }, ['date', 'transport', 'transportMode', 'trackingRef', 'dispatchedAt', 'challanNumber']);
}

export type { BackendRecord, PaginatedResponse, QueryParams };
export { responseItems };

export const DesignService = {
  async listCategories(_tenantId: string, query: QueryParams = {}) {
    return asListResponse(await api.get(owner(`/design-categories${buildQuery(normalizeStatusQuery(query))}`)), 'categories');
  },
  async createCategory(_tenantId: string, data: BackendRecord) {
    return asItemResponse(await api.post(owner('/design-categories'), data), 'category');
  },
  async getCategory(_tenantId: string, id: string) {
    return asItemResponse(await api.get(owner(`/design-categories/${id}`)), 'category');
  },
  async updateCategory(_tenantId: string, id: string, data: BackendRecord) {
    return asItemResponse(await api.put(owner(`/design-categories/${id}`), data), 'category');
  },
  async deleteCategory(_tenantId: string, id: string) {
    return asItemResponse(await api.delete(owner(`/design-categories/${id}`)), 'category');
  },
  async list(_tenantId: string, query: QueryParams = {}) {
    return asListResponse(await api.get(owner(`/designs${buildQuery(normalizeStatusQuery(query))}`)), 'designs');
  },
  async create(_tenantId: string, data: BackendRecord | FormData) {
    return asItemResponse(await api.post(owner('/designs'), data), 'design');
  },
  async getById(_tenantId: string, id: string) {
    return asItemResponse(await api.get(owner(`/designs/${id}`)), 'design');
  },
  async update(_tenantId: string, id: string, data: BackendRecord) {
    return asItemResponse(await api.put(owner(`/designs/${id}`), omitKeys(data, ['code', 'status', 'images'])), 'design');
  },
  async delete(_tenantId: string, id: string) {
    return asItemResponse(await api.patch(owner(`/designs/${id}/status`), { status: 'INACTIVE' }), 'design');
  },
  async updateStatus(_tenantId: string, id: string, data: { status: string }) {
    return asItemResponse(await api.patch(owner(`/designs/${id}/status`), data), 'design');
  },
  async listSupplementaryNeeds(_tenantId: string, id: string) {
    return asListResponse(await api.get(owner(`/designs/${id}/supplementary-materials`)), 'materials');
  },
  async addSupplementaryNeed(_tenantId: string, id: string, data: BackendRecord) {
    return asItemResponse(await api.post(owner(`/designs/${id}/supplementary-materials`), data), 'material');
  },
  async updateSupplementaryNeed(_tenantId: string, id: string, needId: string, data: BackendRecord) {
    return asItemResponse(await api.put(owner(`/designs/${id}/supplementary-materials/${needId}`), data), 'material');
  },
  async deleteSupplementaryNeed(_tenantId: string, id: string, needId: string) {
    return asItemResponse(await api.delete(owner(`/designs/${id}/supplementary-materials/${needId}`)), 'material');
  },
  async uploadImages(_tenantId: string, id: string, data: FormData | BackendRecord) {
    return asListResponse(await api.post(owner(`/designs/${id}/images`), data), 'images');
  },
  async updateImage(_tenantId: string, id: string, imageId: string, data: BackendRecord) {
    return asItemResponse(await api.patch(owner(`/designs/${id}/images/${imageId}`), data), 'image');
  },
  async reorderImages(_tenantId: string, id: string, orderedIds: string[]) {
    return asListResponse(await api.post(owner(`/designs/${id}/images/reorder`), { orderedIds }), 'images');
  },
  async deleteImage(_tenantId: string, id: string, imageId: string) {
    return asItemResponse(await api.delete(owner(`/designs/${id}/images/${imageId}`)), 'image');
  },
};

export const SupplementaryService = {
  async list(_tenantId: string, query: QueryParams = {}) {
    return asListResponse(await api.get(owner(`/raw-material-types${buildQuery(query)}`)), 'types');
  },
  async create(_tenantId: string, data: BackendRecord) {
    return asItemResponse(await api.post(owner('/raw-material-types'), data), 'type');
  },
  async getById(_tenantId: string, id: string) {
    return asItemResponse(await api.get(owner(`/raw-materials/stock/${id}`)), 'stock');
  },
  async update(_tenantId: string, id: string, data: BackendRecord) {
    return asItemResponse(await api.put(owner(`/raw-material-types/${id}`), data), 'type');
  },
  async delete(_tenantId: string, id: string) {
    return asItemResponse(await api.patch(owner(`/raw-material-types/${id}/status`), { status: 'INACTIVE' }), 'type');
  },
  async adjustStock(_tenantId: string, id: string, data: BackendRecord) {
    return asItemResponse(await api.post(owner('/inventory/adjustments'), { ...data, rawMaterialTypeId: id }), 'adjustment');
  },
};

export const WorkerService = {
  async list(_tenantId: string, query: QueryParams = {}) {
    return asListResponse(await api.get(owner(`/workers${buildQuery(normalizeStatusQuery(query))}`)), 'workers');
  },
  async create(_tenantId: string, data: BackendRecord) {
    return asItemResponse(await api.post(owner('/workers'), omitKeys(data, ['isActive'])), 'worker');
  },
  async getById(_tenantId: string, id: string) {
    return asItemResponse(await api.get(owner(`/workers/${id}`)), 'worker');
  },
  async update(_tenantId: string, id: string, data: BackendRecord) {
    return asItemResponse(await api.put(owner(`/workers/${id}`), omitKeys(data, ['status', 'isActive'])), 'worker');
  },
  async delete(_tenantId: string, id: string) {
    return asItemResponse(await api.patch(owner(`/workers/${id}/status`), { status: 'INACTIVE' }), 'worker');
  },
  async listAssignments(_tenantId: string, id: string, query: QueryParams = {}) {
    return asListResponse(await api.get(owner(`/workers/${id}/assignments${buildQuery(query)}`)), 'assignments');
  },
  async listPaymentsForWorker(_tenantId: string, id: string, query: QueryParams = {}) {
    return asListResponse(await api.get(owner(`/workers/${id}/payments${buildQuery(query)}`)), 'payments');
  },
  async ledger(_tenantId: string, id: string) {
    const response = await api.get<any>(owner(`/workers/${id}/ledger`));
    return response.success
      ? { ...response, data: { entries: response.data?.ledger || [], currentBalance: response.data?.currentBalance, meta: response.meta } }
      : response as any;
  },
  async listPayments(_tenantId: string, query: QueryParams = {}) {
    return asListResponse(await api.get(owner(`/worker-payments${buildQuery(query)}`)), 'payments');
  },
  async createPayment(_tenantId: string, data: BackendRecord) {
    return asItemResponse(await api.post(owner('/worker-payments'), data), 'payment');
  },
  async getPayment(_tenantId: string, paymentId: string) {
    return asItemResponse(await api.get(owner(`/worker-payments/${paymentId}`)), 'payment');
  },
};

export const AssignmentService = {
  async list(_tenantId: string, query: QueryParams = {}) {
    return asListResponse(await api.get(owner(`/assignments${buildQuery(query)}`)), 'assignments');
  },
  async create(_tenantId: string, data: BackendRecord) {
    return asItemResponse(await api.post(owner('/assignments'), data), 'assignment');
  },
  async getById(_tenantId: string, id: string) {
    return asItemResponse(await api.get(owner(`/assignments/${id}`)), 'assignment');
  },
  // Note: backend has no PUT /assignments/:id — only updateable via close/status transitions
  async update(_tenantId: string, id: string, _data: BackendRecord) {
    return asItemResponse(await api.get(owner(`/assignments/${id}`)), 'assignment');
  },
  async updateStatus(_tenantId: string, id: string, data: BackendRecord) {
    const status = String(data.status || '').toUpperCase();
    if (status === 'CLOSED') return this.close(_tenantId, id, data);
    // No direct status update endpoint — return current state
    return asItemResponse(await api.get(owner(`/assignments/${id}`)), 'assignment');
  },
  async close(_tenantId: string, id: string, data: BackendRecord = {}) {
    return asItemResponse(await api.patch(owner(`/assignments/${id}/close`), { force: Boolean(data.force) }), 'assignment');
  },
  // Global goods-returns listing = list assignments (returns are nested per assignment)
  async listGoodsReturns(_tenantId: string, query: QueryParams = {}) {
    return asListResponse(await api.get(owner(`/assignments${buildQuery(query)}`)), 'assignments');
  },
  async getGoodsReturn(_tenantId: string, returnId: string) {
    return asItemResponse(await api.get(owner(`/assignments/${returnId}`)), 'assignment');
  },
  // List goods returns (pieces) for a specific assignment
  async listReturnsForAssignment(_tenantId: string, id: string) {
    return asListResponse(await api.get(owner(`/assignments/${id}/returns`)), 'returns');
  },
  // Record a goods/pieces return for an assignment: POST /assignments/:id/returns
  async recordReturn(_tenantId: string, id: string, data: BackendRecord) {
    return asItemResponse(await api.post(owner(`/assignments/${id}/returns`), data), 'return');
  },
  // Record raw material return from worker: POST /assignments/:id/material-returns
  async recordMaterialReturn(_tenantId: string, id: string, data: BackendRecord) {
    return asItemResponse(await api.post(owner(`/assignments/${id}/material-returns`), data), 'materialReturn');
  },
};

export const InventoryService = {
  async listStock(_tenantId: string, query: QueryParams = {}) {
    const response = await api.get(owner(`/inventory${buildQuery(query)}`));
    const normalized = asListResponse<BackendRecord>(response, 'inventory');
    const lowStockThreshold = normalized.meta?.lowStockThreshold;
    if (normalized.success && lowStockThreshold !== undefined) {
      normalized.data.items = normalized.data.items.map(item => ({
        ...item,
        lowStockThreshold
      }));
    }
    return normalized;
  },
  async getStock(_tenantId: string, designId: string) {
    return asItemResponse(await api.get(owner(`/inventory/${designId}`)), 'inventory');
  },
  async getStockAvailability(_tenantId: string, designId: string) {
    return asItemResponse(await api.get(owner(`/inventory/${designId}/stock`)), 'stock');
  },
  async listPackagingBatches(_tenantId: string, query: QueryParams = {}) {
    return asListResponse(await api.get(owner(`/inventory/packaging${buildQuery(query)}`)), 'batches');
  },
  async createPackagingBatch(_tenantId: string, data: BackendRecord) {
    return asItemResponse(await api.post(owner('/inventory/packaging'), normalizePackagingPayload(data)), 'batch');
  },
  async getPackagingBatch(_tenantId: string, batchId: string) {
    return asItemResponse(await api.get(owner(`/inventory/packaging/${batchId}`)), 'batch');
  },
  async createAdjustment(_tenantId: string, designId: string, data: BackendRecord) {
    return asItemResponse(await api.post(owner('/inventory/adjustments'), normalizeInventoryAdjustment(data, designId)), 'adjustment');
  },
  async listAdjustments(_tenantId: string, query: QueryParams = {}) {
    return asListResponse(await api.get(owner(`/inventory/adjustments${buildQuery(query)}`)), 'adjustments');
  },

  async listLowStockAlerts(_tenantId: string, query: QueryParams = {}) {
    const response = await api.get(owner(`/inventory${buildQuery({ ...query, lowStock: true })}`));
    const normalized = asListResponse<BackendRecord>(response, 'inventory');
    const lowStockThreshold = normalized.meta?.lowStockThreshold;
    if (normalized.success && lowStockThreshold !== undefined) {
      normalized.data.items = normalized.data.items.map(item => ({
        ...item,
        lowStockThreshold
      }));
    }
    return normalized;
  },
  // Backend has no update endpoint for low-stock alerts — read-only
  async updateLowStockAlert(_tenantId: string, designId: string, _data: BackendRecord) {
    return asItemResponse(await api.get(owner(`/inventory/${designId}`)), 'inventory');
  },
};

export const OrderService = {
  async list(_tenantId: string, query: QueryParams = {}) {
    return asListResponse(await api.get(owner(`/orders${buildQuery(query)}`)), 'orders');
  },
  async create(_tenantId: string, data: BackendRecord) {
    return asItemResponse(await api.post(owner('/orders'), normalizeOrderPayload(data)), 'order');
  },
  async overdue(_tenantId: string, query: QueryParams = {}) {
    return asListResponse(await api.get(owner(`/orders${buildQuery(query)}`)), 'orders');
  },
  async getDispatchSummary(_tenantId: string, orderId: string) {
    return asItemResponse(await api.get(owner(`/orders/${orderId}/dispatches`)), 'dispatches');
  },
  async getById(_tenantId: string, orderId: string) {
    return asItemResponse(await api.get(owner(`/orders/${orderId}`)), 'order');
  },
  async update(_tenantId: string, orderId: string, data: BackendRecord) {
    return asItemResponse(await api.put(owner(`/orders/${orderId}`), normalizeOrderPayload(data)), 'order');
  },
  async confirm(_tenantId: string, orderId: string) {
    return asItemResponse(await api.patch(owner(`/orders/${orderId}/confirm`), {}), 'order');
  },
  async pack(_tenantId: string, orderId: string) {
    return asItemResponse(await api.patch(owner(`/orders/${orderId}/pack`), {}), 'order');
  },
  async dispatch(_tenantId: string, orderId: string, data: BackendRecord) {
    return asItemResponse(await api.post(owner(`/orders/${orderId}/dispatches`), normalizeDispatchPayload(data)), 'dispatch');
  },
  async cancel(_tenantId: string, orderId: string, data: BackendRecord = {}) {
    return asItemResponse(await api.patch(owner(`/orders/${orderId}/cancel`), data), 'order');
  },
  async addItem(_tenantId: string, orderId: string, data: BackendRecord) {
    return asItemResponse(await api.post(owner(`/orders/${orderId}/items`), normalizeOrderItemPayload(data)), 'totals');
  },
  async updateItem(_tenantId: string, orderId: string, itemId: string, data: BackendRecord) {
    return asItemResponse(await api.put(owner(`/orders/${orderId}/items/${itemId}`), normalizeOrderItemPayload(data)), 'totals');
  },
  async deleteItem(_tenantId: string, orderId: string, itemId: string) {
    return asItemResponse(await api.delete(owner(`/orders/${orderId}/items/${itemId}`)), 'totals');
  },
  // Global dispatch history: GET /dispatches and GET /dispatches/:id
  async listDispatches(_tenantId: string, query: QueryParams = {}) {
    return asListResponse(await api.get(owner(`/dispatches${buildQuery(query)}`)), 'dispatches');
  },
  async getDispatch(_tenantId: string, dispatchId: string) {
    return asItemResponse(await api.get(owner(`/dispatches/${dispatchId}`)), 'dispatch');
  },
};

export const PaymentService = {
  async list(_tenantId: string, query: QueryParams = {}) {
    return asListResponse(await api.get(owner(`/payments${buildQuery(normalizePaymentQuery(query))}`)), 'payments');
  },

  async partyOutstanding(_tenantId: string, partyId: string) {
    return asItemResponse(await api.get(owner(`/parties/${partyId}/balance`)), 'balance');
  },
  async createDealerPayment(_tenantId: string, data: BackendRecord) {
    return asItemResponse(await api.post(owner('/payments'), normalizePaymentPayload(data, 'DEALER_RECEIPT')), 'payment');
  },
  async createSupplierPayment(_tenantId: string, data: BackendRecord) {
    return asItemResponse(await api.post(owner('/payments'), normalizePaymentPayload(data, 'SUPPLIER_PAYMENT')), 'payment');
  },
  async updateStatus(_tenantId: string, paymentId: string, data: BackendRecord) {
    const status = String(data.paymentStatus || data.status).toUpperCase();
    if (status === 'CANCELLED' || status === 'CANCELLED_BY_USER') {
      return asItemResponse(await api.patch(owner(`/payments/${paymentId}/cancel`), data), 'payment');
    }
    if (status === 'CLEARED') return asItemResponse(await api.patch(owner(`/payments/${paymentId}/clear`), {}), 'payment');
    if (status === 'BOUNCED') return asItemResponse(await api.patch(owner(`/payments/${paymentId}/bounce`), {}), 'payment');
    return asItemResponse(await api.get(owner(`/payments/${paymentId}`)), 'payment');
  },
  async getById(_tenantId: string, paymentId: string) {
    return asItemResponse(await api.get(owner(`/payments/${paymentId}`)), 'payment');
  },
  async allocations(_tenantId: string, paymentId: string) {
    return asListResponse(await api.get(owner(`/payments/${paymentId}/allocations`)), 'allocations');
  },
  async allocate(_tenantId: string, paymentId: string, allocations: BackendRecord[]) {
    return asItemResponse(await api.post(owner(`/payments/${paymentId}/allocate`), { allocations }), 'payment');
  },
  async deleteAllocation(_tenantId: string, paymentId: string, allocationId: string) {
    return asItemResponse(await api.delete(owner(`/payments/${paymentId}/allocations/${allocationId}`)), 'allocation');
  },
  async ledger(_tenantId: string, query: QueryParams = {}) {
    return asListResponse(await api.get(owner(`/ledger${buildQuery(query)}`)), 'ledger');
  },
  async ledgerReceivables(_tenantId: string, query: QueryParams = {}) {
    return asListResponse(await api.get(owner(`/ledger/receivables${buildQuery(query)}`)), 'receivables');
  },
  async ledgerPayables(_tenantId: string, query: QueryParams = {}) {
    return asListResponse(await api.get(owner(`/ledger/payables${buildQuery(query)}`)), 'payables');
  },
};

// ─── Report Service ──────────────────────────────────────────────────────────
// Backend report routes (all under GET /owner/reports/*):
//   ledger-aging        → required: fromDate, toDate, partyType (DEALER|SUPPLIER)
//   stock-movement      → required: fromDate, toDate; optional: materialId
//   worker-productivity → required: fromDate, toDate; optional: workerId
//   sales-summary       → required: fromDate, toDate; optional: partyId, groupBy (day|week|month)
//   payment-collection  → required: fromDate, toDate; optional: partyType
//   inventory-valuation → no params required
export const ReportService = {
  async ledgerAging(_tenantId: string, query: QueryParams) {
    return asItemResponse(await api.get(owner(`/reports/ledger-aging${buildQuery(query)}`)), 'data');
  },
  async stockMovement(_tenantId: string, query: QueryParams) {
    return asItemResponse(await api.get(owner(`/reports/stock-movement${buildQuery(query)}`)), 'data');
  },
  async workerProductivity(_tenantId: string, query: QueryParams) {
    return asItemResponse(await api.get(owner(`/reports/worker-productivity${buildQuery(query)}`)), 'data');
  },
  async salesSummary(_tenantId: string, query: QueryParams) {
    return asItemResponse(await api.get(owner(`/reports/sales-summary${buildQuery(query)}`)), 'data');
  },
  async paymentCollection(_tenantId: string, query: QueryParams) {
    return asItemResponse(await api.get(owner(`/reports/payment-collection${buildQuery(query)}`)), 'data');
  },
  async inventoryValuation(_tenantId: string, query: QueryParams = {}) {
    return asItemResponse(await api.get(owner(`/reports/inventory-valuation${buildQuery(query)}`)), 'data');
  },
};

export const DocumentService = {
  orderInvoiceUrl(_tenantId: string, orderId: string) {
    return fileUrl(`/orders/${orderId}/invoice`);
  },
  orderChallanUrl(_tenantId: string, orderId: string) {
    return fileUrl(`/orders/${orderId}/challan`);
  },
  paymentReceiptUrl(_tenantId: string, paymentId: string) {
    return fileUrl(`/payments/${paymentId}/receipt`);
  },
};
