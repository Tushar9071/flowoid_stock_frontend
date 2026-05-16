# Workers Module Frontend API Documentation

## Recommended Module

After `Supplementary Materials`, implement `Workers`.

Reason:

- Workers are required before worker assignments.
- Worker profile, worker payments, and worker ledger are separate UI surfaces.
- This module can be implemented before assignments because assignment list APIs under worker detail will start showing data once assignments are added later.

Base URL:

```text
/api/tenants/:tenantId/workers
```

Authentication:

```http
Authorization: Bearer <accessToken>
```

Common success response:

```json
{
  "success": true,
  "data": {}
}
```

Common error response:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {}
  }
}
```

Worker opening balance types:

```json
["PAYABLE", "RECEIVABLE"]
```

Worker payment types:

```json
["EARNING_SETTLEMENT", "ADVANCE", "ADVANCE_RECOVERY"]
```

Assignment statuses shown in worker assignment filters:

```json
["ISSUED", "IN_PROGRESS", "PARTIALLY_RETURNED", "COMPLETED", "CLOSED"]
```

## Frontend Implementation Order

1. Worker list
2. Create and update worker
3. Worker detail summary
4. Worker payments
5. Worker ledger
6. Worker assignment tab
7. Delete worker

## Data Models

### Worker

```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "name": "Ramesh Kumar",
  "phone": "9876543210",
  "alternatePhone": "9876500000",
  "address": "Main road",
  "city": "Rajkot",
  "idProofType": "Aadhar",
  "idProofNumber": "1234-5678-9012",
  "openingBalance": "1000.00",
  "openingBalanceType": "PAYABLE",
  "openingBalanceDate": "2026-05-01T00:00:00.000Z",
  "notes": "Experienced necklace worker",
  "isActive": true,
  "deletedAt": null,
  "createdAt": "2026-05-15T08:30:00.000Z",
  "updatedAt": "2026-05-15T08:30:00.000Z"
}
```

### Worker Detail Summary

```json
{
  "totalEarned": "5000.00",
  "totalPaid": "2500.00",
  "advanceGiven": "500.00",
  "outstandingBalance": "2000.00",
  "activeAssignments": 2,
  "totalPiecesDelivered": 400
}
```

### Worker Payment

```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "workerId": "uuid",
  "amount": "500.00",
  "paymentType": "EARNING_SETTLEMENT",
  "paymentMode": "CASH",
  "paidAt": "2026-05-15T08:30:00.000Z",
  "notes": "Weekly payment",
  "recordedById": "uuid",
  "createdAt": "2026-05-15T08:30:00.000Z",
  "updatedAt": "2026-05-15T08:30:00.000Z"
}
```

## Worker Profile APIs

### 1. List Workers

```http
GET /api/tenants/:tenantId/workers?page=1&limit=20&search=ramesh&city=Rajkot&isActive=true
```

Query params:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| page | number | No | Default `1` |
| limit | number | No | Default `20`, max `100` |
| search | string | No | Searches worker name and phone |
| city | string | No | Exact city filter, case-insensitive |
| isActive | boolean | No | `true` or `false` |

Response:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "tenantId": "uuid",
        "name": "Ramesh Kumar",
        "phone": "9876543210",
        "alternatePhone": "9876500000",
        "address": "Main road",
        "city": "Rajkot",
        "idProofType": "Aadhar",
        "idProofNumber": "1234-5678-9012",
        "openingBalance": "1000.00",
        "openingBalanceType": "PAYABLE",
        "openingBalanceDate": "2026-05-01T00:00:00.000Z",
        "notes": "Experienced necklace worker",
        "isActive": true,
        "deletedAt": null,
        "createdAt": "2026-05-15T08:30:00.000Z",
        "updatedAt": "2026-05-15T08:30:00.000Z",
        "activeAssignments": 2
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 1,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
}
```

### 2. Get Worker By ID

```http
GET /api/tenants/:tenantId/workers/:id
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "name": "Ramesh Kumar",
    "phone": "9876543210",
    "alternatePhone": "9876500000",
    "address": "Main road",
    "city": "Rajkot",
    "idProofType": "Aadhar",
    "idProofNumber": "1234-5678-9012",
    "openingBalance": "1000.00",
    "openingBalanceType": "PAYABLE",
    "openingBalanceDate": "2026-05-01T00:00:00.000Z",
    "notes": "Experienced necklace worker",
    "isActive": true,
    "deletedAt": null,
    "createdAt": "2026-05-15T08:30:00.000Z",
    "updatedAt": "2026-05-15T08:30:00.000Z",
    "summary": {
      "totalEarned": "5000.00",
      "totalPaid": "2500.00",
      "advanceGiven": "500.00",
      "outstandingBalance": "2000.00",
      "activeAssignments": 2,
      "totalPiecesDelivered": 400
    }
  }
}
```

