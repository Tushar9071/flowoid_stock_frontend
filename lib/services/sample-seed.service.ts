import { PartyService } from './party.service';
import { RawMaterialService } from './raw-material.service';
import {
  AssignmentService,
  BackendRecord,
  DesignService,
  InventoryService,
  OrderService,
  PaymentService,
  responseItems,
  SupplementaryService,
  WorkerService,
} from './business-modules.service';

function stamp() {
  return Date.now().toString().slice(-6);
}

async function getOrCreateCategory(tenantId: string) {
  const existing = await DesignService.listCategories(tenantId, { page: 1, limit: 50 });
  const category = responseItems(existing.data as any).find(item => String(item.name || '').toLowerCase().includes('sample'));
  if (existing.success && category?.id) return category;

  const created = await DesignService.createCategory(tenantId, {
    name: `Sample Necklace ${stamp()}`,
    sortOrder: 1,
  });
  if (!created.success) throw new Error(created.error?.message || 'Failed to seed design category');
  return created.data;
}

async function getOrCreateSupplementary(tenantId: string) {
  const existing = await SupplementaryService.list(tenantId, { page: 1, limit: 50 });
  const item = responseItems(existing.data).find(row => String(row.name || '').toLowerCase().includes('sample'));
  if (existing.success && item?.id) return item;

  const created = await SupplementaryService.create(tenantId, {
    name: `Sample Hook ${stamp()}`,
    unit: 'pieces',
    description: 'Seeded hook fitting for test designs',
    stockQuantity: 500,
  });
  if (!created.success) throw new Error(created.error?.message || 'Failed to seed supplementary material');
  return created.data;
}

async function getOrCreateDesign(tenantId: string) {
  const existing = await DesignService.list(tenantId, { page: 1, limit: 50 });
  const design = responseItems(existing.data).find(item =>
    String(item.designCode || item.code || '').startsWith('SEED-') &&
    Number(item.pieceRateRs || item.pieceRate || item.workerRatePerPiece || 0) > 0 &&
    Number(item.salePricePerDozen || item.sellingPricePerDozen || 0) > 0
  );
  if (existing.success && design?.id) return design;

  const category = await getOrCreateCategory(tenantId);
  const code = `SEED-${stamp()}`;
  const created = await DesignService.create(tenantId, {
    categoryId: category.id,
    designCode: code,
    name: `Seeded Stone Necklace ${stamp()}`,
    description: 'Seeded from frontend to test API integration',
    material: 'Gold Plated',
    finish: 'Glossy',
    diamondCount: 12,
    pieceRateRs: 18,
    pieceRate: 18,
    workerRatePerPiece: 18,
    salePricePerDozen: 960,
    sellingPricePerDozen: 960,
    status: 'ACTIVE',
    notes: 'Seed data',
  });
  if (!created.success) throw new Error(created.error?.message || 'Failed to seed design');
  return created.data;
}

async function getOrCreateParty(tenantId: string, type: 'DEALER' | 'SUPPLIER') {
  const existing = await PartyService.list(tenantId, { type, isActive: true, limit: 50 });
  const party = existing.success
    ? existing.data.items.find(item => String(item.name || '').startsWith('Seed') && Number(item.openingBalance || 0) > 0)
    : null;
  if (party?.id) return party;

  const openingBalance = type === 'DEALER' ? 15000 : 8000;
  const created = await PartyService.create(tenantId, {
    type,
    name: `Seed ${type === 'DEALER' ? 'Dealer' : 'Supplier'} ${stamp()}`,
    code: `${type.slice(0, 3)}-${stamp()}`,
    phone: `98${stamp().padStart(8, '0')}`,
    city: 'Surat',
    creditLimit: type === 'DEALER' ? 75000 : 30000,
    creditPeriodDays: type === 'DEALER' ? 30 : undefined,
    openingBalance,
    openingBalanceType: type === 'DEALER' ? 'RECEIVABLE' : 'PAYABLE',
    openingBalanceDate: new Date().toISOString(),
    notes: 'Seed data',
  });
  if (!created.success) throw new Error(created.error?.message || `Failed to seed ${type.toLowerCase()}`);
  return created.data;
}

