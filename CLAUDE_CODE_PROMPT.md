# Claude Code Development Prompt
## F&B Supply Chain ERP System - Phase 1 Build

---

## 🎯 Project Overview

You are building an **end-to-end supply chain ERP system** for F&B SMEs in the MENA region. This is a **production-grade, multi-tenant SaaS application** that will help businesses manage inventory, procurement, logistics, and basic finance operations.

**Key Business Goals:**
- Reduce inventory theft and losses by 30%+
- Achieve 90%+ inventory accuracy
- Eliminate manual processes and spreadsheets
- Provide real-time visibility across the supply chain
- Enable smart, automated workflows with multi-level approvals

---

## 📋 Reference Documents

**Primary Reference:** `/PRD.md` in this directory contains:
- Complete functional requirements
- User stories with acceptance criteria
- Technical architecture blueprint
- Technology stack specifications
- Database schemas
- API design patterns

**Please read the PRD thoroughly before starting development.**

---

## 🛠 Technology Stack (As Specified in PRD)

### Backend
- **Framework:** NestJS (TypeScript)
- **Database:** PostgreSQL 15+
- **ORM:** TypeORM
- **Cache:** Redis
- **Authentication:** JWT (Passport)
- **File Storage:** AWS S3 (or local for dev)

### Frontend
- **Web Application:** React + TypeScript + Ant Design
- **State Management:** Redux Toolkit
- **Mobile App:** React Native (Expo) - *Phase 1B*

### Infrastructure
- **API Gateway:** NGINX (development)
- **Containerization:** Docker + Docker Compose
- **Event Bus:** Redis Streams

---

## 🎯 Phase 1 Scope (What We're Building Now)

### Core Modules (Priority Order)

#### 1. **Foundation & Infrastructure** ✅
- Multi-tenant architecture (tenant isolation via schemas)
- Authentication & authorization (JWT, RBAC)
- Audit logging system
- Event bus setup (Redis Streams)
- Database migrations framework

#### 2. **Inventory Management** 🔥 (HIGHEST PRIORITY)
- **Inbound Process:**
  - Procurement verification (match to PO)
  - Quality control inspection
  - Warehouse receiving with QR code location assignment
  - Three-step approval workflow
- **Outbound Process:**
  - Internal requests (chef/production requests items)
  - Warehouse fulfillment with QR scanning
  - Receipt confirmation by requester
- **Real-Time Visibility:**
  - Stock levels by location
  - Item master data management
  - Location hierarchy with QR codes
  - Low stock alerts
  - Slow-moving items tracking

#### 3. **Procurement Management** 🔥
- Supplier master data
- Purchase order creation with approval workflows
- PO approval based on value thresholds
- PO tracking and status management
- Integration with inbound receiving

#### 4. **Logistics & Transfers** 🔥
- Inter-location transfer requests
- Transfer approval workflow
- Transfer fulfillment (pick & pack)
- Receipt confirmation at destination
- In-transit tracking
- Store ordering system (smart replenishment)

#### 5. **Basic Finance Integration** 💰
- Cost capture at receipt (landed cost calculation)
- Payment tracking (pending, partial, paid)
- Inventory valuation (weighted average)
- Basic reporting (payment aging, inventory value)

#### 6. **Reporting & Dashboard** 📊
- Management dashboard (KPIs, alerts, trends)
- Inventory accuracy report
- Supplier performance report
- Excel/CSV export functionality

#### 7. **Web Backoffice UI** 🎨
- Responsive React application
- Three user interfaces:
  - Operations (Procurement, Warehouse Supervisors)
  - Management Dashboard (Business Owner, Executives)
- Role-based navigation and access control

---

## 📱 Out of Scope for Phase 1

❌ Mobile app (deferred to Phase 1B)  
❌ Production management (Phase 2)  
❌ Advanced finance (AP/AR/GL) - Phase 2  
❌ Multi-company consolidation  
❌ E-commerce integration  
❌ Foodics integration (Phase 1B)  

---

## 🚀 AGGRESSIVE 2-WEEK GSD EXECUTION PLAN

**⚠️ WARNING: This is an INTENSE sprint. We're building in 2 weeks what normally takes 12 weeks. Expect 12-16 hour days. Focus on MVP features only. Cut all non-essential features. Ship working software FAST.**

---

## 📅 Schedule Overview

- **Week 1:** Backend Infrastructure + Core Features + Basic UI
- **Week 2:** Complete Workflows + Frontend Polish + Testing + Deployment

**Daily Standup (Required):**
- 9 AM: What did I complete yesterday?
- What will I complete today?
- Any blockers?

**Weekend Work:** Yes, both weekends required to hit deadline.

---

## WEEK 1: FOUNDATION + CORE BACKEND

### **Day 1 (Monday): Project Foundation**

**TIME BUDGET: 14 hours**

#### Morning (6 hours): Infrastructure Setup
1. **Hour 1-2: Project Initialization**
   - Initialize NestJS project with TypeScript
   - Set up folder structure (modules, common, config)
   - Configure TypeORM + PostgreSQL
   - Configure Redis connection
   - Create .env structure

2. **Hour 3-4: Docker & Database**
   - Create docker-compose.yml (Postgres + Redis)
   - Start containers: `docker-compose up -d`
   - Create first migration (tenants, users, roles, permissions)
   - Test database connection

