'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth-context';
import { formatCurrency } from '@/lib/constants';
import {
  BackendRecord,
  DesignService,
  DocumentService,
  InventoryService,
  OrderService,
  responseItems,
} from '@/lib/services/business-modules.service';
import { CurrentOwnerService } from '@/lib/services/current-owner.service';
import { PartyService } from '@/lib/services/party.service';
import { BackendTenant } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalMode = 'create' | 'editOrder' | 'addItem' | 'editItem' | 'dispatch' | 'cancel' | null;

// ─── Utility functions ────────────────────────────────────────────────────────

export function prettyDate(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value));
}

export function orderNumber(order: BackendRecord) {
  return order.orderNo || order.orderNumber || order.orderId || order.id?.slice(0, 8) || '-';
}

export function dealerName(order: BackendRecord) {
  const party = order.dealer || order.party;
  if (party && party.name) return party.name;
  return order.dealerName || order.partyName || '-';
}

export function dealerCode(order: BackendRecord) {
  const party = order.dealer || order.party;
  return party?.code || '-';
}

export function orderItems(order: BackendRecord) {
  return Array.isArray(order.items) ? order.items : Array.isArray(order.orderItems) ? order.orderItems : [];
}

export function orderId(order: BackendRecord) {
  return order.id || order.orderId;
}

export function normalizedOrderStatus(order: BackendRecord) {
  return String(order.status || order.orderStatus || '').toLowerCase();
}

export function orderTrackingRef(row: BackendRecord) {
  const ref = row.trackingRef || row.dispatch?.trackingRef || row.dispatches?.[0]?.trackingRef || row.vehicleNumber || row.dispatch?.vehicleNumber || row.dispatches?.[0]?.vehicleNumber;
  return ref && ref !== '-' ? ref : 'Pending';
}

export function orderDispatchDate(row: BackendRecord) {
  return row.dispatchedAt || row.dispatchDate || row.dispatch?.dispatchDate || row.dispatches?.[0]?.dispatchDate || null;
}

export function canDownloadOrderDocuments(order: BackendRecord) {
  return ['dispatched', 'partially_dispatched'].includes(normalizedOrderStatus(order));
}

export function openOrderDocument(tenant: BackendTenant | null, order: BackendRecord, type: 'invoice' | 'challan') {
  const id = orderId(order);
  if (!tenant?.id || !id) { toast.error('Tenant or order not found'); return; }
  if (!canDownloadOrderDocuments(order)) { toast.error('Invoice and challan are available only after dispatch.'); return; }
  const url = type === 'invoice'
    ? DocumentService.orderInvoiceUrl(tenant.id, id)
    : DocumentService.orderChallanUrl(tenant.id, id);
  window.open(url, '_blank', 'noopener,noreferrer');
}

export { formatCurrency };

