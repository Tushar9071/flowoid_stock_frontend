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
import { asItemResponse, asListResponse, buildQuery } from './api-normalizers';

const owner = (path: string) => `/owner${path}`;

function toPartyList(response: Awaited<ReturnType<typeof api.get<any>>>) {
  const normalized = asListResponse<BackendParty>(response, 'parties');
  if (!normalized.success) return normalized as any;

  return {
    ...normalized,
    data: {
      items: normalized.data.items,
      pagination: normalized.data.pagination || {
        page: 1,
        limit: normalized.data.items.length,
        totalItems: normalized.data.items.length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    },
  };
}

export const PartyService = {
  async list(_tenantId: string, query: PartyListQuery = {}) {
    return toPartyList(await api.get(owner(`/parties${buildQuery(query as any)}`))) as any as Promise<{
      success: boolean;
      data: PartyListResponse;
      error?: any;
    }>;
  },

  async dropdown(tenantId: string, query: Omit<PartyListQuery, 'page'> = {}) {
    const response = await this.list(tenantId, { ...query, page: 1, limit: query.limit || 100 } as PartyListQuery);
    if (!response.success) return response as any;
    return {
      ...response,
      data: { items: response.data.items as unknown as PartyDropdownItem[] },
    };
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
    const response = await this.list(tenantId, { page: 1, limit: 100 } as PartyListQuery);
    const duplicate = response.success
      ? response.data.items.find((party) =>
          (query.name && party.name?.toLowerCase() === query.name.toLowerCase()) ||
          (query.phone && party.phone === query.phone) ||
          (query.code && party.code === query.code) ||
          (query.gstin && party.gstin === query.gstin)
        )
      : null;

    return {
      success: true,
      data: {
        exists: Boolean(duplicate && duplicate.id !== query.excludePartyId),
        duplicateBy: duplicate ? ['local'] : [],
        party: duplicate || null,
        checkedFields: {
          name: query.name || null,
          phone: query.phone || null,
          code: query.code || null,
          gstin: query.gstin || null,
        },
      } satisfies PartyDuplicateResponse,
    };
  },

  async getById(_tenantId: string, partyId: string) {
    return asItemResponse<BackendParty>(await api.get(owner(`/parties/${partyId}`)), 'party');
  },

  async create(_tenantId: string, data: CreatePartyPayload) {
    return asItemResponse<BackendParty>(await api.post(owner('/parties'), data), 'party');
  },

  async update(_tenantId: string, partyId: string, data: UpdatePartyPayload) {
    return asItemResponse<BackendParty>(await api.put(owner(`/parties/${partyId}`), data), 'party');
  },

  async updateStatus(_tenantId: string, partyId: string, isActive: boolean) {
    return asItemResponse<BackendParty>(
      await api.patch(owner(`/parties/${partyId}/status`), { status: isActive ? 'ACTIVE' : 'INACTIVE' }),
      'party'
    );
  },

  async delete(_tenantId: string, partyId: string) {
    return asItemResponse<BackendParty>(await api.patch(owner(`/parties/${partyId}/status`), { status: 'INACTIVE' }), 'party');
  },

  async getOpeningBalance(_tenantId: string, partyId: string) {
    const response = await this.getById('', partyId);
    return {
      ...response,
      data: response.success
        ? {
            party: response.data,
            hasOpeningBalance: Number(response.data.openingBalance || 0) !== 0,
            openingBalance: response.data.openingBalance
              ? {
                  amount: String(response.data.openingBalance),
                  type: response.data.openingBalanceType || 'RECEIVABLE',
                  date: response.data.openingBalanceDate || response.data.createdAt || new Date().toISOString(),
                }
              : null,
          } satisfies PartyOpeningBalanceResponse
        : response.data as any,
    };
  },

  async createOpeningBalance(_tenantId: string, partyId: string, data: PartyOpeningBalancePayload) {
    return this.update('', partyId, data as any);
  },

  async updateOpeningBalance(_tenantId: string, partyId: string, data: PartyOpeningBalancePayload) {
    return this.update('', partyId, data as any);
  },

  async statement(_tenantId: string, partyId: string, query: PartyStatementQuery = {}) {
    return asItemResponse<PartyStatementResponse>(
      await api.get(owner(`/parties/${partyId}/ledger${buildQuery(query as any)}`)),
      'ledger'
    );
  },

  async ledger(_tenantId: string, partyId: string, query: PartyStatementQuery = {}) {
    return this.statement('', partyId, query);
  },
};
