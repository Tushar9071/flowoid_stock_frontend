import { api } from '../api-client';
import { asItemResponse } from './api-normalizers';

const owner = (path: string) => `/owner${path}`;

export interface BusinessSettings {
  id?: string;
  singletonKey?: string;
  businessName?: string | null;
  category?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  gstin?: string | null;
  pan?: string | null;
  logoUrl?: string | null;
  invoicePrefix?: string | null;
  challanPrefix?: string | null;
  paymentPrefix?: string | null;
  orderPrefix?: string | null;
  purchasePrefix?: string | null;
  allowNegativeStock?: boolean;
  lowStockThreshold?: number | null;
  defaultPaymentTerms?: string | null;
  updatedAt?: string;
}

export type BusinessProfilePayload = Pick<
  BusinessSettings,
  'businessName' | 'category' | 'phone' | 'email' | 'address' | 'city' | 'state' | 'country' | 'gstin' | 'pan'
>;

export type DocumentConfigPayload = Pick<
  BusinessSettings,
  'invoicePrefix' | 'challanPrefix' | 'paymentPrefix' | 'orderPrefix' | 'purchasePrefix'
>;

export type StockRulesPayload = Pick<BusinessSettings, 'allowNegativeStock' | 'lowStockThreshold'>;
export type PaymentTermsPayload = Pick<BusinessSettings, 'defaultPaymentTerms'>;

function cleanPayload<T extends Record<string, any>>(payload: T) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== '')
  ) as Partial<T>;
}

export const SettingsService = {
  async get() {
    return asItemResponse<BusinessSettings>(await api.get(owner('/settings')), 'settings');
  },

  async updateBusinessProfile(data: BusinessProfilePayload) {
    return asItemResponse<BusinessSettings>(
      await api.put(owner('/settings/business-profile'), cleanPayload(data)),
      'settings'
    );
  },

  async updateDocumentConfig(data: DocumentConfigPayload) {
    return asItemResponse<BusinessSettings>(
      await api.put(owner('/settings/document-config'), cleanPayload(data)),
      'settings'
    );
  },

  async updateStockRules(data: StockRulesPayload) {
    return asItemResponse<BusinessSettings>(
      await api.put(owner('/settings/stock-rules'), cleanPayload(data)),
      'settings'
    );
  },

  async updatePaymentTerms(data: PaymentTermsPayload) {
    return asItemResponse<BusinessSettings>(
      await api.put(owner('/settings/payment-terms'), cleanPayload(data)),
      'settings'
    );
  },

  async uploadLogo(file: File) {
    const formData = new FormData();
    formData.append('logo', file);
    return asItemResponse<BusinessSettings>(
      await api.post(owner('/settings/logo'), formData),
      'settings'
    );
  },
};
