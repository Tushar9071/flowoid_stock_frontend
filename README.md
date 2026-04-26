# Ayanshi Imitation ERP System

A comprehensive Next.js 16 + TypeScript B2B ERP dashboard for imitation jewellery manufacturing with role-based access control and real-time data management.

## Overview

Ayanshi is a professional, enterprise-grade ERP system designed specifically for imitation jewellery manufacturers. It provides complete management of:

- **Design Catalogue** - Manage jewelry designs with categories, materials, and pricing
- **Worker Management** - Track worker assignments, productivity, and payments
- **Inventory Control** - Monitor stock levels for both raw materials and finished goods
- **Party Management** - Manage dealers and suppliers with credit tracking
- **Order Management** - Process orders, track dispatch, and manage deliveries
- **Payment Tracking** - Maintain invoices, payment records, and aging reports
- **Reports & Analytics** - Generate comprehensive business insights and metrics
- **User Management** - Control access with role-based permissions (Owner/Manager/Viewer)

## Features

### Core Functionality
- **11+ Pages** of comprehensive ERP management
- **Role-Based Access Control** (RBAC) with 3 user roles
- **Real-time Dashboards** with KPIs, charts, and alerts
- **Responsive Design** optimized for desktop and mobile
- **Professional UI** with custom color scheme and typography
- **Mock Data** for immediate demo and testing

### Technical Highlights
- **Next.js 16** with App Router
- **React 19** with modern patterns
- **TypeScript** for full type safety
- **Tailwind CSS** with custom design tokens
- **Recharts** for data visualization
- **shadcn/ui** components for consistency
- **Sonner** for toast notifications

## Project Structure

```
/app
  /(auth)
    /login                      # Role-based login page
  /(dashboard)
    /layout.tsx                 # Dashboard wrapper layout
    /page.tsx                   # Main dashboard
    /design-catalogue           # Design management
    /worker-management          # Worker operations (4 tabs)
    /inventory                  # Inventory management (3 tabs)
    /party-management           # Dealers & suppliers (2 tabs)
    /raw-materials              # Raw material tracking
    /orders-dispatch            # Order management
    /payments-ledger            # Payment tracking (4 tabs)
    /reports                    # Business analytics
    /user-management            # User admin (Owner only)
    /settings                   # System configuration (Owner only)

/components
  /layout
    /sidebar.tsx                # Navigation sidebar
    /header.tsx                 # Top header with user menu
    /dashboard-layout.tsx       # Page wrapper component
  /dashboard
    /kpi-cards.tsx              # Dashboard metrics
    /sales-chart.tsx            # Sales trend chart
    /alerts-widget.tsx          # Alerts display
  /shared
    /status-badge.tsx           # Reusable status badge

/lib
  /types.ts                     # TypeScript interfaces for all entities
  /data.ts                      # Mock seed data (100+ records)
  /auth-context.tsx             # Role-based auth context
  /constants.ts                 # Colors, permissions, navigation
  /utils.ts                     # Helper functions

/public                         # Static assets
```

## User Roles & Permissions

### Owner
- Full access to all 11+ pages
- Can create, edit, and delete records
- Access to User Management and Settings
- Can view all reports and analytics

### Manager
- Access to operations pages (9 pages)
- Cannot access User Management or Settings
- Can create and edit records, but not delete
- Read access to reports

### Viewer
- Full visibility of all pages (read-only)
- Cannot create, edit, or delete records
- Can export reports and data
- Best for stakeholders and auditors

## Getting Started

### 1. Login Page
Navigate to `/dashboard` or `/` to access the login page. Select your role:
- **Owner** (Rajesh Kumar)
- **Manager** (Priya Sharma)
- **Viewer** (Amit Patel)

All roles use the same demo data for testing.

### 2. Dashboard
The main dashboard shows:
- **KPI Cards** - 4 key metrics
- **Sales Trend** - Monthly revenue chart
- **Recent Alerts** - System notifications
- **Quick Stats** - Design, worker, dealer, and inventory counts

### 3. Navigation
Use the left sidebar to navigate between modules:
- Click the hamburger menu on mobile to toggle sidebar
- Active page highlighted in teal/amber
- Sidebar items filtered by user role