### 3. Create Worker

```http
POST /api/tenants/:tenantId/workers
```

Request:

```json
{
  "name": "Ramesh Kumar",
  "phone": "9876543210",
  "alternatePhone": "9876500000",
  "address": "Main road",
  "city": "Rajkot",
  "idProofType": "Aadhar",
  "idProofNumber": "1234-5678-9012",
  "openingBalance": 1000,
  "openingBalanceType": "PAYABLE",
  "openingBalanceDate": "2026-05-01T00:00:00.000Z",
  "notes": "Experienced necklace worker"
}
```

Validation:

- `name`: required string, min 2 chars, max 160 chars
- `phone`: optional, 6 to 20 valid phone characters
- `alternatePhone`: optional, 6 to 20 valid phone characters
- `address`: optional string
- `city`: optional string
- `idProofType`: optional string
- `idProofNumber`: optional string
- `openingBalance`: optional number, minimum `0`, default `0`
- `openingBalanceType`: optional, default `PAYABLE`, one of `PAYABLE`, `RECEIVABLE`
- `openingBalanceDate`: optional date
- `notes`: optional string

Response `201`:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "name": "Ramesh Kumar",
    "phone": "9876543210",
    "alternatePhone": "9876500000",
    "address": "Main road",
    "city": "Rajkot",
    "idProofType": "Aadhar",
    "idProofNumber": "1234-5678-9012",
    "openingBalance": "1000.00",
    "openingBalanceType": "PAYABLE",
    "openingBalanceDate": "2026-05-01T00:00:00.000Z",
    "notes": "Experienced necklace worker",
    "isActive": true,
    "deletedAt": null,
    "createdAt": "2026-05-15T08:30:00.000Z",
    "updatedAt": "2026-05-15T08:30:00.000Z"
  }
}
```

### 4. Update Worker

```http
PATCH /api/tenants/:tenantId/workers/:id
```

Request:

```json
{
  "name": "Ramesh Kumar Updated",
  "phone": "9876543210",
  "alternatePhone": "9876500000",
  "address": "Updated address",
  "city": "Surat",
  "idProofType": "PAN",
  "idProofNumber": "ABCDE1234F",
  "openingBalance": 1200,
  "openingBalanceType": "PAYABLE",
  "openingBalanceDate": "2026-05-01T00:00:00.000Z",
  "notes": "Updated note"
}
```

Validation:

- At least one field is required.
- Same field rules as create worker.

Response:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "name": "Ramesh Kumar Updated",
    "phone": "9876543210",
    "alternatePhone": "9876500000",
    "address": "Updated address",
    "city": "Surat",
    "idProofType": "PAN",
    "idProofNumber": "ABCDE1234F",
    "openingBalance": "1200.00",
    "openingBalanceType": "PAYABLE",
    "openingBalanceDate": "2026-05-01T00:00:00.000Z",
    "notes": "Updated note",
    "isActive": true,
    "deletedAt": null,
    "createdAt": "2026-05-15T08:30:00.000Z",
    "updatedAt": "2026-05-15T08:40:00.000Z"
  }
}
```

### 5. Delete Worker

```http
DELETE /api/tenants/:tenantId/workers/:id
```

Response:

```json
{
  "success": true,
  "data": {
    "message": "Worker deleted successfully"
  }
}
```

Business rules:

- Delete is a soft delete.
- Worker cannot be deleted if they have active assignments in `ISSUED`, `IN_PROGRESS`, or `PARTIALLY_RETURNED`.

## Worker Assignment APIs

### 6. List Worker Assignments

```http
GET /api/tenants/:tenantId/workers/:id/assignments?page=1&limit=20&status=ISSUED
```

Query params:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| page | number | No | Default `1` |
| limit | number | No | Default `20`, max `100` |
| status | string | No | Assignment status filter |

