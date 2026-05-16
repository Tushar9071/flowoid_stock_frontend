'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { formatCurrency } from '@/lib/constants';
import {
  CheckCircle2,
  Download,
  Edit3,
  FileText,
  Package,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Truck,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { SkeletonList, SkeletonTable } from '@/components/skeleton/Skeletons';
import { DataTable } from '@/components/shared/DataTable';
import { SimpleField, SimpleRecordModal } from '@/components/shared/simple-record-modal';
import { useAuth } from '@/lib/auth-context';
import { CurrentTenantService } from '@/lib/services/current-tenant.service';
import {
  BackendRecord,
  DesignService,
  DocumentService,
  OrderService,
  responseItems,
} from '@/lib/services/business-modules.service';
import { PartyService } from '@/lib/services/party.service';
import { SampleSeedService } from '@/lib/services/sample-seed.service';
import { BackendTenant } from '@/lib/types';

type Tab = 'orders' | 'dispatch' | 'overdue';
type ModalMode = 'create' | 'editOrder' | 'addItem' | 'editItem' | 'dispatch' | 'cancel' | null;

function prettyDate(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value));
}

function orderNumber(order: BackendRecord) {
  return order.orderNo || order.orderNumber || order.orderId || order.id?.slice(0, 8) || '-';
}

function dealerName(order: BackendRecord) {
  return order.dealer?.name || order.party?.name || order.dealerName || order.partyName || '-';
}

function orderItems(order: BackendRecord) {
  return Array.isArray(order.items) ? order.items : Array.isArray(order.orderItems) ? order.orderItems : [];
}

function orderId(order: BackendRecord) {
  return order.id || order.orderId;
}

function normalizedOrderStatus(order: BackendRecord) {
  return String(order.status || order.orderStatus || '').toLowerCase();
}

function canDownloadOrderDocuments(order: BackendRecord) {
  return ['dispatched', 'partially_dispatched'].includes(normalizedOrderStatus(order));
}

function openOrderDocument(tenant: BackendTenant | null, order: BackendRecord, type: 'invoice' | 'challan') {
  const id = orderId(order);
  if (!tenant?.id || !id) {
    toast.error('Tenant or order not found');
    return;
  }

  if (!canDownloadOrderDocuments(order)) {
    toast.error('Invoice and challan are available only after dispatch or partial dispatch.');
    return;
  }

  const url = type === 'invoice'
    ? DocumentService.orderInvoiceUrl(tenant.id, id)
    : DocumentService.orderChallanUrl(tenant.id, id);
  window.open(url, '_blank', 'noopener,noreferrer');
}

function toDateInput(value?: string | null) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

