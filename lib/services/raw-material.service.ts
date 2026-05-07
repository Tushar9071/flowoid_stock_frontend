import { api } from '../api-client';
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

function buildQuery<T extends object>(params: T) {
  const query = new URLSearchParams();

  Object.entries(params as Record<string, string | number | boolean | undefined | null>).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    query.set(key, String(value));
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

function rawMaterialsBase(tenantId: string) {
  return `/tenants/${tenantId}/raw-materials`;
}

export const RawMaterialService = {
  async listTypes(tenantId: string, query: RawMaterialTypeQuery = {}) {
    return api.get<RawMaterialPaginatedResponse<RawMaterialType>>(
      `${rawMaterialsBase(tenantId)}/types${buildQuery(query)}`
    );
  },

  async getType(tenantId: string, materialTypeId: string) {
    return api.get<RawMaterialType>(`${rawMaterialsBase(tenantId)}/types/${materialTypeId}`);
  },

  async createType(tenantId: string, data: CreateRawMaterialTypePayload) {
    return api.post<RawMaterialType>(`${rawMaterialsBase(tenantId)}/types`, data);
  },

  async updateType(tenantId: string, materialTypeId: string, data: UpdateRawMaterialTypePayload) {
    return api.patch<RawMaterialType>(`${rawMaterialsBase(tenantId)}/types/${materialTypeId}`, data);
  },

  async deleteType(tenantId: string, materialTypeId: string) {
    return api.delete<{ message: string }>(`${rawMaterialsBase(tenantId)}/types/${materialTypeId}`);
  },

  async listPurchases(tenantId: string, query: RawMaterialPurchaseQuery = {}) {
    return api.get<RawMaterialPaginatedResponse<RawMaterialPurchase>>(
      `${rawMaterialsBase(tenantId)}/purchases${buildQuery(query)}`
    );
  },

  async getPurchase(tenantId: string, purchaseId: string) {
    return api.get<RawMaterialPurchase>(`${rawMaterialsBase(tenantId)}/purchases/${purchaseId}`);
  },

  async createPurchase(tenantId: string, data: CreateRawMaterialPurchasePayload) {
    return api.post<RawMaterialPurchase>(`${rawMaterialsBase(tenantId)}/purchases`, data);
  },

  async updatePurchase(tenantId: string, purchaseId: string, data: UpdateRawMaterialPurchasePayload) {
    return api.patch<RawMaterialPurchase>(`${rawMaterialsBase(tenantId)}/purchases/${purchaseId}`, data);
  },

  async deletePurchase(tenantId: string, purchaseId: string) {
    return api.delete<{ message: string }>(`${rawMaterialsBase(tenantId)}/purchases/${purchaseId}`);
  },

  async stock(tenantId: string) {
    return api.get<RawMaterialStockSummary[]>(`${rawMaterialsBase(tenantId)}/stock`);
  },

  async listIssuances(tenantId: string, query: RawMaterialIssuanceQuery = {}) {
    return api.get<RawMaterialPaginatedResponse<RawMaterialIssuance>>(
      `${rawMaterialsBase(tenantId)}/issuances${buildQuery(query)}`
    );
  },

  async getIssuance(tenantId: string, issuanceId: string) {
    return api.get<RawMaterialIssuance>(`${rawMaterialsBase(tenantId)}/issuances/${issuanceId}`);
  },
};