Response:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "tenantId": "uuid",
        "workerId": "uuid",
        "designId": "uuid",
        "rawMaterialTypeId": "uuid",
        "rawMaterialQty": "2.5000",
        "expectedPieces": 100,
        "returnedPieces": 40,
        "rejectedPieces": 2,
        "pieceRateAtAssignment": "12.50",
        "totalEarned": "500.00",
        "status": "PARTIALLY_RETURNED",
        "issuedAt": "2026-05-15T08:30:00.000Z",
        "expectedReturnDate": "2026-05-25T00:00:00.000Z",
        "completedAt": null,
        "notes": "Urgent work",
        "createdById": "uuid",
        "createdAt": "2026-05-15T08:30:00.000Z",
        "updatedAt": "2026-05-15T08:30:00.000Z",
        "design": {
          "id": "uuid",
          "categoryId": "uuid",
          "designCode": "AY-NK-001",
          "name": "Classic Necklace",
          "status": "ACTIVE",
          "category": {
            "id": "uuid",
            "tenantId": "uuid",
            "name": "Necklace",
            "sortOrder": 1,
            "isActive": true,
            "createdAt": "2026-05-15T08:30:00.000Z",
            "updatedAt": "2026-05-15T08:30:00.000Z"
          }
        },
        "rawMaterialType": {
          "id": "uuid",
          "tenantId": "uuid",
          "name": "Brass Wire",
          "unit": "KG",
          "description": "Raw brass wire",
          "isActive": true,
          "deletedAt": null,
          "createdAt": "2026-05-15T08:30:00.000Z",
          "updatedAt": "2026-05-15T08:30:00.000Z"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 1,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
}
```

## Worker Payment APIs

Important route note:

- `/payments` routes are registered before `/:id`, so use the exact payment URLs below.

### 7. List All Worker Payments

```http
GET /api/tenants/:tenantId/workers/payments?page=1&limit=20&workerId=:workerId&paymentType=ADVANCE&dateFrom=2026-05-01&dateTo=2026-05-31
```

Query params:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| page | number | No | Default `1` |
| limit | number | No | Default `20`, max `100` |
| workerId | uuid | No | Filter by worker |
| paymentType | string | No | `EARNING_SETTLEMENT`, `ADVANCE`, `ADVANCE_RECOVERY` |
| dateFrom | date | No | Paid date from |
| dateTo | date | No | Paid date to |

Response:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "tenantId": "uuid",
        "workerId": "uuid",
        "amount": "500.00",
        "paymentType": "ADVANCE",
        "paymentMode": "CASH",
        "paidAt": "2026-05-15T08:30:00.000Z",
        "notes": "Advance before festival",
        "recordedById": "uuid",
        "createdAt": "2026-05-15T08:30:00.000Z",
        "updatedAt": "2026-05-15T08:30:00.000Z",
        "worker": {
          "id": "uuid",
          "name": "Ramesh Kumar"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 1,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
}
```

### 8. List Payments For One Worker

```http
GET /api/tenants/:tenantId/workers/:id/payments?page=1&limit=20&paymentType=EARNING_SETTLEMENT&dateFrom=2026-05-01&dateTo=2026-05-31
```