3. **Hour 5-6: Multi-Tenancy Foundation**
   - Implement tenant schema isolation
   - Create tenant middleware (extract tenant_id from JWT)
   - Create tenant service (CRUD)
   - Seed script: Create "Demo Company" tenant

#### Afternoon (6 hours): Authentication & Authorization
4. **Hour 7-9: Authentication Module**
   - JWT authentication (login/logout)
   - Password hashing (bcrypt)
   - User CRUD endpoints
   - Refresh token logic
   - Auth guards (JwtAuthGuard)

5. **Hour 10-12: RBAC System**
   - Roles entity and endpoints
   - Permissions entity
   - Role-permission mapping
   - Permission guards (check user has permission)
   - Seed roles: admin, procurement, warehouse, qc, store_manager

#### Evening (2 hours): Core Infrastructure
6. **Hour 13-14: Audit Trail + Event Bus**
   - Audit logging service (log all transactions)
   - Audit log entity (user, action, timestamp, before/after)
   - Redis Streams event bus setup
   - Test event publishing and consuming

**END OF DAY 1 SUCCESS CRITERIA:**
- [ ] Docker containers running (Postgres + Redis)
- [ ] POST /auth/login returns JWT token
- [ ] Can create users with roles
- [ ] Tenant isolation working (queries scoped to tenant)
- [ ] Audit logs capturing actions

---

### **Day 2 (Tuesday): Master Data + Procurement**

**TIME BUDGET: 14 hours**

#### Morning (6 hours): Items & Locations
1. **Hour 1-3: Item Management**
   - Items entity (code, name, category, UOM, min/max stock, cost)
   - Categories entity
   - Items CRUD endpoints (create, read, update, delete)
   - Search/filter by category, name, status
   - Seed 50 F&B items with categories

2. **Hour 4-6: Location Management**
   - Locations entity (code, name, type, parent_id, qr_code)
   - Location hierarchy (warehouse → zone → aisle → shelf)
   - Generate QR codes (use qrcode npm package)
   - Locations CRUD endpoints
   - Location tree API (hierarchical structure)
   - Seed 2 warehouses, 3 stores with zones/aisles/shelves

#### Afternoon (6 hours): Procurement Module
3. **Hour 7-9: Suppliers & PO**
   - Suppliers entity (name, contact, payment terms, rating)
   - Suppliers CRUD
   - PO entity (header) + PO line items entity
   - Create PO endpoint (with line items)
   - PO status enum (draft, pending, approved, sent, received)

4. **Hour 10-12: Approval Workflow**
   - Approval workflow service (generic, reusable)
   - Configurable thresholds (< $500 auto-approve, > $500 require approval)
   - PO approval endpoint
   - Check: user cannot approve own PO
   - Approval routing logic (based on value)
   - Approval history tracking

#### Evening (2 hours): Inventory Foundation
5. **Hour 13-14: Inventory Schema**
   - Inventory entity (item, location, quantity, batch, cost_per_unit)
   - Inventory transactions entity (audit trail for movements)
   - Inventory calculation service (get stock by item/location)
   - **DO NOT implement workflows yet, just schema**

**END OF DAY 2 SUCCESS CRITERIA:**
- [ ] Can create items and categories
- [ ] Can create locations with QR codes
- [ ] Can create suppliers
- [ ] Can create PO with multiple line items
- [ ] PO approval workflow routes to correct approver
- [ ] Inventory schema created

---

### **Day 3 (Wednesday): Inbound Receiving Workflow**

**TIME BUDGET: 16 hours (critical day)**

#### Morning (8 hours): Three-Step Inbound
1. **Hour 1-4: Procurement Verification Step**
   - Receiving entity (linked to PO)
   - Procurement verification endpoint
   - Match received items to PO
   - Record discrepancies (qty differences)
   - Photo upload to local storage (S3 integration optional)
   - Notes field
   - State transition: pending → proc_approved
   - Route to QC queue

2. **Hour 5-8: QC Inspection Step**
   - QC inspection endpoint
   - Accept/partial accept/reject logic
   - Rejection reason codes
   - Photo attachment
   - State transition: proc_approved → qc_approved (or rejected)
   - If rejected, route back to procurement
   - If approved, route to warehouse queue

#### Afternoon (6 hours): Warehouse Confirmation
3. **Hour 9-12: Warehouse Receiving**
   - Warehouse confirmation endpoint
   - QR code location input (text input, no actual scanning yet)
   - Batch/lot number entry
   - **CRITICAL: Update inventory quantities here**
   - Create inventory transaction record
   - State transition: qc_approved → received
   - Inventory now available for use

4. **Hour 13-14: Segregation of Duties Enforcement**
   - Check: procurement user ≠ QC user ≠ warehouse user
   - Block if same user tries to complete multiple steps
   - Add validation to each step

#### Evening (2 hours): Testing Inbound Flow
5. **Hour 15-16: End-to-End Test**
   - Create test PO
   - Test full workflow: procurement → QC → warehouse
   - Verify inventory updates correctly
   - Verify audit logs captured
   - Test rejection flow (QC rejects → back to procurement)

**END OF DAY 3 SUCCESS CRITERIA:**
- [ ] Complete inbound workflow (3 steps)
- [ ] Three different users required
- [ ] Inventory updates only after warehouse confirms
- [ ] Can attach photos at each step
- [ ] Rejected items don't enter inventory
- [ ] Audit trail complete

---

### **Day 4 (Thursday): Outbound + Transfers**