async function getOrCreateRawMaterial(tenantId: string) {
  const existing = await RawMaterialService.listTypes(tenantId, { page: 1, limit: 50, isActive: true });
  const material = existing.success
    ? existing.data.items.find(item => String(item.name || '').startsWith('Seed') && Number(item.currentStock || 0) > 0)
    : null;
  if (material?.id) return material;

  const created = await RawMaterialService.createType(tenantId, {
    name: `Seed Metal ${stamp()}`,
    unit: 'GRAM',
    description: 'Seeded material for worker assignment',
  });
  if (!created.success) throw new Error(created.error?.message || 'Failed to seed raw material');

  const supplier = await getOrCreateParty(tenantId, 'SUPPLIER');
  await RawMaterialService.createPurchase(tenantId, {
    materialTypeId: created.data.id,
    supplierId: supplier.id,
    quantity: 500,
    costPerUnit: 12,
    purchaseDate: new Date().toISOString(),
    status: 'RECEIVED',
    invoiceNumber: `SEED-RM-${stamp()}`,
    notes: 'Seed purchase to make raw material stock non-zero',
  });

  return created.data;
}

async function getOrCreateWorker(tenantId: string) {
  const existing = await WorkerService.list(tenantId, { page: 1, limit: 50 });
  const worker = responseItems(existing.data).find(item => String(item.name || '').startsWith('Seed Worker'));
  if (existing.success && worker?.id) return worker;

  const created = await WorkerService.create(tenantId, {
    name: `Seed Worker ${stamp()}`,
    phone: `97${stamp().padStart(8, '0')}`,
    address: 'Seed workshop area',
    city: 'Ahmedabad',
    openingBalance: 1200,
    openingBalanceType: 'PAYABLE',
    openingBalanceDate: new Date().toISOString(),
    notes: 'Seed data',
  });
  if (!created.success) throw new Error(created.error?.message || 'Failed to seed worker');
  return created.data;
}