export default function OrdersDispatchPage() {
  const { hasPermission } = useAuth();
  const [tenant, setTenant] = useState<BackendTenant | null>(null);
  const [tab, setTab] = useState<Tab>('orders');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<BackendRecord[]>([]);
  const [overdueOrders, setOverdueOrders] = useState<BackendRecord[]>([]);
  const [dealers, setDealers] = useState<BackendRecord[]>([]);
  const [designs, setDesigns] = useState<BackendRecord[]>([]);
  const [seeding, setSeeding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedOrder, setSelectedOrder] = useState<BackendRecord | null>(null);
  const [selectedItem, setSelectedItem] = useState<BackendRecord | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [dispatchSummary, setDispatchSummary] = useState<BackendRecord | null>(null);

  const canCreate = hasPermission('sales_orders.create') || hasPermission('orders.create');
  const canUpdate = hasPermission('orders.update') || hasPermission('sales_orders.update');
  const canDispatch = hasPermission('orders.dispatch') || hasPermission('orders.update');
  const canCancel = hasPermission('orders.cancel') || hasPermission('orders.update');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const tenantRes = await CurrentTenantService.getCurrentTenant();
      if (!tenantRes.success || !tenantRes.data) {
        toast.error(tenantRes.error?.message || 'No business tenant found');
        return;
      }

      const tenantId = tenantRes.data.id;
      setTenant(tenantRes.data);
      const [ordersRes, overdueRes, dealersRes, designsRes] = await Promise.all([
        OrderService.list(tenantId, { page: 1, limit: 100 }),
        OrderService.overdue(tenantId, { page: 1, limit: 100 }),
        PartyService.dropdown(tenantId, { type: 'DEALER', isActive: true, limit: 100 }),
        DesignService.list(tenantId, { page: 1, limit: 100 }),
      ]);

      if (ordersRes.success) {
        let fetchedOrders = responseItems(ordersRes.data);
        if (fetchedOrders.length > 0) {
          const detailedOrders = await Promise.all(
            fetchedOrders.map(async (o) => {
              if (!o.id) return o;
              try {
                const detailRes = await OrderService.getById(tenantId, o.id);
                if (detailRes.success && detailRes.data) {
                  return { ...o, items: detailRes.data.items || detailRes.data.orderItems || o.items };
                }
              } catch {}
              return o;
            })
          );
          setOrders(detailedOrders);
        } else {
          setOrders([]);
        }
      } else {
        toast.error(ordersRes.error?.message || 'Failed to load orders');
      }

      if (overdueRes.success) {
        let fetchedOverdue = responseItems(overdueRes.data);
        if (fetchedOverdue.length > 0) {
          const detailedOverdue = await Promise.all(
            fetchedOverdue.map(async (o) => {
              if (!o.id) return o;
              try {
                const detailRes = await OrderService.getById(tenantId, o.id);
                if (detailRes.success && detailRes.data) {
                  return { ...o, items: detailRes.data.items || detailRes.data.orderItems || o.items };
                }
              } catch {}
              return o;
            })
          );
          setOverdueOrders(detailedOverdue);
        } else {
          setOverdueOrders([]);
        }
      }

      if (dealersRes.success) setDealers(responseItems(dealersRes.data as any));
      if (designsRes.success) setDesigns(responseItems(designsRes.data));
    } catch {
      toast.error('Failed to load orders module');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setPage(1);
  }, [tab, search]);

  const seedData = async () => {
    const currentTenant = tenant || (await CurrentTenantService.getCurrentTenant()).data;
    if (!currentTenant?.id) return toast.error('Tenant not found. Please login again or create a business tenant.');

    setSeeding(true);
    try {
      await SampleSeedService.seedOrderModule(currentTenant.id);
      toast.success('Seed order added');
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to seed order data');
    } finally {
      setSeeding(false);
    }
  };

  const filteredOrders = useMemo(() => {
    const term = search.toLowerCase();
    const source = tab === 'overdue' ? overdueOrders : orders;
    return source.filter(order =>
      orderNumber(order).toLowerCase().includes(term) ||
      dealerName(order).toLowerCase().includes(term)
    );
  }, [orders, overdueOrders, search, tab]);

  const dispatchedOrders = filteredOrders.filter(order =>
    ['packed', 'dispatched', 'delivered', 'partially_dispatched'].includes(String(order.status || order.orderStatus || '').toLowerCase())
  );
  
  const paginatedDispatchedOrders = useMemo(() => dispatchedOrders.slice((page - 1) * itemsPerPage, page * itemsPerPage), [dispatchedOrders, page]);

  const tabs = [
    { id: 'orders' as Tab, label: 'All Orders', icon: <FileText className="h-4 w-4" />, count: orders.length },
    { id: 'dispatch' as Tab, label: 'Dispatch Status', icon: <Truck className="h-4 w-4" />, count: dispatchedOrders.length },
    { id: 'overdue' as Tab, label: 'Overdue Credit', icon: <Package className="h-4 w-4" />, count: overdueOrders.length },
  ];

  const designOptions = designs.map(design => ({
    label: `${design.designCode || design.code || ''} ${design.name || ''}`.trim() || design.id,
    value: String(design.id),
  }));

  const dealerOptions = dealers.map(dealer => ({
    label: dealer.name || dealer.code || 'Dealer',
    value: String(dealer.id),
  }));

  const modalFields = useMemo<SimpleField[]>(() => {
    if (modalMode === 'create') {
      return [
        { name: 'dealerId', label: 'Dealer', type: 'select', required: true, options: dealerOptions },
        { name: 'designId', label: 'Design', type: 'select', required: true, options: designOptions },
        { name: 'quantityDozens', label: 'Quantity Dozens', type: 'number', required: true },
        { name: 'pricePerDozen', label: 'Price Per Dozen', type: 'number', required: true },
        { name: 'isCreditOrder', label: 'Credit Order', type: 'checkbox' },
        { name: 'discountAmount', label: 'Discount', type: 'number' },
        { name: 'notes', label: 'Notes', type: 'textarea' },
      ];
    }

    if (modalMode === 'editOrder') {
      return [
        { name: 'isCreditOrder', label: 'Credit Order', type: 'checkbox' },
        { name: 'discountAmount', label: 'Discount', type: 'number' },
        { name: 'notes', label: 'Notes', type: 'textarea' },
      ];
    }

    if (modalMode === 'addItem') {
      return [
        { name: 'designId', label: 'Design', type: 'select', required: true, options: designOptions },
        { name: 'quantityDozens', label: 'Quantity Dozens', type: 'number', required: true },
        { name: 'pricePerDozen', label: 'Price Per Dozen', type: 'number' },
        { name: 'notes', label: 'Notes', type: 'textarea' },
      ];
    }

    if (modalMode === 'editItem') {
      return [
        { name: 'quantityDozens', label: 'Quantity Dozens', type: 'number', required: true },
        { name: 'pricePerDozen', label: 'Price Per Dozen', type: 'number' },
        { name: 'notes', label: 'Notes', type: 'textarea' },
      ];
    }

    if (modalMode === 'dispatch') {
      return [
        { name: 'transportMode', label: 'Transport Mode', required: true },
        { name: 'trackingRef', label: 'Tracking Reference' },
        { name: 'dispatchedAt', label: 'Dispatch Date', type: 'date' },
      ];
    }

    if (modalMode === 'cancel') {
      return [{ name: 'cancelReason', label: 'Cancel Reason', type: 'textarea', required: true }];
    }

    return [];
  }, [dealerOptions, designOptions, modalMode]);

  const openCreateOrder = () => {
    setSelectedOrder(null);
    setSelectedItem(null);
    setModalMode('create');
    setForm({
      dealerId: dealers[0]?.id || '',
      designId: designs[0]?.id || '',
      quantityDozens: 1,
      pricePerDozen: 960,
      isCreditOrder: true,
      discountAmount: 0,
      notes: '',
    });
  };

  const openEditOrder = (order: BackendRecord) => {
    setSelectedOrder(order);
    setSelectedItem(null);
    setModalMode('editOrder');
    setForm({
      isCreditOrder: Boolean(order.isCreditOrder),
      discountAmount: Number(order.discountAmount || 0),
      notes: order.notes || '',
    });
  };

  const openAddItem = (order: BackendRecord) => {
    setSelectedOrder(order);
    setSelectedItem(null);
    setModalMode('addItem');
    setForm({ designId: designs[0]?.id || '', quantityDozens: 1, pricePerDozen: '', notes: '' });
  };

  const openEditItem = (order: BackendRecord, item: BackendRecord) => {
    setSelectedOrder(order);
    setSelectedItem(item);
    setModalMode('editItem');
    setForm({
      quantityDozens: item.quantityDozens || item.quantity || 1,
      pricePerDozen: item.pricePerDozen || item.unitPrice || '',
      notes: item.notes || '',
    });
  };

  const openDispatch = (order: BackendRecord) => {
    setSelectedOrder(order);
    setSelectedItem(null);
    setModalMode('dispatch');
    setForm({
      transportMode: order.transportMode || order.dispatch?.transportMode || 'Road',
      trackingRef: order.trackingRef || order.dispatch?.trackingRef || '',
      dispatchedAt: toDateInput(order.dispatchedAt || order.dispatchDate),
    });
  };

  const openCancel = (order: BackendRecord) => {
    setSelectedOrder(order);
    setSelectedItem(null);
    setModalMode('cancel');
    setForm({ cancelReason: order.cancelReason || '' });
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedOrder(null);
    setSelectedItem(null);
    setForm({});
  };

  const saveModal = async (event: React.FormEvent) => {
    event.preventDefault();
    const currentTenant = tenant || (await CurrentTenantService.getCurrentTenant()).data;
    if (!currentTenant?.id) return toast.error('Tenant not found');

    setSaving(true);
    try {
      let response;
      if (modalMode === 'create') {
        response = await OrderService.create(currentTenant.id, {
          dealerId: form.dealerId,
          isCreditOrder: Boolean(form.isCreditOrder),
          discountAmount: Number(form.discountAmount || 0),
          notes: form.notes || undefined,
          items: [{
            designId: form.designId,
            quantityDozens: Number(form.quantityDozens || 1),
            pricePerDozen: Number(form.pricePerDozen || 0),
          }],
        });
      } else if (modalMode === 'editOrder' && selectedOrder?.id) {
        response = await OrderService.update(currentTenant.id, selectedOrder.id, {
          discountAmount: Number(form.discountAmount || 0),
          notes: form.notes || undefined,
          isCreditOrder: Boolean(form.isCreditOrder),
        });
      } else if (modalMode === 'addItem' && selectedOrder?.id) {
        response = await OrderService.addItem(currentTenant.id, selectedOrder.id, {
          designId: form.designId,
          quantityDozens: Number(form.quantityDozens || 1),
          pricePerDozen: form.pricePerDozen === '' ? undefined : Number(form.pricePerDozen || 0),
          notes: form.notes || undefined,
        });
      } else if (modalMode === 'editItem' && selectedOrder?.id && selectedItem?.id) {
        response = await OrderService.updateItem(currentTenant.id, selectedOrder.id, selectedItem.id, {
          quantityDozens: Number(form.quantityDozens || 1),
          pricePerDozen: form.pricePerDozen === '' ? undefined : Number(form.pricePerDozen || 0),
          notes: form.notes || undefined,
        });
      } else if (modalMode === 'dispatch' && selectedOrder?.id) {
        response = await OrderService.dispatch(currentTenant.id, selectedOrder.id, {
          transportMode: form.transportMode,
          trackingRef: form.trackingRef || undefined,
          dispatchedAt: form.dispatchedAt ? new Date(form.dispatchedAt).toISOString() : undefined,
        });
      } else if (modalMode === 'cancel' && selectedOrder?.id) {
        response = await OrderService.cancel(currentTenant.id, selectedOrder.id, {
          cancelReason: form.cancelReason,
        });
      }

      if (!response?.success) throw new Error(response?.error?.message || 'Failed to save order action');
      toast.success('Order updated');
      closeModal();
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save order action');
    } finally {
      setSaving(false);
    }
  };

  const runOrderAction = async (order: BackendRecord, action: 'confirm' | 'pack') => {
    const currentTenant = tenant || (await CurrentTenantService.getCurrentTenant()).data;
    if (!currentTenant?.id || !order.id) return toast.error('Tenant or order not found');

    setSaving(true);
    try {
      const response = action === 'confirm'
        ? await OrderService.confirm(currentTenant.id, order.id)
        : await OrderService.pack(currentTenant.id, order.id);
      if (!response.success) throw new Error(response.error?.message || `Failed to ${action} order`);
      toast.success(action === 'confirm' ? 'Order confirmed' : 'Order packed');
      await loadData();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${action} order`);
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (order: BackendRecord, item: BackendRecord) => {
    if (!order.id || !item.id || !window.confirm('Delete this order item?')) return;
    const currentTenant = tenant || (await CurrentTenantService.getCurrentTenant()).data;
    if (!currentTenant?.id) return toast.error('Tenant not found');

    setSaving(true);
    try {
      const response = await OrderService.deleteItem(currentTenant.id, order.id, item.id);
      if (!response.success) throw new Error(response.error?.message || 'Failed to delete order item');
      toast.success('Order item deleted');
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete order item');
    } finally {
      setSaving(false);
    }
  };

  const loadDispatchSummary = async (order: BackendRecord) => {
    const currentTenant = tenant || (await CurrentTenantService.getCurrentTenant()).data;
    if (!currentTenant?.id || !order.id) return toast.error('Tenant or order not found');

    setSaving(true);
    try {
      const response = await OrderService.getById(currentTenant.id, order.id);
      if (!response.success) throw new Error(response.error?.message || 'Failed to load summary');
      setDispatchSummary(response.data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load summary');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout
      title="Orders & Dispatch"
      subtitle="Backend connected order lifecycle, line items, dispatch actions, overdue lists, and documents"
      action={
        <div className="flex flex-wrap gap-2">
          {canCreate && tab === 'orders' && (
            <button onClick={openCreateOrder} className="inline-flex items-center gap-2 rounded-lg theme-accent-btn px-5 py-2.5 text-sm font-semibold transition-colors">
              <Plus className="h-4 w-4" />
              Create Order
            </button>
          )}
        </div>
      }
    >
      <div className="mb-6 flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl bg-[#e5e7eb] p-1">
        {tabs.map(item => (
          <button key={item.id} onClick={() => setTab(item.id)} className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm transition-all ${tab === item.id ? 'theme-tab-active' : 'theme-tab-inactive'}`}>
            {item.icon} {item.label}
            <span className="rounded-full bg-white/60 px-2 py-0.5 text-[11px] font-bold">{item.count}</span>
          </button>
        ))}
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
          <input
            type="text"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder={`Search ${tab}...`}
            className="h-9 w-full rounded-lg border border-[#e5e7eb] bg-[#f9fafb] pl-9 pr-3 text-sm outline-none transition-all focus:border-[#0F2A4A] focus:bg-white focus:ring-2 focus:ring-[#0F2A4A]/10"
          />
        </div>
        <button onClick={loadData} className="theme-secondary-btn inline-flex h-9 w-fit items-center gap-2 rounded-lg px-3 text-sm font-semibold">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {loading && (tab === 'dispatch' ? <SkeletonTable rows={8} cols={6} /> : <SkeletonList count={6} />)}

      {!loading && (tab === 'orders' || tab === 'overdue') && (
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <div key={order.id} className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white theme-card-accent">
              <div className="p-5">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <span className="mb-1.5 inline-block rounded bg-[#f3f4f6] px-2 py-0.5 text-[11px] font-semibold text-[#6b7280]">{orderNumber(order)}</span>
                    <h3 className="text-[18px] font-bold theme-text-primary">{dealerName(order)}</h3>
                    <p className="mt-0.5 text-sm text-[#6b7280]">Ordered on {prettyDate(order.orderDate || order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <StatusPill status={String(order.status || order.orderStatus || 'draft')} />
                    <p className="mt-2 text-[18px] font-bold theme-text-primary">{formatCurrency(Number(order.totalAmount || order.grandTotal || order.totalValue || 0))}</p>
                  </div>
                </div>

                <div className="mb-5 space-y-3 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">Order Items</p>
                    {canUpdate && order.id && (
                      <button onClick={() => openAddItem(order)} className="theme-secondary-btn inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold">
                        <Plus className="h-3.5 w-3.5" /> Item
                      </button>
                    )}
                  </div>
                  {orderItems(order).map((item: BackendRecord, index: number) => {
                    const designName = item.design?.name || item.design?.code || item.designName || item.designCode || item.name || item.designId || '-';
                    const qty = item.quantityDozens || item.quantity || item.dozens || item.orderedQuantity || item.pieces || 0;
                    const rate = item.pricePerDozen || item.rate || item.unitPrice || item.price || 0;
                    const itemTotal = item.totalAmount || item.total || (qty * rate);

                    return (
                      <div key={item.id || index} className="flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-8 w-8 flex-none items-center justify-center rounded border border-[#e5e7eb] bg-white">
                            <Package className="h-4 w-4 text-[#9ca3af]" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold theme-text-primary">{designName}</p>
                            <p className="text-[12px] text-[#6b7280]">{qty} doz x {formatCurrency(Number(rate))}</p>
                          </div>
                        </div>
                        <div className="flex flex-none items-center gap-2">
                          <p className="text-sm font-bold theme-text-primary">{formatCurrency(Number(itemTotal))}</p>
                        {canUpdate && item.id && (
                          <>
                            <button onClick={() => openEditItem(order, item)} className="theme-secondary-btn rounded-lg p-1.5" aria-label="Edit item">
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => deleteItem(order, item)} className="theme-secondary-btn rounded-lg p-1.5 text-[#cc2200]" aria-label="Delete item">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
                {orderItems(order).length === 0 && <p className="text-sm text-[#6b7280]">No line items returned by API.</p>}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f3f4f6] pt-4">
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">Payment:</p>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F2A4A]">{order.paymentStatus || (order.isCreditOrder ? 'credit' : 'cash')}</span>
                  </div>
                  <OrderActions
                    order={order}
                    tenant={tenant}
                    canUpdate={canUpdate}
                    canDispatch={canDispatch}
                    canCancel={canCancel}
                    saving={saving}
                    onEdit={openEditOrder}
                    onConfirm={target => runOrderAction(target, 'confirm')}
                    onPack={target => runOrderAction(target, 'pack')}
                    onDispatch={openDispatch}
                    onCancel={openCancel}
                    onSummary={loadDispatchSummary}
                  />
                </div>
              </div>
            </div>
          ))}
          {filteredOrders.length === 0 && <EmptyState text="No orders found." tenant={tenant} />}
        </div>
      )}

      {!loading && tab === 'dispatch' && (
        <DataTable
          headers={['Order ID', 'Dealer', 'Tracker Number', 'Dispatch Date', 'Status', 'Action']}
          loading={loading}
          page={page}
          totalPages={Math.ceil(dispatchedOrders.length / itemsPerPage)}
          totalItems={dispatchedOrders.length}
          onPageChange={setPage}
          emptyIcon={<Truck className="h-6 w-6 text-slate-400" />}
          emptyTitle="No dispatch records found"
        >
          {paginatedDispatchedOrders.map((order, index) => (
            <tr key={order.id} className="theme-table-row">
              <td className="px-5 py-4 text-sm font-semibold theme-text-primary">
                <div className="flex items-center gap-3">
                  <div className="theme-icon-chip flex h-8 w-8 items-center justify-center rounded-lg">
                    <Truck className="h-4 w-4" />
                  </div>
                  {orderNumber(order)}
                </div>
              </td>
              <td className="px-5 py-4 text-sm font-bold text-[#374151]">{dealerName(order)}</td>
              <td className="px-5 py-4 text-sm font-mono text-[#6b7280]">{order.trackingRef || order.dispatch?.trackingRef || '-'}</td>
              <td className="px-5 py-4 text-sm text-[#6b7280]">{prettyDate(order.dispatchedAt || order.dispatchDate)}</td>
              <td className="px-5 py-4"><StatusPill status={String(order.status || order.orderStatus || '-')} /></td>
              <td className="px-5 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <button onClick={() => loadDispatchSummary(order)} className="theme-secondary-btn rounded-lg px-3 py-1.5 text-xs font-semibold">
                    Summary
                  </button>
                  {tenant && orderId(order) && (
                    <button onClick={() => openOrderDocument(tenant, order, 'challan')} className="theme-secondary-btn rounded-lg px-3 py-1.5 text-xs font-semibold">
                      Challan
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      {modalMode && (
        <SimpleRecordModal
          title={modalTitle(modalMode)}
          subtitle="Saved through the tenant scoped Swagger order APIs"
          fields={modalFields}
          values={form}
          saving={saving}
          submitLabel={modalSubmit(modalMode)}
          onChange={(name, value) => setForm(current => ({ ...current, [name]: value }))}
          onClose={closeModal}
          onSubmit={saveModal}
        />
      )}

      {dispatchSummary && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/45 p-3 sm:items-center sm:p-6">
          <div className="theme-modal-panel w-full max-w-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <div>
                <h2 className="text-xl font-bold theme-text-primary">Dispatch Summary</h2>
                <p className="text-sm text-slate-500">{dispatchSummary.orderNo || dispatchSummary.orderNumber || dispatchSummary.id || 'Order dispatch details'}</p>
              </div>
              <button onClick={() => setDispatchSummary(null)} className="theme-secondary-btn rounded-lg p-2">
                <XCircle className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto p-4 sm:p-6 bg-slate-50">
              <OrderSummaryView summary={dispatchSummary} />
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function modalTitle(mode: Exclude<ModalMode, null>) {
  const titles = {
    create: 'Create Order',
    editOrder: 'Edit Order',
    addItem: 'Add Order Item',
    editItem: 'Edit Order Item',
    dispatch: 'Dispatch Order',
    cancel: 'Cancel Order',
  };
  return titles[mode];
}

function modalSubmit(mode: Exclude<ModalMode, null>) {
  const labels = {
    create: 'Create Order',
    editOrder: 'Update Order',
    addItem: 'Add Item',
    editItem: 'Update Item',
    dispatch: 'Dispatch',
    cancel: 'Cancel Order',
  };
  return labels[mode];
}

function OrderActions({
  order,
  tenant,
  canUpdate,
  canDispatch,
  canCancel,
  saving,
  onEdit,
  onConfirm,
  onPack,
  onDispatch,
  onCancel,
  onSummary,
}: {
  order: BackendRecord;
  tenant: BackendTenant | null;
  canUpdate: boolean;
  canDispatch: boolean;
  canCancel: boolean;
  saving: boolean;
  onEdit: (order: BackendRecord) => void;
  onConfirm: (order: BackendRecord) => void;
  onPack: (order: BackendRecord) => void;
  onDispatch: (order: BackendRecord) => void;
  onCancel: (order: BackendRecord) => void;
  onSummary: (order: BackendRecord) => void;
}) {
  const status = normalizedOrderStatus(order);
  const isDraftOrPending = status === 'draft' || status === 'pending';
  const isConfirmed = status === 'confirmed';
  const isPacked = status === 'packed';
  const canBeDispatched = isPacked || status === 'partially_dispatched';
  const canBeCancelled = isDraftOrPending || isConfirmed || isPacked;

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {canUpdate && (
        <>
          {(isDraftOrPending || isConfirmed) && (
            <button disabled={saving} onClick={() => onEdit(order)} className="theme-secondary-btn inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold">
              <Edit3 className="h-3.5 w-3.5" /> Edit
            </button>
          )}
          {isDraftOrPending && (
            <button disabled={saving} onClick={() => onConfirm(order)} className="theme-secondary-btn inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" /> Confirm
            </button>
          )}
          {isConfirmed && (
            <button disabled={saving} onClick={() => onPack(order)} className="theme-secondary-btn inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold">
              <Package className="h-3.5 w-3.5" /> Pack
            </button>
          )}
        </>
      )}
      {canDispatch && canBeDispatched && (
        <button disabled={saving} onClick={() => onDispatch(order)} className="theme-secondary-btn inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold">
          <Truck className="h-3.5 w-3.5" /> Dispatch
        </button>
      )}
      <button onClick={() => onSummary(order)} className="theme-secondary-btn inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold">
        <FileText className="h-3.5 w-3.5" /> Summary
      </button>
      {tenant && orderId(order) && (
        <>
          <button
            type="button"
            onClick={() => openOrderDocument(tenant, order, 'invoice')}
            className={`theme-secondary-btn inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold ${!canDownloadOrderDocuments(order) ? 'opacity-60' : ''}`}
            title={canDownloadOrderDocuments(order) ? 'Download invoice' : 'Dispatch this order before downloading invoice'}
          >
            <Download className="h-3.5 w-3.5" /> Invoice
          </button>
          <button
            type="button"
            onClick={() => openOrderDocument(tenant, order, 'challan')}
            className={`theme-secondary-btn inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold ${!canDownloadOrderDocuments(order) ? 'opacity-60' : ''}`}
            title={canDownloadOrderDocuments(order) ? 'Download challan' : 'Dispatch this order before downloading challan'}
          >
            <Truck className="h-3.5 w-3.5" /> Challan
          </button>
        </>
      )}
      {canCancel && canBeCancelled && (
        <button disabled={saving} onClick={() => onCancel(order)} className="theme-secondary-btn inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#cc2200]">
          <XCircle className="h-3.5 w-3.5" /> Cancel
        </button>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const cls =
    normalized === 'delivered' ? 'bg-[#e6f9f0] text-[#1a7a4a]' :
    normalized === 'packed' || normalized === 'dispatched' || normalized === 'partially_dispatched' ? 'bg-[#fffbeb] text-[#d97706]' :
    normalized === 'draft' || normalized === 'cancelled' ? 'bg-[#fff0f0] text-[#cc2200]' :
    'bg-[#f3f4f6] text-[#6b7280]';
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${cls}`}>{normalized.replace(/_/g, ' ')}</span>;
}



function EmptyState({ text, tenant }: { text: string; tenant?: BackendTenant | null }) {
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-12 text-center text-sm font-medium text-[#6b7280]">
      {tenant === null ? 'A tenant is required before orders can be loaded.' : text}
    </div>
  );
}

function OrderSummaryView({ summary }: { summary: any }) {
  if (!summary) return null;

  const orderData = summary.order || summary;
  const items = summary.items || summary.orderItems || summary.dispatchItems || orderData.items || orderData.orderItems || [];
  const status = normalizedOrderStatus(orderData);
  const total = summary.totalAmount || summary.total || summary.finalAmount || orderData.totalAmount || orderData.total || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Order No</p>
          <p className="mt-1 text-base font-bold theme-text-primary">{summary.orderNo || summary.orderNumber || orderData.orderNo || orderData.orderNumber || orderData.id || '-'}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Status</p>
          <div className="mt-1">
            <StatusPill status={status} />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Party / Dealer</p>
          <p className="mt-1 text-sm font-semibold theme-text-primary">{summary.party?.name || summary.dealer?.name || orderData.party?.name || orderData.dealer?.name || summary.partyName || orderData.partyName || '-'}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Date</p>
          <p className="mt-1 text-sm font-semibold theme-text-primary">{prettyDate(summary.createdAt || summary.orderDate || orderData.createdAt || orderData.orderDate)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Expected Delivery</p>
          <p className="mt-1 text-sm font-semibold theme-text-primary">{prettyDate(summary.expectedDeliveryDate || summary.deliveryDate || orderData.expectedDeliveryDate || orderData.deliveryDate)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Tracking Ref</p>
          <p className="mt-1 text-sm font-semibold theme-text-primary">{summary.trackingRef || summary.dispatch?.trackingRef || orderData.trackingRef || orderData.dispatch?.trackingRef || '-'}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
          <h3 className="text-sm font-bold theme-text-primary">Order Items</h3>
        </div>
        {items.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500">No items found in this order.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">Design</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-widest text-slate-500">Qty (Doz)</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-widest text-slate-500">Rate</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-widest text-slate-500">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item: any, idx: number) => {
                  const designName = item.design?.name || item.design?.code || item.designName || item.designCode || item.name || item.designId || 'Unknown Design';
                  const qty = item.quantityDozens || item.quantity || item.dozens || item.orderedQuantity || item.dispatchedQuantity || item.pieces || 0;
                  const rate = item.pricePerDozen || item.rate || item.unitPrice || item.price || item.ratePerDozen || 0;
                  const itemTotal = item.lineTotal || item.total || item.totalAmount || (qty * rate);

                  return (
                    <tr key={item.id || idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <p className="font-bold theme-text-primary">{designName}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">{qty}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(rate)}</td>
                      <td className="px-4 py-3 text-right font-bold theme-text-primary">{formatCurrency(itemTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right text-xs font-bold uppercase tracking-widest text-slate-500">Grand Total</td>
                  <td className="px-4 py-3 text-right text-base font-black text-[#1a7a4a]">{formatCurrency(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {(summary.notes || summary.remarks) && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Notes & Remarks</p>
          <p className="mt-1 text-sm text-slate-700">{summary.notes || summary.remarks}</p>
        </div>
      )}
    </div>
  );
}