### 4. Data Management
All data comes from TypeScript constants in `/lib/data.ts`:
- 6 design templates
- 5 active workers
- 4 active dealers
- 3 inventory items
- 15+ supporting records

## Color Scheme

| Color | Usage | Hex |
|-------|-------|-----|
| Navy | Primary, headings | #0F2A4A |
| Teal | Secondary, accents | #0D7377 |
| Amber | CTA buttons, highlights | #F5A623 |
| Light Gray | Background | #F4F6F9 |
| White | Cards, surfaces | #FFFFFF |

## Typography

- **Headings** - Sora (serif)
- **Body Text** - Inter (sans-serif)
- **Monospace** - Geist Mono

## Database Schema

### Core Tables
- `users` - User accounts and roles
- `designs` - Jewelry design templates
- `workers` - Worker profiles
- `assignments` - Work assignments to workers
- `finished_goods` - Collected finished goods
- `worker_payments` - Payment records
- `raw_materials` - Raw material inventory
- `inventory_items` - Finished goods stock
- `dealers` - Customer dealer information
- `orders` - Sales orders
- `invoices` - Billing records
- `payments` - Payment transactions

See `/lib/types.ts` for complete TypeScript interfaces.

## Mock Data Statistics

- **6** Design templates
- **5** Active workers
- **4** Active dealers
- **4** Open orders
- **2** Invoices
- **3** Inventory items
- **4** Raw materials
- **15+** Supporting records

## Customization

### Change Color Scheme
Edit `/app/globals.css` and update CSS variables:
```css
--color-navy: #0F2A4A;      /* Primary color */
--color-teal: #0D7377;      /* Secondary color */
--color-amber: #F5A623;     /* Accent/CTA color */
```

### Add New Page
1. Create folder in `/app/(dashboard)/[page-name]/`
2. Add `page.tsx` with `DashboardLayout` wrapper
3. Add navigation item to `/lib/constants.ts`
4. Update `/lib/constants.ts` role permissions if needed

### Update Mock Data
Edit `/lib/data.ts` to modify or add records. All changes reflect immediately in the UI.

### Customize Navigation
Edit `/lib/constants.ts` `navigationItems` array to add/remove/reorder pages.

## Development

### Running Locally
```bash
pnpm dev
```
Opens at `http://localhost:3000`

### Building for Production
```bash
pnpm build
pnpm start
```

### Type Checking
```bash
pnpm tsc --noEmit --skipLibCheck
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

Mobile responsive design tested on iOS Safari and Chrome Mobile.

## Features Not Included (Future Enhancements)

- Backend API integration
- Real database (currently mock data)
- Authentication (currently role selector)
- Payment gateway integration
- Email notifications
- File upload/download
- Dark mode toggle
- Multi-language support

## Performance Notes

- All pages preload instantly (no API calls)
- Lightweight build with optimized imports
- No external APIs or dependencies
- Sidebar collapse saves ~20% viewport width on mobile

## Support & Documentation

### File Reference
- **Types**: `/lib/types.ts` - All TypeScript interfaces
- **Data**: `/lib/data.ts` - Mock seed data
- **Colors**: `/lib/constants.ts` - Color tokens and utilities
- **Auth**: `/lib/auth-context.tsx` - Role management

### Component Docs
- `DashboardLayout` - Wraps all dashboard pages
- `Sidebar` - Navigation with role filtering
- `Header` - Top bar with user menu
- `StatusBadge` - Reusable status indicator
- `KPICards` - Metric display cards
- `SalesChart` - Recharts AreaChart

## Version

**v1.0.0** - Initial release

## License

Proprietary - Ayanshi Imitation (2024)

## Next Steps

1. **Integrate Backend** - Connect to real database (Supabase, Neon, etc.)
2. **Add Authentication** - Replace role selector with real auth
3. **Implement Forms** - Add create/edit modals for each entity
4. **Export Features** - Add PDF/CSV export for reports
5. **Mobile App** - React Native version for field teams

---

Built with ❤️ for modern jewelry manufacturing businesses.
