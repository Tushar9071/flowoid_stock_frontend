import { api } from '../api-client';
import {
  BackendParty,
  CreatePartyPayload,
  PartyDropdownItem,
  PartyDuplicateResponse,
  PartyListQuery,
  PartyListResponse,
  PartyOpeningBalancePayload,
  PartyOpeningBalanceResponse,
  PartyStatementQuery,
  PartyStatementResponse,
  UpdatePartyPayload,
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

function partiesBase(tenantId: string) {
  return `/tenants/${tenantId}/parties`;
}

export const PartyService = {
  async list(tenantId: string, query: PartyListQuery = {}) {
    return api.get<PartyListResponse>(`${partiesBase(tenantId)}${buildQuery(query)}`);
  },

  async dropdown(tenantId: string, query: Omit<PartyListQuery, 'page'> = {}) {
    return api.get<{ items: PartyDropdownItem[] }>(
      `${partiesBase(tenantId)}/dropdown${buildQuery(query)}`
    );
  },

  async checkDuplicate(
    tenantId: string,
    query: {
      name?: string;
      phone?: string;
      code?: string;
      gstin?: string;
      excludePartyId?: string;
    }
  ) {
    return api.get<PartyDuplicateResponse>(
      `${partiesBase(tenantId)}/check-duplicate${buildQuery(query)}`
    );
  },

  async getById(tenantId: string, partyId: string) {
    return api.get<BackendParty>(`${partiesBase(tenantId)}/${partyId}`);
  },

  async create(tenantId: string, data: CreatePartyPayload) {
    return api.post<BackendParty>(partiesBase(tenantId), data);
  },

  async update(tenantId: string, partyId: string, data: UpdatePartyPayload) {
    return api.put<BackendParty>(`${partiesBase(tenantId)}/${partyId}`, data);
  },

  async updateStatus(tenantId: string, partyId: string, isActive: boolean) {
    return api.patch<BackendParty>(`${partiesBase(tenantId)}/${partyId}/status`, { isActive });
  },

  async delete(tenantId: string, partyId: string) {
    return api.delete<{ message: string }>(`${partiesBase(tenantId)}/${partyId}`);
  },

  async getOpeningBalance(tenantId: string, partyId: string) {
    return api.get<PartyOpeningBalanceResponse>(
      `${partiesBase(tenantId)}/${partyId}/opening-balance`
    );
  },

  async createOpeningBalance(
    tenantId: string,
    partyId: string,
    data: PartyOpeningBalancePayload
  ) {
    return api.post<BackendParty>(`${partiesBase(tenantId)}/${partyId}/opening-balance`, data);
  },

  async updateOpeningBalance(
    tenantId: string,
    partyId: string,
    data: PartyOpeningBalancePayload
  ) {
    return api.put<BackendParty>(`${partiesBase(tenantId)}/${partyId}/opening-balance`, data);
  },

  async statement(tenantId: string, partyId: string, query: PartyStatementQuery = {}) {
    return api.get<PartyStatementResponse>(
      `${partiesBase(tenantId)}/${partyId}/statement${buildQuery(query)}`
    );
  },

  async ledger(tenantId: string, partyId: string, query: PartyStatementQuery = {}) {
    return api.get<PartyStatementResponse>(
      `${partiesBase(tenantId)}/${partyId}/ledger${buildQuery(query)}`
    );
  },
};
