# Inventory Management ERP

A full-featured, multi-tenant inventory management system built with Next.js 16, Supabase, and Prisma 7.

## Features

- **Multi-tenant architecture** with row-level data isolation
- **Role-based access control (RBAC)** with granular permissions per role
- **Inbound receiving workflow** with 3-step segregation of duties (Procurement Verify -> QC Inspect -> Warehouse Receive)
- **Purchase order management** with approval workflows
- **Internal request/issue workflow** (Request -> Fulfill -> Confirm)
- **Inventory transfers** between locations with approval thresholds
- **Real-time inventory tracking** with weighted average costing
- **Payment tracking** with overdue alerts
- **Reports & analytics** (stock movement, purchase summary, supplier performance, payment aging, inventory valuation, transaction history)
- **Excel export** for all reports
- **Audit logging** for all operations
- **Dashboard** with KPIs, charts, alerts, and recent activity

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma 7 with `@prisma/adapter-pg` |
| Auth | Supabase Auth |
| UI | Ant Design 6 + Tailwind CSS |
| Charts | Recharts |
| State | Zustand |
| Validation | Zod |
| Notifications | Sonner |

## Getting Started

### Prerequisites

- Node.js 20+
- A Supabase project (free tier works)

### 1. Clone and install

```bash
git clone <repo-url>
cd inventory-management
npm install
```

### 2. Environment variables

Create `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres.your-project:password@aws-0-region.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
```

### 3. Database setup

```bash
npx prisma migrate dev    # Apply migrations
npx tsx prisma/seed.ts     # Seed demo data
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | Admin123! |
| Procurement | procurement@demo.com | Proc123! |
| QC Inspector | qc@demo.com | QC123456! |
| Warehouse | warehouse@demo.com | Wh123456! |
| Store | store@demo.com | Store123! |
| Finance | finance@demo.com | Fin123456! |

## Project Structure

```
src/
  app/
    (dashboard)/         # Authenticated pages
      dashboard/         # Dashboard with KPIs & charts
      items/             # Item master data
      categories/        # Category management
      locations/         # Location/warehouse management
      suppliers/         # Supplier management
      procurement/       # Purchase orders CRUD
      receiving/         # 3-step inbound receiving
        procurement/     # Step 1: Procurement verification
        qc/              # Step 2: QC inspection
        warehouse/       # Step 3: Warehouse receiving
      requests/          # Internal requests workflow
      transfers/         # Inventory transfers
      finance/           # Payments & valuation
      reports/           # Analytics & reports
    api/                 # API routes
      items/             # Items CRUD
      categories/        # Categories CRUD
      locations/         # Locations CRUD
      suppliers/         # Suppliers CRUD
      purchase-orders/   # PO CRUD + submit/approve/send
      receiving/         # Receiving + QC + warehouse
      internal-requests/ # Requests + fulfill + confirm
      transfers/         # Transfers + approve/fulfill/receive
      payments/          # Payment tracking
      dashboard/         # Dashboard aggregations
      audit-logs/        # Audit log queries
      export/excel/      # Excel export
      health/            # Health check endpoint
    login/               # Login page
  components/
    layout/              # Sidebar, header, dashboard layout
    receiving/           # Receiving workflow components
  lib/
    prisma.ts            # Prisma client singleton
    api-utils.ts         # API helpers (auth, permissions, audit)
    validations.ts       # Zod validation schemas
    rate-limit.ts        # In-memory rate limiter
    supabase/            # Supabase client config
  generated/prisma/      # Generated Prisma client
prisma/
  schema.prisma          # Database schema (16 models)
  migrations/            # Migration history
  seed.mts               # Seed script
```

## API Endpoints

### Master Data
- `GET/POST /api/items` - Items CRUD
- `GET/POST /api/categories` - Categories
- `GET/POST /api/locations` - Locations
- `GET/POST /api/suppliers` - Suppliers

### Purchase Orders
- `GET/POST /api/purchase-orders` - List/create POs
- `GET/PUT /api/purchase-orders/[id]` - Get/update PO
- `POST /api/purchase-orders/[id]/submit` - Submit for approval
- `POST /api/purchase-orders/[id]/approve` - Approve/reject
- `POST /api/purchase-orders/[id]/send` - Mark as sent

### Receiving (3-step workflow)
- `GET/POST /api/receiving` - List/create (Step 1: procurement verify)
- `GET /api/receiving/[id]` - Get detail
- `POST /api/receiving/[id]/qc-inspect` - Step 2: QC inspection
- `POST /api/receiving/[id]/warehouse-receive` - Step 3: warehouse receive

### Internal Requests
- `GET/POST /api/internal-requests` - List/create
- `POST /api/internal-requests/[id]/fulfill` - Warehouse fulfillment
- `POST /api/internal-requests/[id]/confirm` - Store confirmation

### Transfers
- `GET/POST /api/transfers` - List/create
- `POST /api/transfers/[id]/approve` - Approve/reject
- `POST /api/transfers/[id]/fulfill` - Deduct from source
- `POST /api/transfers/[id]/receive` - Add to destination

### Other
- `GET/POST /api/payments` - Payment tracking
- `GET /api/dashboard` - Dashboard data
- `GET /api/audit-logs` - Audit trail
- `POST /api/export/excel` - Excel export
- `GET /api/health` - Health check

## Security

- Zod validation on all API request bodies
- Row-level tenant isolation on all queries
- RBAC permission checks on all mutations
- Segregation of duties enforcement on workflows
- Rate limiting on exports, reports, and heavy endpoints
- Security headers (HSTS, X-Frame-Options, CSP, etc.)
- Atomic inventory guards to prevent race conditions
- Audit logging for all state-changing operations

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed demo data
npm run db:generate  # Regenerate Prisma client
npm run db:studio    # Open Prisma Studio
```
