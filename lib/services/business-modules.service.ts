import { api } from '../api-client';

export type QueryValue = string | number | boolean | undefined | null;
export type QueryParams = Record<string, QueryValue>;
export type PaginatedResponse<T> = {
  items: T[];
  pagination?: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };
};

export type BackendRecord = Record<string, any>;

export function responseItems<T = BackendRecord>(payload: T[] | PaginatedResponse<T> | BackendRecord | null | undefined): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray((payload as PaginatedResponse<T>).items)) return (payload as PaginatedResponse<T>).items;
  if (Array.isArray((payload as BackendRecord).data)) return (payload as BackendRecord).data;
  if (Array.isArray((payload as BackendRecord).items)) return (payload as BackendRecord).items;
  return [];
}

function buildQuery(params: QueryParams = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    query.set(key, String(value));
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

function tenantBase(tenantId: string, path: string) {
  return `/tenants/${tenantId}${path}`;
}

export const DesignService = {
  listCategories(tenantId: string, query: QueryParams = {}) {
    return api.get<PaginatedResponse<BackendRecord> | BackendRecord[]>(
      tenantBase(tenantId, `/designs/categories${buildQuery(query)}`)
    );
  },
  createCategory(tenantId: string, data: BackendRecord) {
    return api.post<BackendRecord>(tenantBase(tenantId, '/designs/categories'), data);
  },
  getCategory(tenantId: string, id: string) {
    return api.get<BackendRecord>(tenantBase(tenantId, `/designs/categories/${id}`));
  },
  updateCategory(tenantId: string, id: string, data: BackendRecord) {
    return api.patch<BackendRecord>(tenantBase(tenantId, `/designs/categories/${id}`), data);
  },
  deleteCategory(tenantId: string, id: string) {
    return api.delete<{ message: string }>(tenantBase(tenantId, `/designs/categories/${id}`));
  },
  list(tenantId: string, query: QueryParams = {}) {
    return api.get<PaginatedResponse<BackendRecord>>(tenantBase(tenantId, `/designs${buildQuery(query)}`));
  },
  create(tenantId: string, data: BackendRecord) {
    return api.post<BackendRecord>(tenantBase(tenantId, '/designs'), data);
  },
  getById(tenantId: string, id: string) {
    return api.get<BackendRecord>(tenantBase(tenantId, `/designs/${id}`));
  },
  update(tenantId: string, id: string, data: BackendRecord) {
    return api.patch<BackendRecord>(tenantBase(tenantId, `/designs/${id}`), data);
  },
  delete(tenantId: string, id: string) {
    return api.delete<{ message: string }>(tenantBase(tenantId, `/designs/${id}`));
  },
  updateStatus(tenantId: string, id: string, data: { status: string }) {
    return api.patch<BackendRecord>(tenantBase(tenantId, `/designs/${id}/status`), data);
  },
  listSupplementaryNeeds(tenantId: string, id: string) {
    return api.get<BackendRecord[]>(tenantBase(tenantId, `/designs/${id}/supplementary-needs`));
  },
  addSupplementaryNeed(tenantId: string, id: string, data: BackendRecord) {
    return api.post<BackendRecord>(tenantBase(tenantId, `/designs/${id}/supplementary-needs`), data);
  },
  updateSupplementaryNeed(tenantId: string, id: string, needId: string, data: BackendRecord) {
    return api.patch<BackendRecord>(tenantBase(tenantId, `/designs/${id}/supplementary-needs/${needId}`), data);
  },
  deleteSupplementaryNeed(tenantId: string, id: string, needId: string) {
    return api.delete<{ message: string }>(tenantBase(tenantId, `/designs/${id}/supplementary-needs/${needId}`));
  },
};

export const SupplementaryService = {
  list(tenantId: string, query: QueryParams = {}) {
    return api.get<PaginatedResponse<BackendRecord>>(tenantBase(tenantId, `/supplementary${buildQuery(query)}`));
  },
  create(tenantId: string, data: BackendRecord) {
    return api.post<BackendRecord>(tenantBase(tenantId, '/supplementary'), data);
  },
  getById(tenantId: string, id: string) {
    return api.get<BackendRecord>(tenantBase(tenantId, `/supplementary/${id}`));
  },
  update(tenantId: string, id: string, data: BackendRecord) {
    return api.patch<BackendRecord>(tenantBase(tenantId, `/supplementary/${id}`), data);
  },
  delete(tenantId: string, id: string) {
    return api.delete<{ message: string }>(tenantBase(tenantId, `/supplementary/${id}`));
  },
  adjustStock(tenantId: string, id: string, data: BackendRecord) {
    return api.patch<BackendRecord>(tenantBase(tenantId, `/supplementary/${id}/stock`), data);
  },
};

export const WorkerService = {
  list(tenantId: string, query: QueryParams = {}) {
    return api.get<PaginatedResponse<BackendRecord>>(tenantBase(tenantId, `/workers${buildQuery(query)}`));
  },
  create(tenantId: string, data: BackendRecord) {
    return api.post<BackendRecord>(tenantBase(tenantId, '/workers'), data);
  },
  getById(tenantId: string, id: string) {
    return api.get<BackendRecord>(tenantBase(tenantId, `/workers/${id}`));
  },
  update(tenantId: string, id: string, data: BackendRecord) {
    return api.patch<BackendRecord>(tenantBase(tenantId, `/workers/${id}`), data);
  },
  delete(tenantId: string, id: string) {
    return api.delete<{ message: string }>(tenantBase(tenantId, `/workers/${id}`));
  },
  listAssignments(tenantId: string, id: string, query: QueryParams = {}) {
    return api.get<PaginatedResponse<BackendRecord>>(tenantBase(tenantId, `/workers/${id}/assignments${buildQuery(query)}`));
  },
  listPaymentsForWorker(tenantId: string, id: string, query: QueryParams = {}) {
    return api.get<PaginatedResponse<BackendRecord>>(tenantBase(tenantId, `/workers/${id}/payments${buildQuery(query)}`));
  },
  ledger(tenantId: string, id: string, query: QueryParams = {}) {
    return api.get<BackendRecord>(tenantBase(tenantId, `/workers/${id}/ledger${buildQuery(query)}`));
  },
  listPayments(tenantId: string, query: QueryParams = {}) {
    return api.get<PaginatedResponse<BackendRecord>>(tenantBase(tenantId, `/workers/payments${buildQuery(query)}`));
  },
  createPayment(tenantId: string, data: BackendRecord) {
    return api.post<BackendRecord>(tenantBase(tenantId, '/workers/payments'), data);
  },
  getPayment(tenantId: string, paymentId: string) {
    return api.get<BackendRecord>(tenantBase(tenantId, `/workers/payments/${paymentId}`));
  },
};

export const AssignmentService = {
  list(tenantId: string, query: QueryParams = {}) {
    return api.get<PaginatedResponse<BackendRecord>>(tenantBase(tenantId, `/assignments${buildQuery(query)}`));
  },
  create(tenantId: string, data: BackendRecord) {
    return api.post<BackendRecord>(tenantBase(tenantId, '/assignments'), data);
  },
  getById(tenantId: string, id: string) {
    return api.get<BackendRecord>(tenantBase(tenantId, `/assignments/${id}`));
  },
  update(tenantId: string, id: string, data: BackendRecord) {
    return api.patch<BackendRecord>(tenantBase(tenantId, `/assignments/${id}`), data);
  },
  updateStatus(tenantId: string, id: string, data: BackendRecord) {
    return api.patch<BackendRecord>(tenantBase(tenantId, `/assignments/${id}/status`), data);
  },
  close(tenantId: string, id: string, data: BackendRecord = {}) {
    return api.patch<BackendRecord>(tenantBase(tenantId, `/assignments/${id}/close`), data);
  },
  listGoodsReturns(tenantId: string, query: QueryParams = {}) {
    return api.get<PaginatedResponse<BackendRecord>>(tenantBase(tenantId, `/assignments/goods-returns${buildQuery(query)}`));
  },
  getGoodsReturn(tenantId: string, returnId: string) {
    return api.get<BackendRecord>(tenantBase(tenantId, `/assignments/goods-returns/${returnId}`));
  },
  listReturnsForAssignment(tenantId: string, id: string) {
    return api.get<BackendRecord[]>(tenantBase(tenantId, `/assignments/${id}/returns`));
  },
  recordReturn(tenantId: string, id: string, data: BackendRecord) {
    return api.post<BackendRecord>(tenantBase(tenantId, `/assignments/${id}/returns`), data);
  },
};

export const InventoryService = {
  listStock(tenantId: string, query: QueryParams = {}) {
    return api.get<PaginatedResponse<BackendRecord>>(tenantBase(tenantId, `/inventory/stock${buildQuery(query)}`));
  },
  getStock(tenantId: string, designId: string) {
    return api.get<BackendRecord>(tenantBase(tenantId, `/inventory/stock/${designId}`));
  },
  listPackagingBatches(tenantId: string, query: QueryParams = {}) {
    return api.get<PaginatedResponse<BackendRecord>>(tenantBase(tenantId, `/inventory/packaging${buildQuery(query)}`));
  },
  createPackagingBatch(tenantId: string, data: BackendRecord) {
    return api.post<BackendRecord>(tenantBase(tenantId, '/inventory/packaging'), data);
  },
  getPackagingBatch(tenantId: string, batchId: string) {
    return api.get<BackendRecord>(tenantBase(tenantId, `/inventory/packaging/${batchId}`));
  },
  createAdjustment(tenantId: string, designId: string, data: BackendRecord) {
    return api.post<BackendRecord>(tenantBase(tenantId, `/inventory/stock/${designId}/adjustment`), data);
  },
  listLowStockAlerts(tenantId: string, query: QueryParams = {}) {
    return api.get<PaginatedResponse<BackendRecord>>(tenantBase(tenantId, `/inventory/stock/alerts${buildQuery(query)}`));
  },
  updateLowStockAlert(tenantId: string, designId: string, data: BackendRecord) {
    return api.patch<BackendRecord>(tenantBase(tenantId, `/inventory/stock/${designId}/alert`), data);
  },
};

export const OrderService = {
  list(tenantId: string, query: QueryParams = {}) {
    return api.get<PaginatedResponse<BackendRecord>>(tenantBase(tenantId, `/orders${buildQuery(query)}`));
  },
  create(tenantId: string, data: BackendRecord) {
    return api.post<BackendRecord>(tenantBase(tenantId, '/orders'), data);
  },
  overdue(tenantId: string, query: QueryParams = {}) {
    return api.get<PaginatedResponse<BackendRecord> | BackendRecord[]>(tenantBase(tenantId, `/orders/overdue${buildQuery(query)}`));
  },
  getDispatchSummary(tenantId: string, orderId: string) {
    return api.get<BackendRecord>(tenantBase(tenantId, `/orders/${orderId}/dispatch-summary`));
  },
  getById(tenantId: string, orderId: string) {
    return api.get<BackendRecord>(tenantBase(tenantId, `/orders/${orderId}`));
  },
  update(tenantId: string, orderId: string, data: BackendRecord) {
    return api.patch<BackendRecord>(tenantBase(tenantId, `/orders/${orderId}`), data);
  },
  confirm(tenantId: string, orderId: string) {
    return api.patch<BackendRecord>(tenantBase(tenantId, `/orders/${orderId}/confirm`), {});
  },
  pack(tenantId: string, orderId: string) {
    return api.patch<BackendRecord>(tenantBase(tenantId, `/orders/${orderId}/pack`), {});
  },
  dispatch(tenantId: string, orderId: string, data: BackendRecord) {
    return api.patch<BackendRecord>(tenantBase(tenantId, `/orders/${orderId}/dispatch`), data);
  },
  cancel(tenantId: string, orderId: string, data: BackendRecord) {
    return api.patch<BackendRecord>(tenantBase(tenantId, `/orders/${orderId}/cancel`), data);
  },
  addItem(tenantId: string, orderId: string, data: BackendRecord) {
    return api.post<BackendRecord>(tenantBase(tenantId, `/orders/${orderId}/items`), data);
  },
  updateItem(tenantId: string, orderId: string, itemId: string, data: BackendRecord) {
    return api.patch<BackendRecord>(tenantBase(tenantId, `/orders/${orderId}/items/${itemId}`), data);
  },
  deleteItem(tenantId: string, orderId: string, itemId: string) {
    return api.delete<{ message: string }>(tenantBase(tenantId, `/orders/${orderId}/items/${itemId}`));
  },
};

export const PaymentService = {
  list(tenantId: string, query: QueryParams = {}) {
    return api.get<PaginatedResponse<BackendRecord>>(tenantBase(tenantId, `/payments${buildQuery(query)}`));
  },
  agingReport(tenantId: string, query: QueryParams = {}) {
    return api.get<BackendRecord>(tenantBase(tenantId, `/payments/aging-report${buildQuery(query)}`));
  },
  cashflow(tenantId: string, query: QueryParams = {}) {
    return api.get<BackendRecord | BackendRecord[]>(tenantBase(tenantId, `/payments/cashflow${buildQuery(query)}`));
  },
  partyOutstanding(tenantId: string, partyId: string) {
    return api.get<BackendRecord>(tenantBase(tenantId, `/payments/party/${partyId}/outstanding`));
  },
  createDealerPayment(tenantId: string, data: BackendRecord) {
    return api.post<BackendRecord>(tenantBase(tenantId, '/payments/dealer'), data);
  },
  createSupplierPayment(tenantId: string, data: BackendRecord) {
    return api.post<BackendRecord>(tenantBase(tenantId, '/payments/supplier'), data);
  },
  updateStatus(tenantId: string, paymentId: string, data: BackendRecord) {
    return api.patch<BackendRecord>(tenantBase(tenantId, `/payments/${paymentId}/status`), data);
  },
  getById(tenantId: string, paymentId: string) {
    return api.get<BackendRecord>(tenantBase(tenantId, `/payments/${paymentId}`));
  },
};

export const DocumentService = {
  orderInvoiceUrl(tenantId: string, orderId: string) {
    return `/api/tenants/${tenantId}/documents/orders/${orderId}/invoice`;
  },
  orderChallanUrl(tenantId: string, orderId: string) {
    return `/api/tenants/${tenantId}/documents/orders/${orderId}/challan`;
  },
  paymentReceiptUrl(tenantId: string, paymentId: string) {
    return `/api/tenants/${tenantId}/documents/payments/${paymentId}/receipt`;
  },
};