Response:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "tenantId": "uuid",
        "workerId": "uuid",
        "amount": "500.00",
        "paymentType": "EARNING_SETTLEMENT",
        "paymentMode": "CASH",
        "paidAt": "2026-05-15T08:30:00.000Z",
        "notes": "Weekly payment",
        "recordedById": "uuid",
        "createdAt": "2026-05-15T08:30:00.000Z",
        "updatedAt": "2026-05-15T08:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 1,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
}
```

### 9. Get Worker Payment By ID

```http
GET /api/tenants/:tenantId/workers/payments/:paymentId
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "workerId": "uuid",
    "amount": "500.00",
    "paymentType": "EARNING_SETTLEMENT",
    "paymentMode": "CASH",
    "paidAt": "2026-05-15T08:30:00.000Z",
    "notes": "Weekly payment",
    "recordedById": "uuid",
    "createdAt": "2026-05-15T08:30:00.000Z",
    "updatedAt": "2026-05-15T08:30:00.000Z",
    "worker": {
      "id": "uuid",
      "tenantId": "uuid",
      "name": "Ramesh Kumar",
      "phone": "9876543210",
      "alternatePhone": "9876500000",
      "address": "Main road",
      "city": "Rajkot",
      "idProofType": "Aadhar",
      "idProofNumber": "1234-5678-9012",
      "openingBalance": "1000.00",
      "openingBalanceType": "PAYABLE",
      "openingBalanceDate": "2026-05-01T00:00:00.000Z",
      "notes": "Experienced necklace worker",
      "isActive": true,
      "deletedAt": null,
      "createdAt": "2026-05-15T08:30:00.000Z",
      "updatedAt": "2026-05-15T08:30:00.000Z"
    },
    "recordedBy": {
      "id": "uuid",
      "name": "Admin User"
    }
  }
}
```

### 10. Create Worker Payment

```http
POST /api/tenants/:tenantId/workers/payments
```

Request:

```json
{
  "workerId": "uuid",
  "amount": 500,
  "paymentType": "EARNING_SETTLEMENT",
  "paymentMode": "CASH",
  "paidAt": "2026-05-15T08:30:00.000Z",
  "notes": "Weekly payment"
}
```

Validation:

- `workerId`: required uuid
- `amount`: required number, greater than `0`
- `paymentType`: required, one of `EARNING_SETTLEMENT`, `ADVANCE`, `ADVANCE_RECOVERY`
- `paymentMode`: optional string, default `CASH`
- `paidAt`: optional date, default current date
- `notes`: optional string

Response `201`:

```json
{
  "success": true,
  "data": {
    "payment": {
      "id": "uuid",
      "tenantId": "uuid",
      "workerId": "uuid",
      "amount": "500.00",
      "paymentType": "EARNING_SETTLEMENT",
      "paymentMode": "CASH",
      "paidAt": "2026-05-15T08:30:00.000Z",
      "notes": "Weekly payment",
      "recordedById": "uuid",
      "createdAt": "2026-05-15T08:30:00.000Z",
      "updatedAt": "2026-05-15T08:30:00.000Z",
      "worker": {
        "id": "uuid",
        "tenantId": "uuid",
        "name": "Ramesh Kumar",
        "phone": "9876543210",
        "alternatePhone": "9876500000",
        "address": "Main road",
        "city": "Rajkot",
        "idProofType": "Aadhar",
        "idProofNumber": "1234-5678-9012",
        "openingBalance": "1000.00",
        "openingBalanceType": "PAYABLE",
        "openingBalanceDate": "2026-05-01T00:00:00.000Z",
        "notes": "Experienced necklace worker",
        "isActive": true,
        "deletedAt": null,
        "createdAt": "2026-05-15T08:30:00.000Z",
        "updatedAt": "2026-05-15T08:30:00.000Z"
      },
      "recordedBy": {
        "id": "uuid",
        "name": "Admin User"
      }
    },
    "summary": {
      "totalEarned": "5000.00",
      "totalPaid": "2500.00",
      "advanceGiven": "500.00",
      "outstandingBalance": "2000.00",
      "activeAssignments": 2,
      "totalPiecesDelivered": 400
    }
  }
}
```

Business rules:

- Worker must be active.
- `EARNING_SETTLEMENT` amount cannot exceed available outstanding balance.
- `ADVANCE_RECOVERY` amount cannot exceed available advance balance.

## Worker Ledger API

### 11. Get Worker Ledger

```http
GET /api/tenants/:tenantId/workers/:id/ledger
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "date": "2026-05-01T00:00:00.000Z",
      "type": "OPENING_BALANCE",
      "description": "Opening balance (Payable to worker)",
      "debit": "0.00",
      "credit": "1000.00",
      "runningBalance": "1000.00"
    },
    {
      "date": "2026-05-10T08:30:00.000Z",
      "type": "GOODS_RETURN",
      "description": "Goods return for AY-NK-001 - 40 accepted piece(s)",
      "debit": "0.00",
      "credit": "500.00",
      "runningBalance": "1500.00"
    },
    {
      "date": "2026-05-15T08:30:00.000Z",
      "type": "EARNING_SETTLEMENT",
      "description": "Earning settlement paid via CASH",
      "debit": "500.00",
      "credit": "0.00",
      "runningBalance": "1000.00"
    }
  ]
}
```

Ledger meaning:

- `credit` increases amount payable to worker.
- `debit` reduces amount payable to worker.
- `runningBalance = previousBalance + credit - debit`.

## Frontend Notes

- Show worker list columns: name, phone, city, active assignments, opening balance, active status.
- Decimal values may return as strings from Prisma.
- Use `GET /workers/:id` for the detail summary cards.
- Put assignments, payments, and ledger into tabs on the worker detail page.
- Payment creation should refresh both payments list and worker detail summary.
- For `ADVANCE_RECOVERY`, show available recovery balance if available from summary/ledger logic, or handle backend validation errors clearly.
- Permission middleware is currently commented in the backend route file, but the frontend should still handle `401` and `403`.

## Useful UI Screens

### Worker List

- Paginated table
- Search by name or phone
- City filter
- Active/inactive filter
- Create worker button
- Edit action
- Delete action with confirmation

### Worker Detail

- Profile summary
- Earnings summary cards
- Assignment tab
- Payment tab
- Ledger tab

### Worker Payment Form

- Worker dropdown
- Payment type segmented control
- Amount
- Payment mode
- Paid date
- Notes

