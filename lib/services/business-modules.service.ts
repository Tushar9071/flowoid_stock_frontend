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

export type { BackendRecord, PaginatedResponse, QueryParams };
export { responseItems };

export const DesignService = {
  async listCategories(_tenantId: string, query: QueryParams = {}) {
    return asListResponse(await api.get(owner(`/design-categories${buildQuery(query)}`)), 'categories');
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
    return asListResponse(await api.get(owner(`/designs${buildQuery(query)}`)), 'designs');
  },
  async create(_tenantId: string, data: BackendRecord | FormData) {
    return asItemResponse(await api.post(owner('/designs'), data), 'design');
  },
  async getById(_tenantId: string, id: string) {
    return asItemResponse(await api.get(owner(`/designs/${id}`)), 'design');
  },
  async update(_tenantId: string, id: string, data: BackendRecord) {
    return asItemResponse(await api.put(owner(`/designs/${id}`), data), 'design');
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
    return asListResponse(await api.get(owner(`/workers${buildQuery(query)}`)), 'workers');
  },
  async create(_tenantId: string, data: BackendRecord) {
    return asItemResponse(await api.post(owner('/workers'), data), 'worker');
  },
  async getById(_tenantId: string, id: string) {
    return asItemResponse(await api.get(owner(`/workers/${id}`)), 'worker');
  },
  async update(_tenantId: string, id: string, data: BackendRecord) {
    return asItemResponse(await api.put(owner(`/workers/${id}`), data), 'worker');
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
    return asItemResponse(await api.get(owner(`/workers/${id}/balance`)), 'worker');
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
  async update(_tenantId: string, id: string, data: BackendRecord) {
    return asItemResponse(await api.put(owner(`/assignments/${id}`), data), 'assignment');
  },
  async updateStatus(_tenantId: string, id: string, data: BackendRecord) {
    return asItemResponse(await api.patch(owner(`/assignments/${id}/status`), data), 'assignment');
  },
  async close(_tenantId: string, id: string, data: BackendRecord = {}) {
    return asItemResponse(await api.patch(owner(`/assignments/${id}/status`), { ...data, status: 'CLOSED' }), 'assignment');
  },
  async listGoodsReturns(_tenantId: string, query: QueryParams = {}) {
    return asListResponse(await api.get(owner(`/assignments${buildQuery(query)}`)), 'assignments');
  },
  async getGoodsReturn(_tenantId: string, returnId: string) {
    return asItemResponse(await api.get(owner(`/assignments/${returnId}`)), 'assignment');
  },
  async listReturnsForAssignment(_tenantId: string, id: string) {
    return asListResponse(await api.get(owner(`/assignments/${id}/returns`)), 'returns');
  },
  async recordReturn(_tenantId: string, id: string, data: BackendRecord) {
    return asItemResponse(await api.post(owner(`/assignments/${id}/returns`), data), 'return');
  },
};

export const InventoryService = {
  async listStock(_tenantId: string, query: QueryParams = {}) {
    return asListResponse(await api.get(owner(`/inventory${buildQuery(query)}`)), 'inventory');
  },
  async getStock(_tenantId: string, designId: string) {
    return asItemResponse(await api.get(owner(`/inventory/${designId}`)), 'inventory');
  },
  async listPackagingBatches(_tenantId: string, query: QueryParams = {}) {
    return asListResponse(await api.get(owner(`/inventory/packaging${buildQuery(query)}`)), 'batches');
  },
  async createPackagingBatch(_tenantId: string, data: BackendRecord) {
    return asItemResponse(await api.post(owner('/inventory/packaging'), data), 'batch');
  },
  async getPackagingBatch(_tenantId: string, batchId: string) {
    return asItemResponse(await api.get(owner(`/inventory/packaging/${batchId}`)), 'batch');
  },
  async createAdjustment(_tenantId: string, designId: string, data: BackendRecord) {
    return asItemResponse(await api.post(owner('/inventory/adjustments'), { ...data, designId }), 'adjustment');
  },
  async listLowStockAlerts(_tenantId: string, query: QueryParams = {}) {
    const response = await api.get(owner(`/inventory${buildQuery(query)}`));
    const normalized = asListResponse<BackendRecord>(response, 'inventory');
    if (normalized.success) {
      normalized.data.items = normalized.data.items.filter((item) => {
        const current = Number(item.currentStock ?? item.quantity ?? item.stock ?? 0);
        const threshold = Number(item.lowStockThreshold ?? item.alertThreshold ?? 0);
        return threshold > 0 && current <= threshold;
      });
    }
    return normalized;
  },
  async updateLowStockAlert(_tenantId: string, designId: string, data: BackendRecord) {
    return asItemResponse(await api.post(owner('/inventory/adjustments'), { ...data, designId, type: 'INCREASE', quantity: 0 }), 'adjustment');
  },
};

export const OrderService = {
  async list(_tenantId: string, query: QueryParams = {}) {
    return asListResponse(await api.get(owner(`/orders${buildQuery(query)}`)), 'orders');
  },
  async create(_tenantId: string, data: BackendRecord) {
    return asItemResponse(await api.post(owner('/orders'), data), 'order');
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
    return asItemResponse(await api.put(owner(`/orders/${orderId}`), data), 'order');
  },
  async confirm(_tenantId: string, orderId: string) {
    return asItemResponse(await api.patch(owner(`/orders/${orderId}/confirm`), {}), 'order');
  },
  async pack(_tenantId: string, orderId: string) {
    return asItemResponse(await api.patch(owner(`/orders/${orderId}/confirm`), {}), 'order');
  },
  async dispatch(_tenantId: string, orderId: string, data: BackendRecord) {
    return asItemResponse(await api.post(owner(`/orders/${orderId}/dispatches`), data), 'dispatch');
  },
  async cancel(_tenantId: string, orderId: string, data: BackendRecord = {}) {
    return asItemResponse(await api.patch(owner(`/orders/${orderId}/cancel`), data), 'order');
  },
  async addItem(_tenantId: string, orderId: string, data: BackendRecord) {
    return asItemResponse(await api.post(owner(`/orders/${orderId}/items`), data), 'item');
  },
  async updateItem(_tenantId: string, orderId: string, itemId: string, data: BackendRecord) {
    return asItemResponse(await api.put(owner(`/orders/${orderId}/items/${itemId}`), data), 'item');
  },
  async deleteItem(_tenantId: string, orderId: string, itemId: string) {
    return asItemResponse(await api.delete(owner(`/orders/${orderId}/items/${itemId}`)), 'item');
  },
};

export const PaymentService = {
  async list(_tenantId: string, query: QueryParams = {}) {
    return asListResponse(await api.get(owner(`/payments${buildQuery(query)}`)), 'payments');
  },
  async agingReport(_tenantId: string, query: QueryParams = {}) {
    return asItemResponse(await api.get(owner(`/reports/ageing${buildQuery(query)}`)), 'report');
  },
  async cashflow(_tenantId: string, query: QueryParams = {}) {
    return asItemResponse(await api.get(owner(`/reports/cashflow${buildQuery(query)}`)), 'report');
  },
  async partyOutstanding(_tenantId: string, partyId: string) {
    return asItemResponse(await api.get(owner(`/parties/${partyId}/balance`)), 'balance');
  },
  async createDealerPayment(_tenantId: string, data: BackendRecord) {
    return asItemResponse(await api.post(owner('/payments'), { ...data, nature: data.nature || 'DEALER_RECEIPT' }), 'payment');
  },
  async createSupplierPayment(_tenantId: string, data: BackendRecord) {
    return asItemResponse(await api.post(owner('/payments'), { ...data, nature: data.nature || 'SUPPLIER_PAYMENT' }), 'payment');
  },
  async updateStatus(_tenantId: string, paymentId: string, data: BackendRecord) {
    if (String(data.paymentStatus || data.status).toUpperCase() === 'CANCELLED') {
      return asItemResponse(await api.patch(owner(`/payments/${paymentId}/cancel`), data), 'payment');
    }
    return asItemResponse(await api.get(owner(`/payments/${paymentId}`)), 'payment');
  },
  async getById(_tenantId: string, paymentId: string) {
    return asItemResponse(await api.get(owner(`/payments/${paymentId}`)), 'payment');
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