export const SampleSeedService = {
  async seedDesignModule(tenantId: string) {
    const category = await getOrCreateCategory(tenantId);
    const supplementary = await getOrCreateSupplementary(tenantId);
    const design = await getOrCreateDesign(tenantId);

    try {
      await DesignService.addSupplementaryNeed(tenantId, design.id, {
        materialTypeId: supplementary.id,
        quantityPerPiece: 2,
        notes: 'Seed supplementary need',
      });
    } catch {
      // Existing supplementary needs are acceptable for repeat seed clicks.
    }

    return { category, supplementary, design };
  },

  async seedWorkerModule(tenantId: string) {
    const worker = await getOrCreateWorker(tenantId);
    const design = await getOrCreateDesign(tenantId);
    const rawMaterial = await getOrCreateRawMaterial(tenantId);
    let assignment: BackendRecord | null = null;

    const createdAssignment = await AssignmentService.create(tenantId, {
      workerId: worker.id,
      designId: design.id,
      rawMaterialTypeId: rawMaterial.id,
      rawMaterialQty: 1,
      expectedPieces: 24,
      expectedReturnDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      notes: 'Seed assignment',
    });
    if (createdAssignment.success) assignment = createdAssignment.data;

    if (assignment?.id) {
      try {
        await AssignmentService.updateStatus(tenantId, assignment.id, { status: 'IN_PROGRESS' });
      } catch {}
      try {
        await AssignmentService.recordReturn(tenantId, assignment.id, {
          piecesReturned: 20,
          rejectedPieces: 2,
          returnedAt: new Date().toISOString(),
          rejectionNotes: 'Seed quality sample',
          notes: 'Seed goods return',
        });
      } catch {}
    }

    await WorkerService.createPayment(tenantId, {
      workerId: worker.id,
      amount: 650,
      paymentType: 'ADVANCE',
      paymentMode: 'CASH',
      paidAt: new Date().toISOString(),
      notes: 'Seed worker advance',
    });

    return { worker, assignment };
  },

  async seedOrderModule(tenantId: string) {
    const dealer = await getOrCreateParty(tenantId, 'DEALER');
    const design = await getOrCreateDesign(tenantId);
    await this.seedInventoryModule(tenantId);
    const order = await OrderService.create(tenantId, {
      dealerId: dealer.id,
      isCreditOrder: true,
      items: [
        {
          designId: design.id,
          quantityDozens: 1,
          pricePerDozen: 960,
          notes: 'Seed order item',
        },
      ],
      discountAmount: 0,
      notes: 'Seed order',
    });
    if (!order.success) throw new Error(order.error?.message || 'Failed to seed order');

    try {
      await OrderService.confirm(tenantId, order.data.id);
      await OrderService.pack(tenantId, order.data.id);
      await OrderService.dispatch(tenantId, order.data.id, {
        transportMode: 'Road',
        trackingRef: `SEED-DSP-${stamp()}`,
        dispatchedAt: new Date().toISOString(),
      });
    } catch {
      // If backend stock validation blocks dispatch, the order itself still demonstrates the workflow.
    }

    return order.data;
  },

  async seedPaymentModule(tenantId: string) {
    const dealer = await getOrCreateParty(tenantId, 'DEALER');
    const supplier = await getOrCreateParty(tenantId, 'SUPPLIER');
    const dealerPayment = await PaymentService.createDealerPayment(tenantId, {
      partyId: dealer.id,
      amount: 3200,
      paymentMethod: 'CASH',
      paymentDate: new Date().toISOString(),
      notes: 'Seed dealer receipt',
    });
    const supplierPayment = await PaymentService.createSupplierPayment(tenantId, {
      partyId: supplier.id,
      amount: 1800,
      paymentMethod: 'CASH',
      paymentDate: new Date().toISOString(),
      notes: 'Seed supplier payment',
    });
    if (!dealerPayment.success && !supplierPayment.success) {
      throw new Error(dealerPayment.error?.message || supplierPayment.error?.message || 'Failed to seed payments');
    }

    if (dealerPayment.success && dealerPayment.data?.id) {
      try {
        await PaymentService.updateStatus(tenantId, dealerPayment.data.id, {
          paymentStatus: 'CLEARED',
          notes: 'Seed cleared receipt',
        });
      } catch {}
    }

    if (supplierPayment.success && supplierPayment.data?.id) {
      try {
        await PaymentService.updateStatus(tenantId, supplierPayment.data.id, {
          paymentStatus: 'PENDING',
          notes: 'Seed pending supplier payment',
        });
      } catch {}
    }

    return { dealerPayment: dealerPayment.data, supplierPayment: supplierPayment.data };
  },

  async seedInventoryModule(tenantId: string) {
    const design = await getOrCreateDesign(tenantId);
    const supplementary = await getOrCreateSupplementary(tenantId);

    try {
      await InventoryService.createAdjustment(tenantId, design.id, {
        type: 'UNPACKAGED',
        adjustment: 36,
        notes: 'Seed finished goods before packaging',
      });
    } catch {
      // Repeated seed clicks may fail if backend blocks duplicate stock movements.
    }

    try {
      await InventoryService.createPackagingBatch(tenantId, {
        designId: design.id,
        dozensPackaged: 2,
        notes: 'Seed packaging batch',
      });
    } catch {
      // Packaging can fail if stock is already consumed; the adjustment above keeps repeat clicks harmless.
    }

    try {
      await InventoryService.updateLowStockAlert(tenantId, design.id, {
        lowStockAlertAt: 5,
      });
    } catch {
      // Alert thresholds are optional for demo readiness.
    }

    try {
      await SupplementaryService.adjustStock(tenantId, supplementary.id, {
        adjustment: 100,
        notes: 'Seed supplementary stock adjustment',
      });
    } catch {
      // Supplementary stock is supporting data only.
    }

    return { design, supplementary };
  },

  async seedFullDemoData(tenantId: string) {
    const parties = await Promise.all([
      getOrCreateParty(tenantId, 'DEALER'),
      getOrCreateParty(tenantId, 'SUPPLIER'),
    ]);
    const design = await this.seedDesignModule(tenantId);
    const rawMaterial = await getOrCreateRawMaterial(tenantId);
    const worker = await this.seedWorkerModule(tenantId);
    const inventory = await this.seedInventoryModule(tenantId);
    const order = await this.seedOrderModule(tenantId);
    const payment = await this.seedPaymentModule(tenantId);

    return { parties, design, rawMaterial, worker, inventory, order, payment };
  },
};
