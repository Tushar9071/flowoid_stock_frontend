import { api } from '../api-client';
import type { ApiResponse } from '../api-client';
import {
  CreateRawMaterialPurchasePayload,
  CreateRawMaterialTypePayload,
  RawMaterialIssuance,
  RawMaterialIssuanceQuery,
  RawMaterialPaginatedResponse,
  RawMaterialPurchase,
  RawMaterialPurchaseQuery,
  RawMaterialStockSummary,
  RawMaterialType,
  RawMaterialTypeQuery,
  UpdateRawMaterialPurchasePayload,
  UpdateRawMaterialTypePayload,
} from '../types';
import { asItemResponse, asListResponse, buildQuery } from './api-normalizers';

const owner = (path: string) => `/owner${path}`;

function normalizeType(type: any): RawMaterialType {
  return {
    ...type,
    isActive: type.isActive ?? type.status !== 'INACTIVE',
    currentStock: type.currentStock ?? type.stock?.quantityAvailable,
  };
}

function normalizePurchase(purchase: any): RawMaterialPurchase {
  return {
    ...purchase,
    materialTypeId: purchase.materialTypeId || purchase.materialId,
    materialId: purchase.materialId || purchase.materialTypeId,
    supplierId: purchase.supplierId || purchase.supplierPartyId || '',
    supplierPartyId: purchase.supplierPartyId || purchase.supplierId,
    materialType: purchase.materialType || purchase.material,
    supplier: purchase.supplier || purchase.supplierParty,
  };
}

function normalizeTypeQuery(query: RawMaterialTypeQuery = {}) {
  const payload: Record<string, any> = { ...query };
  if (typeof query.isActive === 'boolean' && !payload.status) {
    payload.status = query.isActive ? 'ACTIVE' : 'INACTIVE';
  }
  delete payload.isActive;
  return payload;
}

function normalizeStock(stock: any): RawMaterialStockSummary {
  const material = stock.material || {};
  return {
    ...stock,
    materialTypeId: stock.materialTypeId || stock.materialId || stock.id,
    name: stock.name || material.name || 'Raw material',
    unit: stock.unit || material.unit || 'KG',
    totalPurchased: stock.totalPurchased ?? stock.quantityPurchased ?? stock.quantityAvailable ?? '0',
    totalIssued: stock.totalIssued ?? stock.quantityIssued ?? '0',
    currentStock: stock.currentStock ?? stock.quantityAvailable ?? '0',
    isLow: stock.isLow ?? stock.isLowStock ?? false,
  };
}

function normalizeMovement(movement: any): RawMaterialIssuance {
  const material = movement.material || movement.materialType || {};
  return {
    ...movement,
    materialTypeId: movement.materialTypeId || movement.materialId,
    materialType: movement.materialType || movement.material,
    quantity: movement.quantity ?? movement.quantityChange,
    issuedAt: movement.issuedAt || movement.createdAt,
    notes: movement.notes || movement.movementType || '',
    assignmentId: movement.assignmentId || movement.referenceId || '-',
    unit: movement.unit || material.unit,
  };
}

function normalizePurchaseQuery(query: RawMaterialPurchaseQuery = {}) {
  const payload: Record<string, any> = { ...query };
  if (payload.materialTypeId && !payload.materialId) payload.materialId = payload.materialTypeId;
  if (payload.supplierId && !payload.supplierPartyId) payload.supplierPartyId = payload.supplierId;
  if (payload.dateFrom && !payload.from) payload.from = payload.dateFrom;
  if (payload.dateTo && !payload.to) payload.to = payload.dateTo;
  delete payload.materialTypeId;
  delete payload.supplierId;
  delete payload.dateFrom;
  delete payload.dateTo;
  return payload;
}

function normalizeMovementQuery(query: RawMaterialIssuanceQuery = {}) {
  const payload: Record<string, any> = { ...query };
  if (payload.materialTypeId && !payload.materialId) payload.materialId = payload.materialTypeId;
  if (payload.dateFrom && !payload.from) payload.from = payload.dateFrom;
  if (payload.dateTo && !payload.to) payload.to = payload.dateTo;
  delete payload.materialTypeId;
  delete payload.dateFrom;
  delete payload.dateTo;
  return payload;
}

function purchasePayload(data: CreateRawMaterialPurchasePayload | UpdateRawMaterialPurchasePayload, isUpdate = false) {
  const payload: Record<string, any> = {
    ...data,
    materialId: (data as CreateRawMaterialPurchasePayload).materialId || (data as CreateRawMaterialPurchasePayload).materialTypeId,
    supplierPartyId: (data as CreateRawMaterialPurchasePayload).supplierPartyId || (data as CreateRawMaterialPurchasePayload).supplierId || undefined,
  };
  delete payload.materialTypeId;
  delete payload.supplierId;
  delete payload.status;
  if (isUpdate) {
    delete payload.materialId;
  }
  return payload;
}

