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

export const RawMaterialService = {
  async listTypes(_tenantId: string, query: RawMaterialTypeQuery = {}) {
    return asListResponse<RawMaterialType>(
      await api.get(owner(`/raw-material-types${buildQuery(query as any)}`)),
      'types'
    ) as any as Promise<{ success: boolean; data: RawMaterialPaginatedResponse<RawMaterialType>; error?: any }>;
  },

  async getType(_tenantId: string, materialTypeId: string) {
    return asItemResponse<RawMaterialType>(await api.get(owner(`/raw-materials/stock/${materialTypeId}`)), 'stock');
  },

  async createType(_tenantId: string, data: CreateRawMaterialTypePayload) {
    return asItemResponse<RawMaterialType>(await api.post(owner('/raw-material-types'), data), 'type');
  },

  async updateType(_tenantId: string, materialTypeId: string, data: UpdateRawMaterialTypePayload) {
    return asItemResponse<RawMaterialType>(await api.put(owner(`/raw-material-types/${materialTypeId}`), data), 'type');
  },

  async deleteType(_tenantId: string, materialTypeId: string) {
    return asItemResponse<RawMaterialType>(
      await api.patch(owner(`/raw-material-types/${materialTypeId}/status`), { status: 'INACTIVE' }),
      'type'
    );
  },

  async listPurchases(_tenantId: string, query: RawMaterialPurchaseQuery = {}) {
    return asListResponse<RawMaterialPurchase>(
      await api.get(owner(`/raw-material-purchases${buildQuery(query as any)}`)),
      'purchases'
    ) as any as Promise<{ success: boolean; data: RawMaterialPaginatedResponse<RawMaterialPurchase>; error?: any }>;
  },

  async getPurchase(_tenantId: string, purchaseId: string) {
    return asItemResponse<RawMaterialPurchase>(await api.get(owner(`/raw-material-purchases/${purchaseId}`)), 'purchase');
  },

  async createPurchase(_tenantId: string, data: CreateRawMaterialPurchasePayload) {
    return asItemResponse<RawMaterialPurchase>(await api.post(owner('/raw-material-purchases'), data), 'purchase');
  },

  async updatePurchase(_tenantId: string, purchaseId: string, data: UpdateRawMaterialPurchasePayload) {
    return asItemResponse<RawMaterialPurchase>(await api.put(owner(`/raw-material-purchases/${purchaseId}`), data), 'purchase');
  },

  async deletePurchase(_tenantId: string, purchaseId: string) {
    return asItemResponse<RawMaterialPurchase>(await api.patch(owner(`/raw-material-purchases/${purchaseId}/cancel`), {}), 'purchase');
  },

  async stock(_tenantId: string): Promise<ApiResponse<RawMaterialStockSummary[]>> {
    const response = asListResponse<RawMaterialStockSummary>(await api.get(owner('/raw-materials/stock')), 'stock');
    return response.success
      ? { ...response, data: response.data.items }
      : response as any;
  },

  async listIssuances(_tenantId: string, query: RawMaterialIssuanceQuery = {}) {
    return asListResponse<RawMaterialIssuance>(
      await api.get(owner(`/raw-materials/movements${buildQuery(query as any)}`)),
      'movements'
    ) as any as Promise<{ success: boolean; data: RawMaterialPaginatedResponse<RawMaterialIssuance>; error?: any }>;
  },

  async getIssuance(_tenantId: string, issuanceId: string) {
    return asItemResponse<RawMaterialIssuance>(await api.get(owner(`/raw-materials/stock/${issuanceId}`)), 'stock');
  },
};