function toDateTimeInput(value?: string | null) {
  if (!value) return '';
  const d = new Date(value);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

// ─── Context ──────────────────────────────────────────────────────────────────

type OrdersContextValue = {
  tenant: BackendTenant | null;
  orders: BackendRecord[];
  dealers: BackendRecord[];
  designs: BackendRecord[];
  stock: BackendRecord[];
  loading: boolean;
  saving: boolean;
  modalMode: ModalMode;
  selectedOrder: BackendRecord | null;
  selectedItem: BackendRecord | null;
  form: Record<string, any>;
  formError: any;
  dispatchSummary: BackendRecord | null;
  canCreate: boolean;
  canUpdate: boolean;
  canDispatch: boolean;
  canCancel: boolean;
  search: string;
  page: number;
  itemsPerPage: number;
  selectedDesignAvailability: number | null;
  designOptions: { label: string; value: string }[];
  dealerOptions: { label: string; value: string }[];
  filteredOrders: BackendRecord[];
  dispatchedOrders: BackendRecord[];
  paginatedDispatchedOrders: BackendRecord[];
  setSearch: (v: string) => void;
  setPage: (p: number) => void;
  setForm: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  setDispatchSummary: (v: BackendRecord | null) => void;
  openCreateOrder: () => void;
  openEditOrder: (order: BackendRecord) => void;
  openAddItem: (order: BackendRecord) => void;
  openEditItem: (order: BackendRecord, item: BackendRecord) => void;
  openDispatch: (order: BackendRecord) => void;
  openCancel: (order: BackendRecord) => void;
  closeModal: () => void;
  saveModal: (event: React.FormEvent) => Promise<any>;
  runOrderAction: (order: BackendRecord, action: 'confirm' | 'pack') => Promise<any>;
  deleteItem: (order: BackendRecord, item: BackendRecord) => Promise<any>;
  loadDispatchSummary: (order: BackendRecord) => Promise<any>;
  loadData: () => Promise<any>;
};

const OrdersContext = createContext<OrdersContextValue | null>(null);

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used within OrdersProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const { hasPermission } = useAuth();
  const [tenant, setTenant] = useState<BackendTenant | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<BackendRecord[]>([]);
  const [dealers, setDealers] = useState<BackendRecord[]>([]);
  const [designs, setDesigns] = useState<BackendRecord[]>([]);
  const [stock, setStock] = useState<BackendRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedOrder, setSelectedOrder] = useState<BackendRecord | null>(null);
  const [selectedItem, setSelectedItem] = useState<BackendRecord | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [formError, setFormError] = useState<any>(null);
  const [dispatchSummary, setDispatchSummary] = useState<BackendRecord | null>(null);
  const [selectedDesignAvailability, setSelectedDesignAvailability] = useState<number | null>(null);

  const canCreate = hasPermission('sales_orders.create') || hasPermission('orders.create');
  const canUpdate = hasPermission('orders.update') || hasPermission('sales_orders.update');
  const canDispatch = hasPermission('orders.dispatch') || hasPermission('orders.update');
  const canCancel = hasPermission('orders.cancel') || hasPermission('orders.update');

  useEffect(() => {
    if (form.designId && tenant?.id) {
      const existing = stock.find(s => String(s.designId) === String(form.designId) || String(s.design?.id) === String(form.designId));
      if (existing) {
        setSelectedDesignAvailability(Number(existing.availableDozens ?? existing.packagedDozens ?? 0));
      } else {
        InventoryService.getStockAvailability(tenant.id, form.designId)
          .then(res => {
            if (res.success && res.data) {
              setSelectedDesignAvailability(Number(res.data.availableDozens ?? res.data.packagedDozens ?? 0));
            } else setSelectedDesignAvailability(0);
          })
          .catch(() => setSelectedDesignAvailability(0));
      }
    } else {
      setSelectedDesignAvailability(null);
    }
  }, [form.designId, tenant?.id, stock]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const tenantRes = await CurrentOwnerService.getCurrentOwner();
      if (!tenantRes.success || !tenantRes.data) {
        toast.error(tenantRes.error?.message || 'No business tenant found');
        return;
      }
      const tenantId = tenantRes.data.id;
      setTenant(tenantRes.data);
      const [ordersRes, dealersRes, designsRes, stockRes, dispatchesRes] = await Promise.all([
        OrderService.list(tenantId, { page: 1, limit: 100 }),
        PartyService.dropdown(tenantId, { type: 'DEALER', isActive: true, limit: 100 }),
        DesignService.list(tenantId, { page: 1, limit: 100 }),
        InventoryService.listStock(tenantId, { page: 1, limit: 100 }),
        OrderService.listDispatches(tenantId, { page: 1, limit: 100 }),
      ]);

      const designsList = designsRes.success ? responseItems(designsRes.data) : [];
      const dispatchesList = dispatchesRes.success ? responseItems(dispatchesRes.data as any) : [];

      if (ordersRes.success) {
        let fetchedOrders = responseItems(ordersRes.data);
        const fastOrders = fetchedOrders.map(o => {
          const orderDispatches = dispatchesList.filter((d: any) => d.orderId === o.id);
          const enrichedItems = (o.items || o.orderItems || []).map((item: any) => {
            const design = designsList.find((dsg: any) => dsg.id === item.designId);
            return { ...item, design: item.design || design };
          });
          return { ...o, items: enrichedItems, dispatches: orderDispatches };
        });
        setOrders(fastOrders);
      } else toast.error(ordersRes.error?.message || 'Failed to load orders');

      if (dealersRes.success) setDealers(responseItems(dealersRes.data as any));
      if (designsRes.success) setDesigns(responseItems(designsRes.data));
      if (stockRes.success) setStock(responseItems(stockRes.data));
    } catch { toast.error('Failed to load orders module'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { setPage(1); }, [search]);

  const designOptions = designs.map(design => ({
    label: `${design.designCode || design.code || ''} ${design.name || ''}`.trim() || String(design.id),
    value: String(design.id),
  }));

  const dealerOptions = dealers.map(dealer => ({ label: dealer.name || dealer.code || 'Dealer', value: String(dealer.id) }));

  const filteredOrders = useMemo(() => {
    const term = search.toLowerCase();
    return orders.filter(order => orderNumber(order).toLowerCase().includes(term) || dealerName(order).toLowerCase().includes(term));
  }, [orders, search]);

  const dispatchedOrders = filteredOrders.filter(order =>
    ['packed', 'dispatched', 'delivered', 'partially_dispatched'].includes(String(order.status || order.orderStatus || '').toLowerCase())
  );

  const paginatedDispatchedOrders = useMemo(() => dispatchedOrders.slice((page - 1) * itemsPerPage, page * itemsPerPage), [dispatchedOrders, page]);

  const openCreateOrder = () => {
    setSelectedOrder(null); setSelectedItem(null); setFormError(null); setModalMode('create');
    setForm({ dealerId: dealers[0]?.id || '', designId: designs[0]?.id || '', quantityDozens: 1, pricePerDozen: 960, isCreditOrder: true, discountAmount: 0, notes: '' });
  };

  const openEditOrder = (order: BackendRecord) => {
    setSelectedOrder(order); setSelectedItem(null); setFormError(null); setModalMode('editOrder');
    setForm({ isCreditOrder: Boolean(order.isCreditOrder), discountAmount: Number(order.discountAmount || 0), notes: order.notes || '' });
  };

  const openAddItem = (order: BackendRecord) => {
    setSelectedOrder(order); setSelectedItem(null); setFormError(null); setModalMode('addItem');
    setForm({ designId: designs[0]?.id || '', quantityDozens: 1, pricePerDozen: '', notes: '' });
  };

  const openEditItem = (order: BackendRecord, item: BackendRecord) => {
    setSelectedOrder(order); setSelectedItem(item); setFormError(null); setModalMode('editItem');
    setForm({ quantityDozens: item.quantityDozens || item.quantity || 1, pricePerDozen: item.pricePerDozen || item.unitPrice || '', notes: item.notes || '' });
  };

  const openDispatch = (order: BackendRecord) => {
    setSelectedOrder(order); setSelectedItem(null); setFormError(null); setModalMode('dispatch');
    const defaultTracker = `TRK-${Math.floor(100000 + Math.random() * 900000)}`;
    const existingTracker = orderTrackingRef(order);
    setForm({
      transportMode: order.transportMode || order.dispatch?.transportMode || order.dispatches?.[0]?.transportDetails || order.dispatches?.[0]?.transportMode || 'Road',
      trackingRef: existingTracker && existingTracker !== 'Pending' ? existingTracker : defaultTracker,
      dispatchedAt: toDateTimeInput(orderDispatchDate(order) || new Date().toISOString()),
    });
  };

  const openCancel = (order: BackendRecord) => {
    setSelectedOrder(order); setSelectedItem(null); setFormError(null); setModalMode('cancel');
    setForm({ cancelReason: order.cancelReason || '' });
  };

  const closeModal = () => {
    setModalMode(null); setSelectedOrder(null); setSelectedItem(null); setForm({}); setFormError(null); setSelectedDesignAvailability(null);
  };

  const saveModal = async (event: React.FormEvent) => {
    event.preventDefault();
    const currentTenant = tenant;
    if (!currentTenant?.id) return toast.error('Tenant not found');
    setSaving(true);
    try {
      if (modalMode === 'create' || modalMode === 'addItem') {
        const reqQty = Number(form.quantityDozens || 1);
        if (selectedDesignAvailability !== null && reqQty > selectedDesignAvailability) {
          setFormError(`Cannot order more than available stock (${selectedDesignAvailability} dozens available).`);
          setSaving(false);
          return;
        }
      }

      let response: any;
      if (modalMode === 'create') {
        response = await OrderService.create(currentTenant.id, {
          dealerId: form.dealerId, isCreditOrder: Boolean(form.isCreditOrder),
          discountAmount: Number(form.discountAmount || 0), notes: form.notes || undefined,
          items: [{ designId: form.designId, quantityDozens: Number(form.quantityDozens || 1), pricePerDozen: Number(form.pricePerDozen || 0) }],
        });
      } else if (modalMode === 'editOrder' && selectedOrder?.id) {
        response = await OrderService.update(currentTenant.id, selectedOrder.id, {
          discountAmount: Number(form.discountAmount || 0), notes: form.notes || undefined, isCreditOrder: Boolean(form.isCreditOrder),
        });
      } else if (modalMode === 'addItem' && selectedOrder?.id) {
        response = await OrderService.addItem(currentTenant.id, selectedOrder.id, {
          designId: form.designId, quantityDozens: Number(form.quantityDozens || 1),
          pricePerDozen: form.pricePerDozen === '' ? undefined : Number(form.pricePerDozen || 0), notes: form.notes || undefined,
        });
      } else if (modalMode === 'editItem' && selectedOrder?.id && selectedItem?.id) {
        response = await OrderService.updateItem(currentTenant.id, selectedOrder.id, selectedItem.id, {
          quantityDozens: Number(form.quantityDozens || 1),
          pricePerDozen: form.pricePerDozen === '' ? undefined : Number(form.pricePerDozen || 0), notes: form.notes || undefined,
        });
      } else if (modalMode === 'dispatch' && selectedOrder?.id) {
        response = await OrderService.dispatch(currentTenant.id, selectedOrder.id, {
          transportDetails: String(form.transportMode || 'Road'), vehicleNumber: String(form.trackingRef || ''),
          dispatchDate: form.dispatchedAt ? new Date(form.dispatchedAt).toISOString() : new Date().toISOString(),
          items: orderItems(selectedOrder).map((item: any) => ({ orderItemId: item.id, quantityDispatched: Number(item.pendingQty || 0) })),
        });
      } else if (modalMode === 'cancel' && selectedOrder?.id) {
        response = await OrderService.cancel(currentTenant.id, selectedOrder.id, { cancelReason: form.cancelReason });
      }

      if (!response?.success) { setFormError(response?.error); return; }
      toast.success('Order updated');
      closeModal();
      await loadData();
    } catch (error: any) { setFormError(error); } finally { setSaving(false); }
  };

  const runOrderAction = async (order: BackendRecord, action: 'confirm' | 'pack') => {
    const currentTenant = tenant;
    if (!currentTenant?.id || !order.id) return toast.error('Tenant or order not found');
    setSaving(true);
    try {
      const response = action === 'confirm'
        ? await OrderService.confirm(currentTenant.id, order.id)
        : await OrderService.pack(currentTenant.id, order.id);
      if (!response.success) throw new Error(response.error?.message || `Failed to ${action} order`);
      toast.success(action === 'confirm' ? 'Order confirmed' : 'Order packed');
      await loadData();
    } catch (error: any) { toast.error(error.message || `Failed to ${action} order`); } finally { setSaving(false); }
  };

  const deleteItem = async (order: BackendRecord, item: BackendRecord) => {
    if (!order.id || !item.id || !window.confirm('Delete this order item?')) return;
    const currentTenant = tenant;
    if (!currentTenant?.id) return toast.error('Tenant not found');
    setSaving(true);
    try {
      const response = await OrderService.deleteItem(currentTenant.id, order.id, item.id);
      if (!response.success) throw new Error(response.error?.message || 'Failed to delete order item');
      toast.success('Order item deleted');
      await loadData();
    } catch (error: any) { toast.error(error.message || 'Failed to delete order item'); } finally { setSaving(false); }
  };

  const loadDispatchSummary = async (order: BackendRecord) => {
    const currentTenant = tenant;
    if (!currentTenant?.id || !order.id) return toast.error('Tenant or order not found');
    setSaving(true);
    try {
      const response = await OrderService.getById(currentTenant.id, order.id);
      if (!response.success) throw new Error(response.error?.message || 'Failed to load summary');
      setDispatchSummary(response.data);
    } catch (error: any) { toast.error(error.message || 'Failed to load summary'); } finally { setSaving(false); }
  };

  return (
    <OrdersContext.Provider value={{
      tenant, orders, dealers, designs, stock, loading, saving, modalMode, selectedOrder, selectedItem,
      form, formError, dispatchSummary, canCreate, canUpdate, canDispatch, canCancel,
      search, page, itemsPerPage, selectedDesignAvailability, designOptions, dealerOptions,
      filteredOrders, dispatchedOrders, paginatedDispatchedOrders,
      setSearch, setPage, setForm, setDispatchSummary,
      openCreateOrder, openEditOrder, openAddItem, openEditItem, openDispatch, openCancel,
      closeModal, saveModal, runOrderAction, deleteItem, loadDispatchSummary, loadData,
    }}>
      {children}
    </OrdersContext.Provider>
  );
}