**TIME BUDGET: 14 hours**

#### Morning (6 hours): Outbound Workflow
1. **Hour 1-3: Internal Requests**
   - Internal request entity
   - Request creation endpoint (requester selects items)
   - Show available stock when creating request
   - Warehouse fulfillment endpoint
   - QR location input (confirm source location)
   - Deduct inventory after warehouse confirms
   - State: pending → issued

2. **Hour 4-6: Receipt Confirmation**
   - Receipt confirmation endpoint (requester confirms)
   - Discrepancy recording (if qty doesn't match)
   - State: issued → completed
   - Close transaction
   - Audit trail

#### Afternoon (6 hours): Transfers
3. **Hour 7-10: Transfer Workflow**
   - Transfer entity (from_location → to_location)
   - Transfer request endpoint
   - Transfer approval (if > threshold, requires manager approval)
   - Transfer fulfillment (deduct from source)
   - In-transit state (inventory not at source or destination)
   - Receipt at destination (add to destination inventory)

4. **Hour 11-12: Store Ordering**
   - Simple endpoint: store manager requests items from warehouse
   - Creates transfer request automatically
   - No smart suggestions yet (just basic request)

#### Evening (2 hours): Inventory Visibility
5. **Hour 13-14: Real-Time Queries**
   - Get stock by item endpoint
   - Get stock by location endpoint
   - Low stock alerts (items below minimum)
   - Stock movement history endpoint

**END OF DAY 4 SUCCESS CRITERIA:**
- [ ] Outbound workflow complete (request → fulfill → confirm)
- [ ] Transfer workflow complete (request → approve → fulfill → receive)
- [ ] Inventory correctly moves between locations
- [ ] Can query real-time stock levels

---

### **Day 5 (Friday): Finance + Backend Polish**

**TIME BUDGET: 12 hours**

#### Morning (6 hours): Cost Tracking
1. **Hour 1-3: Cost Capture**
   - Capture unit cost from PO
   - Calculate landed cost (add shipping, taxes)
   - Weighted average cost calculation
   - Update item average cost on receipt

2. **Hour 4-6: Payment Tracking**
   - Payment entity (linked to PO)
   - Payment status (pending, partial, paid)
   - Payment due date
   - Payment aging calculation (30/60/90 days)

#### Afternoon (4 hours): Reports (Backend APIs Only)
3. **Hour 7-9: Report Endpoints**
   - Inventory valuation report (qty × cost)
   - Purchase summary by supplier
   - Payment aging report
   - Transaction history report
   - Excel export (use exceljs library)

4. **Hour 10: Backend Testing**
   - Quick smoke tests for all endpoints
   - Fix critical bugs

#### Evening (2 hours): API Documentation
5. **Hour 11-12: Swagger Setup**
   - Configure Swagger/OpenAPI in NestJS
   - Add decorators to controllers
   - Generate API docs at /api/docs
   - Test all endpoints in Swagger UI

**END OF DAY 5 SUCCESS CRITERIA:**
- [ ] All backend APIs complete
- [ ] Cost tracking working
- [ ] Payment tracking working
- [ ] Report APIs returning data
- [ ] Swagger docs accessible

---

### **WEEKEND 1 (Saturday-Sunday): Frontend Blitz**

**TIME BUDGET: 20 hours (10 hrs/day)**

#### Saturday: Frontend Foundation + Master Data UI

**Hour 1-4: Setup**
- Initialize React app (Vite + TypeScript)
- Install Ant Design, Redux Toolkit, React Router
- Configure Axios (API client)
- Set up Redux store
- Create auth slice (login, logout, store JWT)
- Protected routes (redirect to login if not authenticated)

**Hour 5-8: Core UI Components**
- Layout component (header, sidebar, content)
- Login page
- Dashboard page (empty for now)
- Master data pages:
  - Items list (table with pagination)
  - Create/edit item modal
  - Locations list (tree view)
  - Create/edit location modal
  - Suppliers list
  - Create/edit supplier modal

**Hour 9-10: Master Data Integration**
- Connect to backend APIs
- Test CRUD operations
- Handle errors gracefully

#### Sunday: Procurement + Inventory UI

**Hour 1-5: Procurement UI**
- PO list page (table with filters)
- Create PO form (multi-line item entry)
- PO detail page (view PO)
- Approve/reject buttons
- Pending approvals widget

**Hour 6-10: Inventory UI**
- Inbound receiving pages:
  - Procurement verification form
  - QC inspection form
  - Warehouse receiving form
- Outbound pages:
  - Create request form
  - Warehouse fulfillment form
  - Receipt confirmation form
- Transfer pages:
  - Create transfer form
  - Transfer approval list
  - Transfer fulfillment form

**END OF WEEKEND 1 SUCCESS CRITERIA:**
- [ ] Can login via UI
- [ ] All master data screens functional
- [ ] Can create PO via UI
- [ ] Can complete inbound workflow via UI
- [ ] Can create outbound requests via UI
- [ ] Can create transfers via UI

---

## WEEK 2: POLISH + TESTING + DEPLOYMENT

### **Day 6 (Monday): Dashboard + Reports UI**

**TIME BUDGET: 12 hours**

#### Morning (6 hours): Management Dashboard
1. **Hour 1-3: KPI Cards**
   - Total inventory value card
   - Pending approvals count
   - Low stock alerts count
   - Outstanding payables

2. **Hour 4-6: Charts**
   - Inventory value trend (line chart using Recharts)
   - Top 10 items by value (bar chart)
   - Supplier spend (pie chart)

#### Afternoon (6 hours): Reports Pages
3. **Hour 7-9: Report Pages**
   - Inventory valuation report (table)
   - Purchase summary report
   - Payment aging report
   - Transaction history report

4. **Hour 10-12: Export Functionality**
   - Excel export buttons
   - Download generated files
   - Date range filters

**END OF DAY 6 SUCCESS CRITERIA:**
- [ ] Dashboard shows real-time KPIs
- [ ] Charts render correctly
- [ ] All reports accessible via UI
- [ ] Can export to Excel

---

### **Day 7 (Tuesday): Integration + Bug Fixes**

**TIME BUDGET: 14 hours**

#### Full Day: End-to-End Testing & Fixes
1. **Hour 1-4: Complete User Flows**
   - Test complete PO → Receive flow
   - Test complete outbound flow
   - Test complete transfer flow
   - Document all bugs

2. **Hour 5-10: Bug Fixing Blitz**
   - Fix critical bugs (blockers)
   - Fix high-priority bugs (major issues)
   - Skip low-priority bugs (add to backlog)

3. **Hour 11-12: UI Polish**
   - Fix layout issues
   - Improve loading states
   - Add error messages
   - Improve mobile responsiveness (basic)

4. **Hour 13-14: Notifications**
   - Add success toasts (Ant Design message component)
   - Add error alerts
   - Add confirmation modals for critical actions

**END OF DAY 7 SUCCESS CRITERIA:**
- [ ] All critical workflows work end-to-end
- [ ] No blocking bugs
- [ ] UI is usable and reasonably polished
- [ ] User feedback is clear (toasts, alerts)

---

### **Day 8 (Wednesday): Security + Performance**

**TIME BUDGET: 12 hours**

#### Morning (6 hours): Security Hardening
1. **Hour 1-3: Security Checklist**
   - Rate limiting on login endpoint
   - Input validation on all endpoints (class-validator)
   - SQL injection prevention check (verify ORM usage)
   - XSS prevention (sanitize inputs)
   - CORS configuration
   - Helmet.js for security headers

2. **Hour 4-6: Access Control Audit**
   - Verify all endpoints check JWT
   - Verify RBAC working (users can't access unauthorized pages)
   - Verify tenant isolation (cannot access other tenant data)
   - Test segregation of duties (cannot approve own PO)

#### Afternoon (6 hours): Performance Optimization
3. **Hour 7-9: Backend Performance**
   - Add database indexes (item_id, location_id, tenant_id)
   - Optimize slow queries (use EXPLAIN ANALYZE)
   - Add Redis caching for frequently accessed data
   - Test API response times (<200ms target)

4. **Hour 10-12: Frontend Performance**
   - Code splitting (lazy load routes)
   - Optimize bundle size
   - Add loading skeletons (Ant Design Skeleton)
   - Test page load times (<2s target)

**END OF DAY 8 SUCCESS CRITERIA:**
- [ ] No critical security vulnerabilities
- [ ] Access control working correctly
- [ ] API response time <200ms (p95)
- [ ] Page load time <2s

---

### **Day 9 (Thursday): Testing + Documentation**

**TIME BUDGET: 12 hours**

#### Morning (6 hours): Automated Testing
1. **Hour 1-3: Unit Tests**
   - Write tests for critical services:
     - Inventory calculation
     - Approval workflow routing
     - Cost calculation (weighted average)
   - Target: >60% coverage (compromise from 80% due to time)

2. **Hour 4-6: Integration Tests**
   - Test auth endpoints
   - Test PO creation and approval
   - Test inbound receiving workflow
   - Use Supertest for API testing

#### Afternoon (6 hours): Documentation
3. **Hour 7-9: User Documentation**
   - Quick start guide (how to login, create first PO)
   - User manual (screenshots + steps for each workflow)
   - FAQ (common questions)
   - Video walkthrough (5-10 min screen recording)

4. **Hour 10-12: Technical Documentation**
   - README.md (how to run locally)
   - Environment setup guide
   - Docker deployment guide
   - API documentation review (Swagger)

**END OF DAY 9 SUCCESS CRITERIA:**
- [ ] Critical tests passing (>60% coverage)
- [ ] User documentation complete
- [ ] Technical documentation complete
- [ ] Video demo recorded

---

### **Day 10 (Friday): Deployment + Final Polish**

**TIME BUDGET: 14 hours**

#### Morning (6 hours): Deployment Preparation
1. **Hour 1-3: Production Docker Setup**
   - Create production Dockerfile (backend)
   - Create production Dockerfile (frontend)
   - Update docker-compose.yml for production
   - Configure environment variables

2. **Hour 4-6: Database Migration Strategy**
   - Create production migration script
   - Create seed script for demo data
   - Test backup/restore procedures
   - Document migration process

#### Afternoon (6 hours): Deployment & Testing
3. **Hour 7-10: Deploy to Server**
   - Deploy backend (Docker container)
   - Deploy frontend (serve static build)
   - Configure NGINX (reverse proxy)
   - Set up SSL certificate (Let's Encrypt)
   - Run migrations on production DB
   - Seed demo data

4. **Hour 11-12: Production Smoke Test**
   - Test login on production
   - Test complete workflows on production
   - Test performance on production
   - Fix any production-specific issues

#### Evening (2 hours): Final Checklist
5. **Hour 13-14: Launch Preparation**
   - Final UI polish (fix any visual bugs)
   - Add loading states everywhere
   - Test on different browsers (Chrome, Safari, Firefox)
   - Prepare demo script for stakeholders

**END OF DAY 10 SUCCESS CRITERIA:**
- [ ] Application deployed to production
- [ ] All workflows work on production
- [ ] Demo data seeded
- [ ] SSL certificate active (HTTPS)
- [ ] Performance acceptable

---

### **WEEKEND 2 (Saturday-Sunday): Buffer + Contingency**

**TIME BUDGET: 16 hours (8 hrs/day)**

**Use this time for:**
- Fixing critical bugs discovered during week 2
- Completing any features that slipped
- Extra polish and UX improvements
- Preparing client demo
- Creating presentation slides
- Practice demo walkthrough

**If ahead of schedule:**
- Add nice-to-have features:
  - Email notifications (SendGrid)
  - Better mobile responsiveness
  - Advanced filters on tables
  - Bulk operations
  - Export to PDF (in addition to Excel)

**END OF WEEKEND 2 SUCCESS CRITERIA:**
- [ ] Production system is stable
- [ ] All P0 features complete
- [ ] Demo ready for client
- [ ] Presentation prepared

---

## 🎯 MVP FEATURE CUTS (To Hit 2-Week Deadline)

**We are cutting these features to ship on time:**

❌ Mobile app (Phase 1B)
❌ Production management (Phase 2)
❌ Advanced finance (AP/AR/GL)
❌ Foodics integration
❌ Advanced reporting (customizable dashboards)
❌ Email notifications (nice-to-have, add if time)
❌ Smart order suggestions (basic store ordering only)
❌ Actual QR code scanning (text input instead)
❌ Photo uploads to S3 (local storage only)
❌ Multi-language support
❌ Advanced charts (stick to basic Recharts)

**Keeping these ESSENTIAL features:**

✅ Multi-tenant architecture
✅ Authentication & RBAC
✅ Items, locations, suppliers master data
✅ Purchase orders with approval workflow
✅ Inbound receiving (3-step: procurement → QC → warehouse)
✅ Outbound requests (2-step: request → fulfill → confirm)
✅ Inter-location transfers
✅ Real-time inventory visibility
✅ Cost tracking (basic)
✅ Payment tracking (basic)
✅ Reports (inventory valuation, purchase summary, payment aging)
✅ Management dashboard with KPIs and charts
✅ Audit trail
✅ Excel export

---

## ⚡ DAILY VELOCITY TRACKING

**Track progress daily:**

```
Day 1: [ ] Foundation complete
Day 2: [ ] Master data + Procurement complete
Day 3: [ ] Inbound workflow complete
Day 4: [ ] Outbound + Transfers complete
Day 5: [ ] Finance + Backend APIs complete
Weekend 1: [ ] Frontend complete (all screens)
Day 6: [ ] Dashboard + Reports UI complete
Day 7: [ ] Integration + Bug fixes complete
Day 8: [ ] Security + Performance complete
Day 9: [ ] Testing + Docs complete
Day 10: [ ] Deployed to production
Weekend 2: [ ] Buffer time used / Polish complete
```

**If falling behind:**
- Cut scope immediately (drop nice-to-haves)
- Work longer hours
- Focus on P0 features only
- Skip perfection, ship working software

---

## 🚨 CRITICAL SUCCESS FACTORS

1. **No Scope Creep:** Stick to MVP features only
2. **Work Fast, Ship Daily:** Commit working code daily
3. **Test Continuously:** Don't wait until end to test
4. **Ask Questions Early:** Clarify before building
5. **Document As You Go:** Don't wait until end
6. **Focus on Business Value:** Every hour should deliver user value
7. **Cut Ruthlessly:** If feature takes >4 hours, cut it or simplify

---

## 💪 MINDSET FOR SUCCESS

**This is a sprint, not a marathon:**
- Long hours expected (12-16 hrs/day)
- Weekend work required
- Sleep less, ship more (just for 2 weeks)
- Perfection is the enemy of done
- 80% solution shipped is better than 100% solution late
- Code quality matters, but not at expense of deadline
- We can refactor later, ship now

**Daily mantra:**
> "What's the absolute minimum I need to build today to move forward?"

---

## 📊 RISK MITIGATION

**Biggest Risks:**

1. **Backend takes longer than expected**
   - Mitigation: Timebox each feature to 4 hours max
   - If exceeding time, simplify or cut

2. **Frontend integration issues**
   - Mitigation: Test backend APIs via Swagger before building UI
   - Build UI incrementally, test frequently

3. **Bugs discovered late**
   - Mitigation: Test daily, fix bugs immediately
   - Prioritize: P0 (blocker) → P1 (high) → P2 (backlog)

4. **Deployment issues**
   - Mitigation: Deploy early to staging (Day 8)
   - Practice deployment on Day 9
   - Have rollback plan

5. **Burnout**
   - Mitigation: Take 5-10 min breaks every 2 hours
   - Sleep minimum 5-6 hours/night
   - Eat properly (don't skip meals)
   - Weekend 2 is buffer if you need recovery time

---

## 🎨 UI/UX Guidelines

### Design Principles (from PRD)
1. **Role-Appropriate:** Each user sees only what's relevant
2. **Minimal Clicks:** Common actions ≤ 3 clicks
3. **Visual Feedback:** Immediate confirmation for every action
4. **Mobile-First for Forms:** Large touch targets, simple inputs
5. **Desktop for Management:** Data tables, charts, filters

### Ant Design Components to Use
- **Tables:** For lists (items, POs, suppliers, transactions)
- **Forms:** For CRUD operations (Modal forms preferred)
- **Cards:** For dashboard widgets
- **Tabs:** For multi-section pages
- **Descriptions:** For detail views
- **Steps:** For multi-step workflows (inbound receiving)
- **Tags:** For status indicators
- **Badges:** For counts and alerts
- **Charts:** Use Recharts library (integrated with Ant Design)

### Color Scheme
- **Primary:** #1890ff (Ant Design default blue)
- **Success:** #52c41a (green - approved, completed)
- **Warning:** #faad14 (orange - pending, low stock)
- **Error:** #f5222d (red - rejected, overdue)
- **Info:** #1890ff (blue - informational)

### Status Colors
```
Draft: gray
Pending Approval: orange
Approved: blue
Received: green
Rejected: red
In-Transit: purple
Completed: green
Cancelled: gray
```

---

## 🔐 Security Requirements

### Authentication
- JWT tokens expire after 15 minutes (access token)
- Refresh tokens valid for 7 days
- Secure password hashing (bcrypt, 10 rounds)
- Failed login attempts tracked (lock after 5 attempts)

### Authorization
- Every endpoint checks JWT validity
- RBAC enforced (user must have required role)
- Tenant isolation enforced (cannot access other tenant data)
- Segregation of duties (cannot approve own transactions)

### Audit Trail
- Log every transaction with:
  - User ID, Role, Timestamp
  - Action type (created, updated, deleted, approved)
  - Before/after values (for edits)
  - IP address, device info
- Audit logs are immutable (read-only)
- Retained for 7 years

### Data Protection
- Passwords hashed (never stored plain text)
- Sensitive fields encrypted at rest (tax IDs)
- TLS/HTTPS for all API calls
- SQL injection prevention (use ORM, parameterized queries)
- XSS prevention (sanitize inputs)

---

## 📊 Performance Targets

| Metric | Target |
|--------|--------|
| API response time (p95) | < 200ms |
| Page load time | < 2 seconds |
| Database query time (p95) | < 50ms |
| Dashboard refresh | < 3 seconds |
| Concurrent users (Phase 1) | 50 users |
| Inventory transactions/day | 5,000 |

---

## 🧪 Testing Requirements

### Unit Tests (Jest)
- **Coverage Target:** >80% for services
- Test all business logic:
  - Inventory calculations
  - Approval workflow routing
  - Cost calculations (weighted average)
  - Permission checks

### Integration Tests (Supertest)
- Test all API endpoints
- Test approval workflows end-to-end
- Test multi-step processes (inbound receiving)

### E2E Tests (Optional but Recommended)
- Login flow
- Create PO → Approve → Receive goods
- Create outbound request → Fulfill → Confirm
- Create transfer → Approve → Fulfill → Receive

---

## 📝 Documentation Requirements

### Code Documentation
- JSDoc comments for all public methods
- README in each module explaining its purpose
- Clear variable and function naming

### API Documentation
- Swagger/OpenAPI auto-generated from NestJS
- Include request/response examples
- Document error codes and meanings

### User Documentation
- **Quick Start Guide:** How to create first PO
- **User Manual:** Step-by-step for each workflow
- **FAQ:** Common questions and troubleshooting

---

## 🚨 Critical Business Rules (DO NOT VIOLATE)

1. **Inventory Accuracy**
   - Inventory can NEVER go negative (enforce in code)
   - Inventory only updates after final approval/confirmation
   - All inventory changes must create audit trail entry

2. **Approval Workflows**
   - Cannot skip approval steps
   - Cannot approve own transactions (segregation of duties)
   - Approval sequence must be followed (Step 1 → 2 → 3)

3. **Three-Step Inbound Process**
   - Must have 3 different users: Procurement → QC → Warehouse
   - Cannot complete all steps as same user
   - Inventory not available until warehouse confirms

4. **Two-Step Outbound Process**
   - Requester submits → Warehouse fulfills → Requester confirms
   - Inventory deducted only after warehouse confirms
   - Transaction doesn't close until requester confirms

5. **Financial Data**
   - Costs must be captured at receipt time
   - Cannot edit completed transactions (create reversals instead)
   - Accounting periods, once closed, are locked

6. **Multi-Tenancy**
   - All queries MUST filter by tenant_id
   - No cross-tenant data access (enforce at DB and API level)
   - Test tenant isolation thoroughly

---

## 🎯 Success Metrics for Phase 1

### Technical Metrics
- [ ] All critical user stories implemented (from PRD)
- [ ] >80% test coverage for business logic
- [ ] Zero critical security vulnerabilities
- [ ] API performance meets targets (<200ms p95)
- [ ] Mobile-responsive UI (works on tablet)

### Business Metrics
- [ ] Can complete full inbound workflow (PO → Receive)
- [ ] Can complete full outbound workflow (Request → Issue → Confirm)
- [ ] Can create and approve purchase orders
- [ ] Can track inventory in real-time
- [ ] Can generate all required reports
- [ ] Demo-ready for first customer

---

## 💡 Development Best Practices

### Code Quality
- **TypeScript strict mode:** Enable strict type checking
- **ESLint:** Fix all linting errors before committing
- **Prettier:** Auto-format code on save
- **No console.logs:** Use proper logging (Winston/Pino)
- **Error handling:** Use try-catch, return meaningful errors
- **Constants:** No magic numbers, use named constants

### Git Workflow
- **Branch naming:** `feature/inventory-inbound`, `fix/approval-bug`
- **Commit messages:** Conventional commits (feat:, fix:, docs:)
- **Small commits:** Commit often, one logical change per commit
- **Pull requests:** Self-review before requesting review

### Database
- **Migrations:** Always use migrations, never manual schema changes
- **Indexes:** Add indexes for frequently queried columns
- **Foreign keys:** Enforce referential integrity
- **Timestamps:** All tables must have created_at, updated_at
- **Soft deletes:** Use deleted_at instead of hard deletes

### API Design
- **RESTful:** Follow REST conventions (GET, POST, PUT, DELETE)
- **Versioning:** All endpoints start with /v1/
- **Consistent responses:** Use standard response format (see PRD)
- **Error codes:** Use HTTP status codes correctly (200, 201, 400, 401, 403, 404, 500)
- **Pagination:** All list endpoints must support pagination

---

## 🤝 Communication & Questions

### When to Ask for Clarification
- Business logic is ambiguous
- Technical approach has multiple valid options
- Requirements conflict with each other
- Performance trade-offs need to be made
- Security implications unclear

### What to Communicate
- **Daily progress:** What you completed, what's next
- **Blockers:** Any impediments to progress
- **Architecture decisions:** When making significant technical choices
- **Trade-offs:** When choosing one approach over another
- **Risks:** Potential issues you identify

---

## 📦 Deliverables Checklist

### Code Deliverables
- [ ] Backend NestJS application (fully functional)
- [ ] Frontend React application (fully functional)
- [ ] Docker Compose setup (local development)
- [ ] Database migrations (all tables created)
- [ ] Seed data scripts (demo company + users + items)
- [ ] Unit tests (>80% coverage for services)
- [ ] Integration tests (all critical endpoints)

### Documentation Deliverables
- [ ] API documentation (Swagger at /api/docs)
- [ ] README.md (how to run locally)
- [ ] User guide (how to use the system)
- [ ] Architecture diagram (system overview)

### Deployment Deliverables
- [ ] Production-ready Docker images
- [ ] Environment configuration guide
- [ ] Deployment instructions
- [ ] Backup/restore procedures

---

## 🚀 How to Get Started (2-Week Sprint)

### **IMMEDIATE ACTION ITEMS (Do This First)**

1. **Clear Your Calendar**
   - Block out next 2 weeks (no other commitments)
   - Inform family/friends you'll be unavailable
   - Set up workspace (quiet, comfortable, good desk/chair)
   - Stock up on food, caffeine, essentials

2. **Read the PRD (30 minutes)**
   - Open `/PRD.md` in this directory
   - Skim through (don't need to memorize, just understand scope)
   - Focus on: User Stories, Functional Requirements, Technical Architecture
   - Bookmark for reference during development

3. **Set Up Development Environment (1 hour)**
   ```bash
   # Install dependencies
   - Node.js 20+ ✅
   - PostgreSQL 15+ ✅
   - Redis 7+ ✅
   - Docker Desktop ✅
   - VS Code ✅
   
   # Verify installations
   node --version
   psql --version
   redis-cli --version
   docker --version
   ```

4. **Start Day 1 Immediately**
   - Don't overthink, just start
   - Follow the day-by-day plan exactly
   - Timebox each task (don't exceed allocated hours)
   - Ask questions early if stuck

---

### **YOUR PROMPT TO CLAUDE CODE (Copy This)**

```
🚨 AGGRESSIVE 2-WEEK BUILD SPRINT 🚨

I'm building an F&B supply chain ERP system and I have 2 weeks to ship a working MVP. 

REFERENCE DOCUMENTS:
1. PRD.md - Complete product requirements (read this for business context)
2. CLAUDE_CODE_PROMPT.md - Detailed 2-week execution plan (follow this religiously)

TIMELINE: 10 working days + 2 weekends = 14 days total
GOAL: Production-ready MVP deployed by end of Day 10

EXECUTION PLAN OVERVIEW:
- Day 1: Foundation (auth, multi-tenancy, audit trail)
- Day 2: Master data (items, locations, suppliers) + Procurement
- Day 3: Inbound receiving (3-step approval workflow) ⚡ CRITICAL
- Day 4: Outbound + Transfers
- Day 5: Finance + Backend APIs complete
- Weekend 1: Frontend blitz (all screens)
- Day 6: Dashboard + Reports UI
- Day 7: Integration testing + bug fixes
- Day 8: Security + Performance optimization
- Day 9: Testing + Documentation
- Day 10: Deployment to production
- Weekend 2: Buffer for slippage + final polish

CONSTRAINTS:
- Work 12-16 hour days (this is a sprint, not sustainable long-term)
- Ship working code daily (commit at end of each day)
- Cut scope ruthlessly (MVP features only, no nice-to-haves)
- Test continuously (don't wait until end)
- Ask questions early (don't waste time stuck)

MVP FEATURES ONLY (Everything else is cut):
✅ Multi-tenant architecture with schema isolation
✅ JWT authentication + RBAC
✅ Items, locations, suppliers master data
✅ Purchase orders with approval workflows
✅ Inbound receiving (procurement → QC → warehouse)
✅ Outbound requests (requester → warehouse → confirm)
✅ Inter-location transfers
✅ Real-time inventory visibility
✅ Basic cost tracking
✅ Basic payment tracking
✅ Reports (inventory valuation, purchase summary, payment aging)
✅ Management dashboard (KPIs + charts)
✅ Excel export
✅ Audit trail for all transactions

FEATURES CUT (Not building these):
❌ Mobile app
❌ Production management
❌ Advanced finance (AP/AR/GL)
❌ Foodics integration
❌ Email notifications
❌ Actual QR code scanning (use text input instead)
❌ Photo uploads to S3 (local storage only)
❌ Smart order suggestions (basic ordering only)

TECH STACK (Non-Negotiable):
Backend: NestJS + TypeScript + PostgreSQL + TypeORM + Redis
Frontend: React + TypeScript + Ant Design + Redux Toolkit
Infrastructure: Docker + Docker Compose
Deployment: NGINX + Let's Encrypt SSL

CRITICAL SUCCESS FACTORS:
1. Follow the day-by-day plan in CLAUDE_CODE_PROMPT.md
2. Timebox everything (if task takes >4 hours, simplify or cut)
3. Ship working code daily (commit to Git every night)
4. Test as you build (don't accumulate bugs)
5. Cut scope immediately if falling behind
6. Focus: What's the MINIMUM to make this work?

TODAY IS DAY 1. Let's start immediately.

FIRST TASK (Next 2 hours):
1. Initialize NestJS project with TypeScript
2. Set up folder structure (modules, common, config)
3. Configure TypeORM connection to PostgreSQL
4. Configure Redis connection
5. Create .env file structure
6. Test: Can start server? Can connect to DB? Can connect to Redis?

After completing this, I'll check in and we'll move to the next task (authentication module).

Let's ship this in 2 weeks. No excuses. LET'S GO! 🚀
```

---

### **COPY THIS PROMPT AND PASTE IT INTO CLAUDE CODE**

Then follow Day 1 plan exactly. Report back at end of each day with progress.

---

## ⏱️ TIME MANAGEMENT TIPS

**Pomodoro Technique (Recommended):**
- Work 90 minutes focused
- Take 10 minute break
- Repeat 4-5 times
- Take 30 minute meal break
- Back to work

**Daily Rhythm:**
- 8 AM: Start work (fresh mind for hard problems)
- 12 PM: Lunch break (30 min)
- 1 PM: Continue work
- 6 PM: Dinner break (30 min)
- 7 PM: Continue work
- 10 PM: End work, commit code, plan tomorrow
- 10:30 PM: Sleep (minimum 5-6 hours)

**When Stuck (>30 minutes on same problem):**
- Stop, ask Claude Code for help
- Simplify the problem
- Cut the feature if possible
- Move to next task, come back later

---

## 📞 CHECKPOINTS

**Daily Check-in (End of Day):**
- [ ] Did I complete today's deliverables?
- [ ] Did I commit working code?
- [ ] Are there any blockers for tomorrow?
- [ ] Am I on track or falling behind?
- [ ] Do I need to cut scope?

**Weekly Check-in (End of Week 1):**
- [ ] Is backend 100% complete?
- [ ] Is frontend 80% complete?
- [ ] Can I demo working workflows?
- [ ] What's left for Week 2?

**Pre-Launch Check (End of Day 9):**
- [ ] All P0 features working?
- [ ] Any blocking bugs?
- [ ] Ready to deploy tomorrow?
- [ ] Demo script prepared?

---

## 🎯 DEFINITION OF DONE

**For Each Feature:**
- [ ] Code committed to Git
- [ ] Works on localhost
- [ ] Basic error handling
- [ ] Audit trail logging (where applicable)
- [ ] Can be demoed to stakeholder

**For Production Deployment:**
- [ ] All P0 features complete
- [ ] No blocking bugs
- [ ] Basic security hardening done
- [ ] Deployed to production server
- [ ] HTTPS enabled
- [ ] Demo data seeded
- [ ] Documentation complete

---

## 🏁 YOU ARE NOW READY TO START

**Remember:**
- This is a sprint, not a marathon
- Long hours expected (12-16/day)
- Cut scope ruthlessly
- Ship working software daily
- Perfection is the enemy of done
- 80% solution shipped > 100% solution late

**Daily Mantra:**
> "Ship or die. No excuses. Let's GO!"

Copy the prompt above, paste into Claude Code, and START BUILDING NOW! 🚀

---

## 🎉 Let's Build!

You have:
✅ Complete PRD with all requirements  
✅ Detailed technical architecture  
✅ Clear technology stack  
✅ Week-by-week execution plan  
✅ User stories with acceptance criteria  
✅ Database schemas and API designs  

**Now execute the GSD plan sprint by sprint. Focus on quality, security, and delivering working software at each sprint. Good luck! 🚀**

---

## Quick Reference Commands

```bash
# Start development environment
docker-compose up -d
npm run start:dev

# Run migrations
npm run migration:run

# Seed demo data
npm run seed

# Run tests
npm run test
npm run test:cov
npm run test:e2e

# Build for production
npm run build

# Generate Swagger docs
# Access at http://localhost:3000/api/docs after starting server
```

---

**Remember:** Quality over speed. Build it right the first time. Security and data integrity are non-negotiable. Every line of code should be production-ready.