export const RawMaterialService = {
  async listTypes(_tenantId: string, query: RawMaterialTypeQuery = {}) {
    const response = asListResponse<RawMaterialType>(
      await api.get(owner(`/raw-material-types${buildQuery(normalizeTypeQuery(query) as any)}`)),
      'types'
    );
    return response.success
      ? { ...response, data: { ...response.data, items: response.data.items.map(normalizeType) } }
      : response as any;
  },

  async getType(_tenantId: string, materialTypeId: string) {
    return asItemResponse<RawMaterialType>(await api.get(owner(`/raw-materials/stock/${materialTypeId}`)), 'stock');
  },

  async createType(_tenantId: string, data: CreateRawMaterialTypePayload) {
    const response = asItemResponse<RawMaterialType>(await api.post(owner('/raw-material-types'), data), 'type');
    return response.success ? { ...response, data: normalizeType(response.data) } : response;
  },

  async updateType(_tenantId: string, materialTypeId: string, data: UpdateRawMaterialTypePayload) {
    const { isActive: _isActive, status: _status, unit: _unit, openingStock: _openingStock, ...payload } = data as any;
    const response = asItemResponse<RawMaterialType>(await api.put(owner(`/raw-material-types/${materialTypeId}`), payload), 'type');
    return response.success ? { ...response, data: normalizeType(response.data) } : response;
  },

  async updateTypeUnit(_tenantId: string, materialTypeId: string, unit: RawMaterialType['unit']) {
    const response = asItemResponse<RawMaterialType>(await api.patch(owner(`/raw-material-types/${materialTypeId}/unit`), { unit }), 'type');
    return response.success ? { ...response, data: normalizeType(response.data) } : response;
  },

  async deleteType(_tenantId: string, materialTypeId: string) {
    return asItemResponse<RawMaterialType>(
      await api.patch(owner(`/raw-material-types/${materialTypeId}/status`), { status: 'INACTIVE' }),
      'type'
    );
  },

  async updateTypeStatus(_tenantId: string, materialTypeId: string, data: { status: string }) {
    const response = asItemResponse<RawMaterialType>(
      await api.patch(owner(`/raw-material-types/${materialTypeId}/status`), data),
      'type'
    );
    return response.success ? { ...response, data: normalizeType(response.data) } : response;
  },

  async listPurchases(_tenantId: string, query: RawMaterialPurchaseQuery = {}) {
    const response = asListResponse<RawMaterialPurchase>(
      await api.get(owner(`/raw-material-purchases${buildQuery(normalizePurchaseQuery(query) as any)}`)),
      'purchases'
    );
    return response.success
      ? { ...response, data: { ...response.data, items: response.data.items.map(normalizePurchase) } }
      : response as any;
  },

  async getPurchase(_tenantId: string, purchaseId: string) {
    const response = asItemResponse<RawMaterialPurchase>(await api.get(owner(`/raw-material-purchases/${purchaseId}`)), 'purchase');
    return response.success ? { ...response, data: normalizePurchase(response.data) } : response;
  },

  async createPurchase(_tenantId: string, data: CreateRawMaterialPurchasePayload) {
    const response = asItemResponse<RawMaterialPurchase>(await api.post(owner('/raw-material-purchases'), purchasePayload(data)), 'purchase');
    return response.success ? { ...response, data: normalizePurchase(response.data) } : response;
  },

  async updatePurchase(_tenantId: string, purchaseId: string, data: UpdateRawMaterialPurchasePayload) {
    const response = asItemResponse<RawMaterialPurchase>(
      await api.put(owner(`/raw-material-purchases/${purchaseId}`), purchasePayload(data, true)),
      'purchase'
    );
    return response.success ? { ...response, data: normalizePurchase(response.data) } : response;
  },

  async deletePurchase(_tenantId: string, purchaseId: string) {
    return asItemResponse<RawMaterialPurchase>(await api.patch(owner(`/raw-material-purchases/${purchaseId}/cancel`), {}), 'purchase');
  },

  async finalisePurchase(_tenantId: string, purchaseId: string) {
    return asItemResponse<RawMaterialPurchase>(await api.patch(owner(`/raw-material-purchases/${purchaseId}/finalise`), {}), 'purchase');
  },

  async stock(_tenantId: string): Promise<ApiResponse<RawMaterialStockSummary[]>> {
    const response = asListResponse<RawMaterialStockSummary>(await api.get(owner('/raw-materials/stock')), 'stock');
    return response.success
      ? { ...response, data: response.data.items.map(normalizeStock) }
      : response as any;
  },

  async listIssuances(_tenantId: string, query: RawMaterialIssuanceQuery = {}) {
    const response = asListResponse<RawMaterialIssuance>(
      await api.get(owner(`/raw-materials/movements${buildQuery(normalizeMovementQuery(query) as any)}`)),
      'movements'
    );
    return response.success
      ? { ...response, data: { ...response.data, items: response.data.items.map(normalizeMovement) } }
      : response as any;
  },

  async getIssuance(_tenantId: string, issuanceId: string) {
    return asItemResponse<RawMaterialIssuance>(await api.get(owner(`/raw-materials/stock/${issuanceId}`)), 'stock');
  },
};
