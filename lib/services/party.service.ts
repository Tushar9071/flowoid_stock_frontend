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

function normalizeParty(party: any): BackendParty {
  return {
    ...party,
    type: party.type || party.partyType,
    partyType: party.partyType || party.type,
    addressLine1: party.addressLine1 || party.address || '',
    isActive: party.isActive ?? party.status !== 'INACTIVE',
  };
}

function normalizePartyPayload(data: CreatePartyPayload | UpdatePartyPayload, isUpdate = false) {
  const address = data.address || [data.addressLine1, data.addressLine2].filter(Boolean).join(', ') || undefined;
  const payload: Record<string, any> = {
    ...data,
    partyType: data.partyType || data.type,
    address,
  };

  delete payload.type;
  delete payload.addressLine1;
  delete payload.addressLine2;
  delete payload.openingBalanceDate;
  if (isUpdate) {
    delete payload.code;
    delete payload.partyType;
  }

  return payload;
}

function normalizePartyQuery(query: PartyListQuery = {}) {
  const payload: Record<string, any> = { ...query };
  if ((query as any).type && !(query as any).partyType) {
    payload.partyType = (query as any).type;
  }
  if (typeof (query as any).isActive === 'boolean' && !payload.status) {
    payload.status = (query as any).isActive ? 'ACTIVE' : 'INACTIVE';
  }
  delete payload.type;
  delete payload.isActive;
  return payload;
}

function normalizeStatement(payload: any): PartyStatementResponse {
  const rawEntries = Array.isArray(payload?.entries)
    ? payload.entries
    : Array.isArray(payload?.ledger)
      ? payload.ledger
      : Array.isArray(payload)
        ? payload
        : [];
  const entries = rawEntries.map((entry: any) => {
    const entryType = String(entry.entryType || '').toUpperCase();
    const amount = Number(entry.amount || 0);
    return {
      ...entry,
      entryDate: entry.entryDate || entry.createdAt,
      voucherType: entry.referenceType || entry.voucherType,
      referenceNo: entry.referenceId || entry.referenceNo,
      debitAmount: entry.debitAmount ?? (entryType === 'DEBIT' ? amount : 0),
      creditAmount: entry.creditAmount ?? (entryType === 'CREDIT' ? amount : 0),
      runningBalance: entry.runningBalance ?? entry.balanceAfter ?? 0,
    };
  });
  const totalDebit = entries.reduce((sum: number, entry: any) => sum + Number(entry.debitAmount || 0), 0);
  const totalCredit = entries.reduce((sum: number, entry: any) => sum + Number(entry.creditAmount || 0), 0);
  const backendSummary = payload?.summary || {};
  const closingBalance = backendSummary.closingBalance ?? backendSummary.balance ?? entries[0]?.runningBalance ?? 0;

  return {
    ...payload,
    entries,
    summary: {
      balanceBeforePeriod: backendSummary.balanceBeforePeriod ?? 0,
      totalDebit: backendSummary.totalDebit ?? totalDebit,
      totalCredit: backendSummary.totalCredit ?? totalCredit,
      closingBalance,
      balanceNature: backendSummary.balanceNature || (Number(closingBalance) >= 0 ? 'RECEIVABLE' : 'PAYABLE'),
    },
    filters: payload?.filters || {},
    pagination: payload?.pagination || payload?.meta,
  };
}

function toPartyList(response: Awaited<ReturnType<typeof api.get<any>>>) {
  const normalized = asListResponse<BackendParty>(response, 'parties');
  if (!normalized.success) return normalized as any;

  return {
    ...normalized,
    data: {
      items: normalized.data.items.map(normalizeParty),
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
    return toPartyList(await api.get(owner(`/parties${buildQuery(normalizePartyQuery(query) as any)}`))) as any as Promise<{
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
    const response = asItemResponse<BackendParty>(await api.get(owner(`/parties/${partyId}`)), 'party');
    return response.success ? { ...response, data: normalizeParty(response.data) } : response;
  },

  async create(_tenantId: string, data: CreatePartyPayload) {
    const response = asItemResponse<BackendParty>(await api.post(owner('/parties'), normalizePartyPayload(data)), 'party');
    return response.success ? { ...response, data: normalizeParty(response.data) } : response;
  },

  async update(_tenantId: string, partyId: string, data: UpdatePartyPayload) {
    const response = asItemResponse<BackendParty>(
      await api.put(owner(`/parties/${partyId}`), normalizePartyPayload(data, true)),
      'party'
    );
    return response.success ? { ...response, data: normalizeParty(response.data) } : response;
  },

  async updateStatus(_tenantId: string, partyId: string, isActive: boolean) {
    if (isActive) {
      return {
        success: false,
        data: null as any,
        error: {
          code: 'UNSUPPORTED_BY_BACKEND',
          message: 'The backend exposes party deactivation only. Reactivation is not available.',
        },
      };
    }
    return asItemResponse<BackendParty>(
      await api.patch(owner(`/parties/${partyId}/deactivate`), {}),
      'party'
    );
  },

  async delete(_tenantId: string, partyId: string) {
    return asItemResponse<BackendParty>(await api.patch(owner(`/parties/${partyId}/deactivate`), {}), 'party');
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
    const response = await api.get<any>(owner(`/parties/${partyId}/ledger${buildQuery(query as any)}`));
    return response.success
      ? { ...response, data: normalizeStatement(response.data) }
      : response as any;
  },

  async ledger(_tenantId: string, partyId: string, query: PartyStatementQuery = {}) {
    return this.statement('', partyId, query);
  },
};
