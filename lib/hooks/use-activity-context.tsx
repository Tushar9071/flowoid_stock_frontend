'use client';

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { RawMaterialService } from '@/lib/services/raw-material.service';
import { WorkerService, PaymentService, AssignmentService, OrderService, responseItems } from '@/lib/services/business-modules.service';
import { Package, PlusCircle, CreditCard, Clock, HardHat } from 'lucide-react';

export interface Activity {
  id: string;
  title: string;
  subtitle: string;
  timestamp: Date;
  icon: any;
  type: string;
  isRead?: boolean;
}

interface ActivityContextType {
  activities: Activity[];
  loading: boolean;
  unreadCount: number;
  markAllAsRead: () => void;
  lastReadTimestamp: number;
  refetch: () => Promise<void>;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export function ActivityProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastReadTimestamp, setLastReadTimestamp] = useState<number>(0);

  useEffect(() => {
    // Load last read timestamp from local storage
    const stored = localStorage.getItem('flowoid_activity_last_read');
    if (stored) {
      setLastReadTimestamp(parseInt(stored, 10));
    }
  }, []);

  const fetchActivities = useCallback(async () => {
    try {
      const tenantId = "owner";

      // Fetch concurrently with lower limits for speed
      const [ordersRes, dispatchesRes, purchasesRes, materialsRes, assignmentsRes, paymentsRes] = await Promise.all([
        OrderService.list(tenantId, { limit: 4 }),
        OrderService.listDispatches(tenantId, { limit: 4 }),
        RawMaterialService.listPurchases(tenantId, { limit: 4 }),
        RawMaterialService.listTypes(tenantId, { limit: 4 }),
        AssignmentService.list(tenantId, { limit: 4 }),
        PaymentService.list(tenantId, { limit: 4 })
      ].map(p => p.catch(e => ({ success: false, data: [] }))));

      let allActivities: Activity[] = [];

      // 1. Orders
      if (ordersRes.success) {
        const orders = responseItems(ordersRes.data);
        orders.forEach((o: any) => {
          allActivities.push({
            id: `ord-${o.id}`,
            title: 'Order Created',
            subtitle: `Order ${o.orderNumber || o.orderNo || ''} from ${o.party?.name || o.dealer?.name || 'Dealer'}`,
            timestamp: new Date(o.orderDate || o.createdAt),
            icon: Package,
            type: 'order'
          });
        });
      }

      // 2. Dispatches
      if (dispatchesRes.success) {
        const dispatches = responseItems(dispatchesRes.data as any);
        dispatches.forEach((d: any) => {
          allActivities.push({
            id: `disp-${d.id}`,
            title: 'Order Dispatched',
            subtitle: `Challan ${d.challanNumber || ''} via ${d.transportMode || d.transportDetails || 'Road'}`,
            timestamp: new Date(d.dispatchDate || d.createdAt),
            icon: Package,
            type: 'dispatch'
          });
        });
      }

      // 3. Purchases
      if (purchasesRes.success) {
        const purchases = responseItems(purchasesRes.data);
        purchases.forEach((p: any) => {
          allActivities.push({
            id: `pur-${p.id}`,
            title: p.status === 'FINAL' ? 'Purchase Received' : 'Purchase Created',
            subtitle: `${p.invoiceNumber || p.reference || 'Purchase'} ${p.status === 'FINAL' ? 'marked as received' : 'created'}`,
            timestamp: new Date(p.updatedAt || p.createdAt),
            icon: Package,
            type: 'purchase'
          });
        });
      }

      // 2. Materials
      if (materialsRes.success) {
        const materials = responseItems(materialsRes.data);
        materials.forEach((m: any) => {
          allActivities.push({
            id: `mat-${m.id}`,
            title: 'Raw Material Added',
            subtitle: `${m.name} added to inventory`,
            timestamp: new Date(m.createdAt),
            icon: PlusCircle,
            type: 'material'
          });
        });
      }

      // 3. Assignments
      if (assignmentsRes.success) {
        const assignments = responseItems(assignmentsRes.data);
        assignments.forEach((a: any) => {
          allActivities.push({
            id: `ass-${a.id}`,
            title: a.status === 'CLOSED' ? 'Assignment Completed' : 'Assignment Created',
            subtitle: `Assignment #${a.assignmentNumber || a.id.slice(0,6)} ${a.status === 'CLOSED' ? 'completed' : 'started'}`,
            timestamp: new Date(a.updatedAt || a.createdAt),
            icon: HardHat,
            type: 'assignment'
          });
        });
      }

      // 3. Payments
      if (paymentsRes.success) {
        const payments = responseItems(paymentsRes.data);
        payments.forEach((p: any) => {
          allActivities.push({
            id: `pay-${p.id}`,
            title: 'Payment Recorded',
            subtitle: `Payment added for ${p.partyName || p.supplierName || 'supplier'}`,
            timestamp: new Date(p.paymentDate || p.createdAt),
            icon: CreditCard,
            type: 'payment'
          });
        });
      }

      // Sort by timestamp descending
      allActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Deduplicate by ID just in case
      const uniqueActivities = Array.from(new Map(allActivities.map(item => [item.id, item])).values());

      setActivities(uniqueActivities.slice(0, 20)); // Keep top 20
    } catch (error) {
      console.error('Failed to fetch recent activities:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
    // Optional: poll every minute
    const interval = setInterval(fetchActivities, 60000);
    return () => clearInterval(interval);
  }, [fetchActivities]);

  const markAllAsRead = () => {
    const now = Date.now();
    setLastReadTimestamp(now);
    localStorage.setItem('flowoid_activity_last_read', now.toString());
  };

  const unreadCount = activities.filter(a => a.timestamp.getTime() > lastReadTimestamp).length;

  return (
    <ActivityContext.Provider value={{
      activities,
      loading,
      unreadCount,
      markAllAsRead,
      lastReadTimestamp,
      refetch: fetchActivities
    }}>
      {children}
    </ActivityContext.Provider>
  );
}

export function useRecentActivity() {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error('useRecentActivity must be used within an ActivityProvider');
  }
  return context;
}
