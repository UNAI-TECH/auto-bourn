# Auto Bourn CRM — Implementation Plan

## Architecture
- **Admin routes**: `/dashboard/crm/*`
- **Employee routes**: `/employee/crm/*`
- **Shared types**: `src/types/crm.ts`
- **Database**: New Supabase tables via `crm-migration.sql`
- **Design**: Existing `db-*` CSS variable system (Black + #E10613 red + white)

## Files to Create

### Database
- [ ] `crm-migration.sql` — 6 new tables + RLS policies

### Types
- [ ] `src/types/crm.ts` — All CRM TypeScript interfaces

### Dashboard (Admin)
- [ ] `src/app/dashboard/crm/page.tsx` — CRM Overview (analytics + quick stats)
- [ ] `src/app/dashboard/crm/leads/page.tsx` — Kanban board + list toggle
- [ ] `src/app/dashboard/crm/leads/[id]/page.tsx` — Lead detail (timeline, notes, follow-ups, bookings)
- [ ] `src/app/dashboard/crm/follow-ups/page.tsx` — Follow-up manager (today/missed/upcoming)
- [ ] `src/app/dashboard/crm/analytics/page.tsx` — Performance analytics + leaderboard

### Employee Console
- [ ] `src/app/employee/crm/page.tsx` — Employee CRM dashboard
- [ ] `src/app/employee/crm/leads/page.tsx` — Employee lead list
- [ ] `src/app/employee/crm/leads/[id]/page.tsx` — Employee lead detail

### Layout Updates
- [ ] `src/app/dashboard/layout.tsx` — Add CRM nav section
- [ ] `src/app/employee/layout.tsx` — Add CRM nav item

## Database Tables

| Table | Purpose |
|---|---|
| `leads` | Core customer/lead records |
| `follow_ups` | Scheduled follow-up actions |
| `customer_notes` | Freeform conversation notes |
| `test_drives` | Test drive scheduling + outcomes |
| `bookings` | Booking + payment tracking |
| `crm_activity_logs` | Full audit trail |

## Lead Status Pipeline
```
New → Contacted → Interested → Follow-up Pending → 
Test Drive Scheduled → Negotiation → Booking Done → Sold | Lost
```

## Build Order
1. `crm-migration.sql` + `src/types/crm.ts`
2. Layout updates (nav items)
3. CRM overview page
4. Leads Kanban page
5. Lead detail page (most complex)
6. Follow-ups page
7. Analytics page
8. Employee CRM pages
