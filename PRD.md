# Product Requirements Document (PRD)
## End-to-End Supply Chain ERP System for SMEs

**Version:** 1.0  
**Last Updated:** February 15, 2026  
**Project Owner:** Digital Solutions  
**Target Market:** SMEs in Egypt & MENA Region

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Product Vision & Objectives](#product-vision--objectives)
4. [Target Users](#target-users)
5. [Market Opportunity](#market-opportunity)
6. [Success Metrics & KPIs](#success-metrics--kpis)
7. [Scope & Phasing](#scope--phasing)
8. [Functional Requirements](#functional-requirements)
9. [Non-Functional Requirements](#non-functional-requirements)
10. [User Experience Requirements](#user-experience-requirements)
11. [Integrations](#integrations)
12. [Risks, Constraints & Assumptions](#risks-constraints--assumptions)

---

## Executive Summary

### Product Overview

This document defines requirements for an **end-to-end supply chain ERP system** designed specifically for small and medium enterprises (SMEs) in Egypt and the MENA region. The system bridges the critical gap between basic POS solutions and enterprise-level ERPs by providing comprehensive supply chain management capabilities at an affordable price point.

### Key Differentiators

- **Full supply chain visibility** from procurement to production to delivery
- **Multi-role approval workflows** to prevent fraud and inventory manipulation
- **Real-time tracking** with QR code-based location management
- **Smart automation** reducing manual labor and human error
- **Modular architecture** allowing gradual expansion as businesses grow
- **Affordable pricing** targeting SME budgets while delivering enterprise capabilities

### Project Trigger

This project addresses the gap between existing POS-focused solutions (e.g., Foodics) and complex enterprise ERPs (e.g., SAP, Oracle). While competitors excel in sales and POS functionality, they lack depth in inventory control, procurement management, and internal operations. This system provides a **smart, automated, and affordable alternative** that reduces theft, improves control, and supports SMEs with scalable supply chain solutions.

---

## Problem Statement

### What Problems Are We Solving?

SMEs lack an **integrated end-to-end supply chain solution** that covers the complete operational flow:
- **Procurement** → Managing suppliers, purchase orders, and receiving
- **Warehousing** → Tracking stock movements, locations, and transfers
- **Production** → Converting raw materials into finished goods
- **Distribution** → Managing store inventory and logistics
- **Finance** → Linking costs, payments, and profitability

Many businesses struggle with:
- Disconnected systems requiring manual data reconciliation
- Limited visibility across the supply chain
- Weak controls enabling theft and inventory manipulation
- Inefficient processes leading to financial losses
- Inability to scale operations effectively

### Current Pain Points

| Pain Point | Impact | Current State |
|------------|--------|---------------|
| **Manual processes** | Slow operations, high error rates | Heavy reliance on spreadsheets and human decisions |
| **Inventory inaccuracy** | Stock losses, customer dissatisfaction | Manual counting, no real-time visibility |
| **Weak controls** | Theft and manipulation | No approval workflows or audit trails |
| **Disconnected data** | Poor decision-making | Multiple systems that don't communicate |
| **Limited procurement visibility** | Supplier issues, cost overruns | No systematic supplier performance tracking |
| **Production blindness** | Waste, inefficiency | No tracking of actual vs. planned production |

### Regional Context (Egypt & MENA)

In Egypt especially, **weak system controls and over-reliance on manual labor** make inventory loss and manipulation serious problems. Existing systems focus primarily on sales (POS) and do not provide adequate control over:
- Stock movement between locations
- Supplier performance and quality
- Internal transfers and production processes
- Actual costs vs. theoretical costs

---

## Product Vision & Objectives

### Vision Statement

To become the **leading supply chain ERP platform for SMEs in MENA**, empowering businesses with enterprise-grade visibility, control, and automation at an affordable price, while remaining flexible enough to adapt to diverse business models.

### Core Objectives

1. **Reduce inventory losses** through multi-level approval workflows and real-time tracking
2. **Improve operational efficiency** by eliminating manual processes and automating workflows
3. **Increase visibility** across the entire supply chain for better decision-making
4. **Enable scalability** with modular architecture that grows with the business
5. **Provide affordability** targeting SME budgets without sacrificing functionality
6. **Ensure accuracy** through systematic controls and audit trails

---

## Target Users

### Primary User Roles

| Role | Responsibilities | Primary Frontend | Key Actions |
|------|------------------|------------------|-------------|
| **Business Owner / Top Management** | Strategic oversight, performance monitoring | Management Dashboard | View KPIs, trends, alerts; review reports |
| **Procurement User** | Supplier management, purchase orders | Web Backoffice | Create POs, manage suppliers, approve receipts |
| **Quality Control User** | Incoming inspection, quality verification | Mobile App | Inspect goods, approve/reject shipments |
| **Warehouse User** | Inventory receiving, storage, fulfillment | Mobile App | Scan locations, confirm receipts, issue items |
| **Production User** | Manufacturing execution, waste tracking | Mobile App | Confirm production, record output and waste |
| **Store Manager** | Store-level inventory, ordering | Mobile App | Submit stock requests, track status |
| **Finance Viewer** | Cost analysis, financial reporting | Management Dashboard | View costs, margins, financial data (read-only in Phase 1) |

### User Journey Overview

```
Procurement → Quality Control → Warehouse → Production → Store → Finance
     ↓              ↓              ↓            ↓          ↓         ↓
Create PO → Inspect Goods → Store Items → Make Products → Sell → Analyze Costs
```

---

## Market Opportunity

### Market Gap Analysis

| Solution Type | Strengths | Weaknesses | Target Market |
|---------------|-----------|------------|---------------|
| **POS Systems** (Foodics) | Easy to use, good for sales | Weak inventory depth, no procurement/production control | Small retail, single-location businesses |
| **Enterprise ERPs** (SAP, Oracle) | Comprehensive, powerful | Too expensive, too complex, long implementation | Large enterprises |
| **Our Solution** | End-to-end supply chain, affordable, SME-focused | New to market | **Growing SMEs in MENA** |

### Target Market Size

- **Primary**: F&B businesses (restaurants, cafes, central kitchens, bakeries)
- **Secondary**: Retail chains, manufacturing SMEs, distribution companies
- **Geographic Focus**: Egypt first, then expand to Saudi Arabia, UAE, Jordan

### Competitive Positioning

We position between **Foodics** (too basic) and **SAP/Oracle** (too complex):

```
Low Cost/Complexity ←→ High Cost/Complexity
    Foodics          OUR SOLUTION          SAP/Oracle
    (POS focus)      (Supply Chain)        (Enterprise)
```

---

## Success Metrics & KPIs

### Phase 1 Success Criteria

| Metric | Target | Measurement Method |
|--------|--------|--------------------|
| **Inventory Accuracy** | ≥90% | Regular cycle counts vs. system quantities |
| **Reduction in Inventory Shrinkage** | ≥30% reduction | Compare pre/post-implementation loss rates |
| **Procurement Cycle Time** | ≤50% reduction | Average time from PO creation to goods receipt |
| **User Adoption Rate** | ≥80% active daily users | Daily active users / total assigned users |
| **Approval Workflow Compliance** | 100% | % of transactions following approval rules |
| **Customer Satisfaction (NPS)** | ≥40 | Quarterly NPS surveys |

### Operational KPIs (Dashboard Metrics)

**Inventory Health**
- Stock accuracy rate
- Stock-out incidents
- Overstock value
- Inventory turnover ratio
- Slow-moving item count

**Procurement Performance**
- Average PO approval time
- Supplier on-time delivery rate
- Quality rejection rate
- Cost variance (planned vs. actual)

**Production Efficiency**
- Yield efficiency (actual vs. planned output)
- Waste percentage by category
- Production cycle time
- Cost variance per production order

**Operational Control**
- Pending approval count
- Overdue action items
- Exception/variance alerts
- Audit trail completeness

---

## Scope & Phasing

### Implementation Strategy

This is **not a full ERP implementation** from day one. The approach is **modular and phased**, focusing on high-impact areas first to ensure:
- Fast time-to-value
- Lower initial investment
- Easier adoption and change management
- Proven ROI before expanding scope

### Phase Breakdown

#### **Phase 1: Core Supply Chain (Priority)**

**Timeline**: 6-9 months  
**Focus**: Maximum operational impact, inventory control, theft prevention

**Core Modules**
- ✅ **Inventory Management** (Warehouse & Store)
  - Inbound receiving with multi-step approvals
  - Outbound fulfillment with confirmations
  - Real-time stock visibility
  - QR code-based location tracking
  - Inter-location transfers

- ✅ **Procurement Management**
  - Supplier master data
  - Purchase order workflows
  - Multi-level approval rules
  - Receiving against PO
  - Quality control integration

- ✅ **Logistics & Transfers**
  - Warehouse-to-store transfers
  - Transfer requests and confirmations
  - In-transit tracking
  - Location-based inventory

**Supporting Module**
- ✅ **Basic Finance Integration**
  - Cost capture (purchase prices)
  - Cost allocation to inventory
  - Basic payment tracking
  - Link to accounting system (API)

#### **Phase 2: Production & Advanced Finance (Expansion)**

**Timeline**: 6-12 months after Phase 1  
**Focus**: Manufacturing control, accurate costing, profitability analysis

**Modules**
- ✅ **Production Management**
  - Bill of Materials (BOM) management
  - Multi-level BOMs (raw → semi-finished → finished)
  - Production order workflows
  - Material issue to production
  - Production confirmation
  - Waste and loss tracking
  - Yield analysis

- ✅ **Advanced Costing**
  - Actual cost calculation
  - Standard cost vs. actual cost variance
  - Multi-level cost rollup
  - Labor and overhead allocation (optional)
  - Profitability by product/location

- ✅ **Full Finance Module**
  - Accounts payable
  - Accounts receivable
  - General ledger integration
  - Financial reporting
  - Budget vs. actual analysis

#### **Phase 3: Advanced Features (Future)**

**Timeline**: TBD based on market feedback  
**Modules under consideration:**
- Sales order management
- Customer relationship management (CRM)
- Advanced analytics and BI
- Demand forecasting
- Route optimization
- HR and payroll integration
- Multi-company consolidation

### Module Dependencies

```
Phase 1 Foundation
├── Inventory Management (Core)
├── Procurement Management (Core)
├── Logistics & Transfers (Core)
└── Basic Finance (Supporting)
        ↓
Phase 2 Expansion
├── Production Management (requires Inventory + Procurement)
├── Advanced Costing (requires Production + Inventory)
└── Full Finance Module (requires all Phase 1 + Production)
```

---

## Functional Requirements

### 1. Inventory & Warehouse Management

#### 1.1 Inbound Process

**Objective**: Ensure all received goods are verified, inspected, and accurately stored before becoming available inventory.

**Workflow States**

| State | Description | Responsible Role | Next Action |
|-------|-------------|------------------|-------------|
| **Pending Inspection** | Goods arrived, awaiting procurement review | Procurement User | Verify against PO |
| **Procurement Approved** | Quantities verified, forwarded to QC | Quality Control User | Inspect quality |
| **QC Approved** | Quality accepted, ready for warehousing | Warehouse User | Confirm receipt and location |
| **Received** | Goods in storage, available for use | System | Update inventory |
| **Partially Accepted** | Some items accepted, some rejected | Procurement User | Handle rejected items |
| **Rejected** | Entire shipment rejected | Procurement User | Return to supplier |

**Process Flow**

```
Goods Arrival → Procurement Verification → QC Inspection → Warehouse Confirmation → Available Inventory
     ↓                    ↓                      ↓                    ↓                      ↓
  Match to PO      Verify quantities      Inspect quality      Scan location         Update stock
```

**Detailed Steps**

1. **Procurement Verification**
   - System: Display pending purchase order
   - User: Verify supplier, items, and quantities received
   - User: Record discrepancies (missing, damaged, excess)
   - User: Attach photos/notes as evidence (optional)
   - System: Mark PO as "Procurement Approved" and route to QC

2. **Quality Control Inspection**
   - System: Display items pending inspection
   - User: Inspect physical goods for quality defects
   - User: Choose outcome:
     - **Full Accept**: All items pass quality standards
     - **Partial Accept**: Specify accepted vs. rejected quantities
     - **Full Reject**: Return entire shipment
   - User: Document rejection reasons (if applicable)
   - System: Route to warehouse (if accepted) or back to procurement (if rejected)

3. **Warehouse Confirmation**
   - System: Display items ready for storage
   - User: Physically move items to storage location
   - User: **Scan QR code** on shelf/rack/bin to confirm location
   - User: Enter batch/lot numbers (if applicable)
   - System: Add quantities to available inventory
   - System: Mark PO as "Received" and lock record

**Business Rules**

- ✅ Inventory is **not** available until all three approvals are complete
- ✅ No single user can approve all three steps (segregation of duties)
- ✅ Rejected items are **never** added to inventory
- ✅ Partial acceptances must specify exact accepted quantities
- ✅ All actions are timestamped and logged with user ID
- ✅ Location assignment via QR scan is **mandatory** for receiving

**Acceptance Criteria**

- [ ] System prevents inventory update until warehouse confirms
- [ ] System requires QR code scan before marking as received
- [ ] System allows photos/notes attachment during procurement verification
- [ ] System routes rejected items back to procurement automatically
- [ ] System displays real-time status updates to all users
- [ ] System logs all actions with user, timestamp, and device info

---

#### 1.2 Outbound Process

**Objective**: Enable internal departments (kitchens, production) to request and receive items from the warehouse with full traceability.

**Workflow States**

| State | Description | Responsible Role | Next Action |
|-------|-------------|------------------|-------------|
| **Pending Fulfillment** | Request submitted, awaiting warehouse action | Warehouse User | Prepare items |
| **Issued** | Items picked and removed from warehouse | Receiving Department | Confirm receipt |
| **Completed** | Receipt confirmed by requester | System | Close request |
| **Disputed** | Discrepancy between issued and received | Manager | Investigate |

**Process Flow**

```
Request Submission → Warehouse Preparation → Issue Confirmation → Receipt Confirmation → Completed
        ↓                      ↓                      ↓                    ↓                  ↓
   Select items         Scan shelf location    Deduct from stock     Verify delivery    Close transaction
```

**Detailed Steps**

1. **Request Submission (Requester - e.g., Chef)**
   - System: Display available items and current stock levels
   - User: Select required items and quantities
   - User: Submit request
   - System: Reserve requested quantities (not yet deducted)
   - System: Notify warehouse user

2. **Warehouse Preparation**
   - System: Display pending requests in priority order
   - User: Retrieve items from storage
   - User: **Scan QR code** on shelf to confirm source location
   - User: Confirm quantities being issued
   - System: Deduct from warehouse inventory
   - System: Mark request as "Issued" and in-transit

3. **Receipt Confirmation (Requester)**
   - System: Notify requester that items are in-transit
   - User: Physically receive items
   - User: Confirm receipt in system
   - User: Report discrepancies if quantities don't match
   - System: Mark request as "Completed"
   - System: Log final quantities and close transaction

**Business Rules**

- ✅ Inventory is reserved but not deducted until warehouse confirms issue
- ✅ Warehouse must scan shelf location to confirm source
- ✅ Requester must confirm receipt before transaction closes
- ✅ Discrepancies must be documented with reasons
- ✅ All movements are logged with timestamps and user IDs
- ✅ Requests cannot be edited after warehouse begins preparation

**Exception Handling**

| Exception | System Response | Required Action |
|-----------|----------------|-----------------|
| Requested qty > Available stock | Block submission, show available qty | Reduce request or wait for stock |
| Issued qty ≠ Received qty | Flag discrepancy, require explanation | Manager investigates, adjusts inventory |
| Requester doesn't confirm receipt within 24hrs | Auto-escalate to manager | Manager confirms or reopens investigation |

**Acceptance Criteria**

- [ ] System prevents over-issuing (cannot issue more than available)
- [ ] System requires QR scan before deducting inventory
- [ ] System supports partial fulfillment with quantity adjustments
- [ ] System sends real-time notifications to requester
- [ ] System locks requests after warehouse begins preparation
- [ ] System tracks time between request and receipt

---

#### 1.3 Current Storage & Visibility

**Real-Time Inventory Dashboard**

| View | Description | Users |
|------|-------------|-------|
| **Inventory Summary** | Total stock value, item count, locations | Management, Warehouse |
| **Stock by Location** | Quantities at each warehouse/store/shelf | Warehouse, Procurement |
| **Stock by Item** | All locations where item is stored | All operational users |
| **Low Stock Alerts** | Items below minimum threshold | Procurement, Management |
| **Overstock Alerts** | Items above maximum threshold | Procurement, Management |
| **Slow-Moving Items** | Items with no movement in X days | Management |
| **Expiry Tracking** | Items approaching expiration (if applicable) | Warehouse, QC |

**QR Code Location System**

- Every storage location (shelf, rack, bin, pallet) has a **unique QR code**
- QR codes are scanned during:
  - Receiving (to assign location)
  - Issuing (to confirm source)
  - Cycle counting (to verify accuracy)
  - Transfers (to confirm from/to locations)
- System maintains **real-time location map** of all inventory
- **Benefits**:
  - Eliminates manual location entry errors
  - Ensures accurate stock placement
  - Speeds up picking operations
  - Enables physical verification during audits

---

### 2. Procurement Management

#### 2.1 Supplier Master Data

**Required Fields**

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| Supplier Name | Text | Yes | Identification |
| Supplier Code | Auto-generated | Yes | Unique ID |
| Contact Person | Text | No | Primary contact |
| Phone / Email | Text | Yes | Communication |
| Address | Text | No | Delivery/invoicing |
| Payment Terms | Dropdown | Yes | Net 30, Net 60, COD, etc. |
| Tax ID | Text | Yes (if applicable) | Compliance |
| Preferred | Yes/No | No | Prioritization |
| Active Status | Active/Inactive | Yes | Enable/disable |
| Rating | 1-5 stars | Auto-calculated | Performance score |

**Supplier Performance Tracking**

| Metric | Calculation | Display |
|--------|-------------|---------|
| On-Time Delivery Rate | (On-time deliveries / Total deliveries) × 100 | Percentage + trend |
| Quality Acceptance Rate | (Accepted items / Total items) × 100 | Percentage + trend |
| Average Lead Time | Average days from PO to receipt | Days + comparison to promised |
| Price Variance | Actual price vs. quoted price | Percentage + alerts |
| Total Spend | Sum of all purchases | Currency + YTD comparison |

---

#### 2.2 Purchase Order (PO) Workflows

**PO Creation**

**Trigger Events**:
- Manual creation by procurement user
- Auto-generated from low stock alerts
- Auto-generated from production planning (Phase 2)

**PO Information Required**:

| Section | Fields |
|---------|--------|
| **Header** | PO Number (auto), Supplier, Date, Expected Delivery Date, Payment Terms, Delivery Location |
| **Line Items** | Item Code, Description, Unit, Quantity, Unit Price, Total Price, Tax |
| **Totals** | Subtotal, Tax, Shipping (if applicable), Grand Total |
| **Approvals** | Requested By, Approved By, Approval Date |
| **Notes** | Special instructions, delivery requirements |

**Approval Workflows**

**Approval Thresholds** (configurable):

| PO Value | Approval Required |
|----------|-------------------|
| < $500 | Auto-approved (or single approver) |
| $500 - $5,000 | Procurement Manager |
| $5,000 - $20,000 | Procurement Manager + Finance Manager |
| > $20,000 | Procurement Manager + Finance Manager + Business Owner |

**Workflow States**:

```
Draft → Pending Approval → Approved → Sent to Supplier → Partially Received → Fully Received → Closed
  ↓           ↓               ↓              ↓                    ↓                   ↓            ↓
Edit      Approve/Reject   Send email    Track delivery    Update inventory    Final accounting  Archive
```

**Business Rules**:

- ✅ POs must be approved before sending to supplier
- ✅ POs cannot be edited after approval (requires new version)
- ✅ Over-receiving against PO requires manager approval
- ✅ POs remain open until fully received or manually closed
- ✅ Cancelled POs must document reason and approver

---

#### 2.3 Receiving Against PO

**See Inbound Process (Section 1.1)** for detailed receiving workflow.

**Key Integration Points**:
- Procurement user opens PO during receiving
- System auto-fills expected quantities from PO
- Discrepancies are flagged and require approval
- System updates PO status based on received quantities:
  - **Partially Received**: Some items received, others pending
  - **Fully Received**: All items received, PO ready to close
  - **Over-Received**: Received more than ordered (requires approval)

---

### 3. Logistics & Transfer Management

#### 3.1 Inter-Location Transfers

**Purpose**: Move inventory between warehouses, stores, or production facilities with full traceability.

**Transfer Types**:
- Warehouse → Store (replenishment)
- Warehouse → Warehouse (consolidation/redistribution)
- Store → Warehouse (returns, overstock)
- Warehouse → Production (material issue - see Production module)

**Transfer Workflow**

```
Request → Approval → Pick & Pack → In-Transit → Receive → Confirm → Completed
   ↓         ↓           ↓             ↓           ↓         ↓          ↓
Create   Authorize   Deduct from   Track      Verify    Add to    Close
                     source                  delivery  destination
```

**Detailed Steps**:

1. **Transfer Request**
   - Requester: Store manager or warehouse supervisor
   - System: Display available stock at source location
   - User: Select items and quantities
   - User: Specify destination and expected delivery date
   - System: Create transfer request (status: Pending Approval)

2. **Approval** (for transfers above threshold)
   - Approver: Operations manager or business owner
   - System: Notify approver of pending request
   - Approver: Review and approve/reject
   - System: Update status to "Approved" and notify source warehouse

3. **Pick & Pack**
   - Warehouse user: Prepare items for shipment
   - User: Scan shelf QR codes to confirm source locations
   - User: Confirm picked quantities
   - System: Deduct from source location inventory
   - System: Update status to "In-Transit"

4. **Receipt at Destination**
   - Receiving user: Verify physical delivery
   - User: Scan destination shelf QR code
   - User: Confirm received quantities
   - System: Add to destination inventory
   - System: Update status to "Completed"

**Business Rules**:
- ✅ Transfers above $X require approval (configurable)
- ✅ Source inventory is deducted only after pick confirmation
- ✅ Destination inventory is added only after receipt confirmation
- ✅ In-transit inventory is tracked separately (not available at either location)
- ✅ Discrepancies between sent and received quantities require investigation
- ✅ All transfers are logged with timestamps, users, and reasons

---

#### 3.2 Store Ordering System

**Purpose**: Enable store managers to request inventory replenishment from central warehouse efficiently.

**Features**:

**Smart Ordering Interface**:
- Display current stock levels at store
- Show recommended order quantities based on:
  - Historical consumption patterns
  - Upcoming events/forecasts
  - Lead time from warehouse
  - Minimum/maximum stock levels
- One-click "suggested order" option
- Manual override capability

**Order Submission**:
- Store manager selects items and quantities
- System validates against warehouse availability
- System estimates delivery date based on logistics schedule
- Manager submits order
- System routes to warehouse as transfer request

**Order Tracking**:
- Store manager views order status in real-time:
  - Pending approval
  - Approved, awaiting pick
  - In-transit (with ETA)
  - Delivered
- Push notifications for status changes
- Exception alerts (e.g., out of stock items)

---

### 4. Production Management (Phase 2)

**Note**: Production module is planned for Phase 2. This section outlines requirements for future implementation.

#### 4.1 Bill of Materials (BOM)

**Purpose**: Define recipes and formulas for converting raw materials into finished/semi-finished products.

**BOM Structure**:

| Field | Description | Example |
|-------|-------------|---------|
| **Output Item** | Product being produced | "Chocolate Cake" |
| **Output Quantity** | Standard batch size | 10 cakes |
| **Output Unit** | Unit of measure | pieces |
| **Input Items** | Required materials | Flour, sugar, cocoa, eggs, etc. |
| **Input Quantities** | Amount per batch | 2kg flour, 1kg sugar, etc. |
| **Expected Loss** | Shrinkage/waste % | 5% (trimming, spillage) |
| **Labor Time** | Estimated hours | 2 hours |
| **Version** | BOM version number | v1.2 |

**Multi-Level BOMs**:
- Support for semi-finished goods (e.g., raw → dough → bread)
- Automatic cost rollup across levels
- Dependency tracking (changes to sub-items affect parent items)

**Example**:
```
Finished: Chocolate Cake
├── Semi-Finished: Cake Batter
│   ├── Raw: Flour (2kg)
│   ├── Raw: Sugar (1kg)
│   ├── Raw: Eggs (10 pieces)
│   └── Raw: Cocoa Powder (0.5kg)
├── Semi-Finished: Chocolate Frosting
│   ├── Raw: Butter (0.5kg)
│   ├── Raw: Cocoa Powder (0.3kg)
│   └── Raw: Sugar (0.8kg)
└── Labor: 2 hours
```

---

#### 4.2 Production Orders

**Creation Triggers**:
- Manual creation by production manager
- Auto-generated from sales forecasts (future)
- Auto-generated from minimum stock levels

**Production Order Workflow**:

```
Create → Approve → Issue Materials → Execute → Confirm Output → Calculate Costs → Close
  ↓        ↓            ↓              ↓           ↓                   ↓            ↓
Plan   Authorize   Reserve stock   Produce   Record actual      Analyze      Archive
```

**Detailed Steps**:

1. **Create Production Order**
   - User: Select item to produce and quantity
   - System: Auto-calculate required materials from BOM
   - System: Check material availability
   - System: Reserve required materials (not yet deducted)
   - User: Set planned production date
   - System: Create order (status: Pending Approval)

2. **Approve Production Order** (for orders above threshold)
   - Approver: Production manager or business owner
   - System: Notify approver
   - Approver: Review and approve/reject
   - System: Update status to "Approved"

3. **Issue Materials to Production**
   - Warehouse user: Prepare materials
   - User: Scan shelf locations
   - User: Confirm issued quantities
   - System: Deduct from warehouse inventory
   - System: Mark materials as "Issued to Production" (not yet consumed)
   - System: Update order status to "In Progress"

4. **Execute Production**
   - Production user: Manufacture products
   - User: Record actual quantities produced
   - User: Record waste by category (preparation loss, cooking loss, spoilage, error)
   - System: Update order status to "Awaiting Confirmation"

5. **Confirm Production Output**
   - Production supervisor: Verify output
   - User: Confirm produced quantities
   - User: Scan destination shelf location
   - System: Add finished goods to inventory
   - System: Calculate variances (planned vs. actual)
   - System: Flag abnormal losses for review

6. **Calculate Actual Costs**
   - System: Calculate cost based on actual material consumption
   - System: Add labor costs (if configured)
   - System: Allocate overhead (if configured)
   - System: Compare actual cost vs. standard cost
   - System: Highlight variances > threshold

7. **Close Production Order**
   - System: Finalize all costs and quantities
   - System: Archive order (read-only)
   - System: Update production analytics

**Business Rules**:
- ✅ No production without approved production order
- ✅ Materials must be issued before production can be confirmed
- ✅ Waste recording is mandatory for all production orders
- ✅ Significant variances (>X%) require manager review
- ✅ Cannot confirm production without scanning storage location
- ✅ Once closed, production orders cannot be edited (audit trail)

---

#### 4.3 Waste & Loss Tracking

**Waste Categories**:

| Category | Description | Typical % | Action Required |
|----------|-------------|-----------|-----------------|
| **Preparation Loss** | Trimming, peeling, cleaning | 5-15% | Normal, within tolerance |
| **Cooking Loss** | Evaporation, shrinkage | 10-25% | Normal, within tolerance |
| **Spoilage** | Expired, damaged during production | <2% | Investigate if higher |
| **Error** | Operator mistakes, recipe errors | <1% | Investigate, provide training |
| **Unknown** | Cannot be categorized | 0% | Always investigate |

**Variance Analysis**:
- System compares planned vs. actual output
- Calculates yield efficiency: `(Actual Output / Expected Output) × 100`
- Flags production orders with:
  - Yield < 80% (investigate immediately)
  - Yield 80-90% (review)
  - Waste > X% in any category

**Reporting**:
- Daily waste report by category
- Trend analysis (waste increasing/decreasing over time)
- Cost impact of waste (wasted materials × cost)
- Comparison across production lines/teams

---

### 5. Finance Integration (Phase 1: Basic, Phase 2: Advanced)

#### 5.1 Phase 1: Basic Finance Integration

**Scope**: Capture costs at point of transaction, link to inventory, basic payment tracking.

**Key Features**:

1. **Cost Capture**
   - Record purchase prices on all POs
   - Track landed costs (shipping, taxes, fees)
   - Calculate average cost per item
   - Update inventory valuation in real-time

2. **Payment Tracking**
   - Link invoices to purchase orders
   - Record payment status (Pending, Partial, Paid)
   - Track payment due dates
   - Alert for overdue payments

3. **Cost Visibility**
   - Show cost per unit on all inventory screens
   - Calculate total inventory value by location
   - Display cost trends over time
   - Compare purchase prices across suppliers

4. **Basic Reporting**
   - Purchase summary by supplier
   - Cost summary by item category
   - Payment aging report
   - Inventory valuation report

**Integration Points**:
- Export to accounting software (Excel, QuickBooks, etc.)
- API for real-time cost sync (if accounting system supports)

---

#### 5.2 Phase 2: Advanced Finance & Costing

**Scope**: Full cost accounting, profitability analysis, financial management.

**Key Features**:

1. **Advanced Costing**
   - **Standard Cost vs. Actual Cost**: Compare budgeted vs. actual material costs
   - **Multi-Level Cost Rollup**: Calculate costs through production stages (raw → semi → finished)
   - **Labor Costing**: Allocate direct labor to production orders
   - **Overhead Allocation**: Distribute indirect costs (utilities, rent) to products
   - **Landed Cost Calculation**: Include freight, customs, insurance in item cost

2. **Profitability Analysis**
   - Product profitability (revenue - actual cost)
   - Location profitability (by store/warehouse)
   - Customer profitability (if sales module added)
   - Margin analysis and trends

3. **Accounts Payable (AP)**
   - Vendor invoice matching (PO → Receipt → Invoice)
   - Three-way matching validation
   - Payment scheduling and execution
   - Vendor statements and reconciliation

4. **Accounts Receivable (AR)** (if sales added)
   - Customer invoicing
   - Payment collection tracking
   - Aging reports
   - Credit limit management

5. **General Ledger Integration**
   - Automatic journal entries for inventory transactions
   - Chart of accounts mapping
   - Trial balance and financial statements
   - Period close and reconciliation

6. **Budgeting & Variance Analysis**
   - Budget creation by department/category
   - Actual vs. budget comparison
   - Variance alerts and explanations
   - Forecast adjustments

---

## Non-Functional Requirements

### 1. Security & Access Control

#### 1.1 Role-Based Access Control (RBAC)

**Principle**: Users should only access features and data necessary for their job function.

**Access Control Matrix**:

| Module/Feature | Business Owner | Procurement | QC | Warehouse | Production | Store Manager | Finance Viewer |
|----------------|----------------|-------------|----|-----------|-----------:|-----------------|----------------|
| **View Inventory** | ✅ All locations | ✅ All locations | ✅ Pending inspection | ✅ Assigned locations | ✅ Production area | ✅ Own store | ✅ Read-only |
| **Create PO** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Approve PO** | ✅ All | ✅ Based on threshold | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Receive Goods** | ❌ | ✅ Verify | ✅ Inspect | ✅ Confirm | ❌ | ❌ | ❌ |
| **Issue Materials** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Confirm Production** | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Adjust Inventory** | ✅ With approval | ✅ With approval | ❌ | ✅ With approval | ❌ | ❌ | ❌ |
| **View Reports** | ✅ All | ✅ Procurement reports | ✅ Quality reports | ✅ Inventory reports | ✅ Production reports | ✅ Store reports | ✅ Financial reports |
| **View Costs** | ✅ | ✅ | ❌ | ❌ | ✅ Production costs | ❌ | ✅ |
| **Manage Users** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Approval Authority Levels** (configurable):

| Transaction Type | Threshold | Approval Required |
|------------------|-----------|-------------------|
| Purchase Order | < $500 | Auto-approved or single approver |
| Purchase Order | $500-$5,000 | Procurement Manager |
| Purchase Order | $5,000-$20,000 | Procurement + Finance |
| Purchase Order | > $20,000 | Procurement + Finance + Owner |
| Inventory Adjustment | Any value change | Manager approval + justification |
| Inter-Location Transfer | < $1,000 | Auto-approved |
| Inter-Location Transfer | > $1,000 | Operations Manager |
| Production Order | Any | Production Manager (Phase 2) |

**Segregation of Duties**:
- ✅ No single user can complete all steps of critical workflows:
  - **Inbound**: Procurement verify → QC inspect → Warehouse receive (3 different users)
  - **Outbound**: Requester submits → Warehouse issues → Requester confirms (2 different users)
  - **Production**: Order creator ≠ Material issuer ≠ Production confirmer (3 different users)
  - **PO Approval**: PO creator ≠ Approver
- ✅ System enforces these rules automatically (cannot bypass)

**Session Management**:
- Auto-logout after 30 minutes of inactivity (configurable)
- Concurrent session limits (1 active session per user)
- IP whitelisting for admin access (optional)
- Two-factor authentication (2FA) for high-privilege roles (optional, Phase 2)

---

#### 1.2 Audit Trails

**Objective**: Every action in the system must be fully traceable for accountability, fraud detection, and compliance.

**Logged Information for Every Transaction**:

| Field | Description | Example |
|-------|-------------|---------|
| **User ID** | Who performed the action | user_ahmed_123 |
| **User Role** | Role at time of action | Warehouse User |
| **Timestamp** | When the action occurred | 2026-02-15 14:35:22 UTC |
| **Action Type** | What was done | "Confirmed Receipt", "Issued Items", "Approved PO" |
| **Object Type** | What was affected | Purchase Order, Inventory Item, Transfer |
| **Object ID** | Specific record | PO-2024-001234 |
| **Before State** | Data before change | Qty: 100, Status: Pending |
| **After State** | Data after change | Qty: 150, Status: Approved |
| **Device Info** | Device used | Mobile (Android), IP: 192.168.1.50 |
| **Location** | Physical location | Main Warehouse, Cairo |
| **Reason** | Justification (if required) | "Customer order increase" |

**Audit Trail Rules**:
- ✅ Audit logs are **immutable** (cannot be edited or deleted by users)
- ✅ Admin users have read-only access to logs
- ✅ Logs are retained for minimum 7 years (compliance)
- ✅ Logs are backed up daily to separate secure storage
- ✅ Critical actions (deletions, adjustments, approvals) trigger immediate log entry

**Audit Trail Access**:
- Business owners can view all logs
- Managers can view logs for their department
- Finance/compliance can export logs for analysis
- External auditors can request logs (with approval)

**Audit Reports**:
- User activity summary (actions per user per day)
- Exception report (unusual patterns, after-hours access)
- Approval history (who approved what and when)
- Inventory adjustment history (all manual changes)
- Failed login attempts (security monitoring)

---

### 2. Performance Requirements

#### 2.1 Response Time

| Operation Type | Maximum Response Time | Target |
|----------------|----------------------|--------|
| **Page Load** | < 2 seconds | < 1 second |
| **Search/Filter** | < 1 second | < 500ms |
| **QR Code Scan** | < 1 second | Instant |
| **Transaction Commit** (single) | < 2 seconds | < 1 second |
| **Batch Operations** | < 5 seconds per 100 records | < 3 seconds |
| **Report Generation** (simple) | < 5 seconds | < 3 seconds |
| **Report Generation** (complex) | < 30 seconds | < 15 seconds |
| **Dashboard Refresh** | < 3 seconds | < 2 seconds |

#### 2.2 Concurrent Users

- **Phase 1 Target**: Support 50 concurrent users without performance degradation
- **Phase 2 Target**: Support 200 concurrent users
- **Peak Load**: System should handle 2x normal load during peak hours (e.g., end of month)

#### 2.3 Data Volume

- **Inventory Items**: Up to 10,000 SKUs per company
- **Transactions**: Up to 10,000 transactions per day
- **Locations**: Up to 100 locations (warehouses + stores)
- **Users**: Up to 500 users per company
- **Historical Data**: Retain 7 years of transactional data with acceptable query performance

#### 2.4 Real-Time Updates

- Inventory quantities must update **in real-time** (< 2 second latency)
- Approval notifications must be delivered **immediately**
- Dashboard KPIs must refresh **every 5 minutes** (configurable)
- Mobile app must sync with server **every 30 seconds** when active

---

### 3. Availability & Reliability

#### 3.1 Uptime Requirements

- **Target Availability**: 99.5% uptime (approximately 3.6 hours downtime per month)
- **Planned Maintenance Window**: Saturdays 11 PM - 3 AM (communicate 1 week in advance)
- **Unplanned Downtime**: < 1 hour per incident, < 5 hours per month total

#### 3.2 Cloud Architecture

- **Hosting**: Cloud-based (AWS, Azure, or Google Cloud)
- **Multi-Region**: Primary region in Middle East, backup in Europe (future)
- **Auto-Scaling**: Automatically scale server capacity based on load
- **Load Balancing**: Distribute traffic across multiple servers
- **Database**: Managed cloud database with automated backups

#### 3.3 Disaster Recovery

- **Backup Frequency**: Full backup daily, incremental backup every 4 hours
- **Backup Retention**: Daily backups for 30 days, monthly backups for 7 years
- **Recovery Time Objective (RTO)**: Restore service within 4 hours
- **Recovery Point Objective (RPO)**: Maximum 4 hours of data loss
- **Disaster Recovery Testing**: Quarterly restore drills

#### 3.4 Offline Tolerance

**Phase 1**:
- **Basic offline mode** for critical mobile operations:
  - QR code scanning (cached locally)
  - Confirmations (queued for sync)
  - View previously loaded data
- **Auto-sync** when connectivity restored
- **Conflict resolution** if multiple users edit same record offline

**Phase 2**:
- **Advanced offline mode** with local database:
  - Full inventory visibility
  - Create transactions offline
  - Offline reporting
  - Smart sync with conflict detection

**Offline Duration Tolerance**: Up to 8 hours without connectivity

---

### 4. Data Integrity

#### 4.1 Validation Rules

**Inventory Quantities**:
- ✅ Quantities cannot be negative (unless explicitly allowed + approval required)
- ✅ Decimal quantities must match unit type (e.g., pieces = whole numbers, kg = 2 decimals)
- ✅ Quantities must be within reasonable ranges (flag extreme values)

**Dates & Timestamps**:
- ✅ Future dates not allowed for completed transactions
- ✅ Transaction dates must be within current/previous accounting period
- ✅ Receipt date cannot be before PO date

**Approvals & Workflows**:
- ✅ Cannot skip required approval steps
- ✅ Cannot approve own transactions (segregation of duties)
- ✅ Approval sequence must be followed (cannot approve Step 3 before Step 2)

**Financial Data**:
- ✅ Costs must be positive numbers
- ✅ Total cost = unit cost × quantity (validation)
- ✅ Currency must be consistent within transaction

#### 4.2 Transaction Integrity

**ACID Compliance**:
- **Atomicity**: Transactions either fully succeed or fully fail (no partial updates)
- **Consistency**: Database constraints always enforced
- **Isolation**: Concurrent transactions don't interfere
- **Durability**: Committed data is never lost

**Locking Mechanisms**:
- **Optimistic Locking**: For most operations (read → edit → save with version check)
- **Pessimistic Locking**: For critical operations (inventory adjustments, approvals)
- **Conflict Detection**: Alert users if someone else edited the same record

#### 4.3 Data Protection Against Manipulation

**Once Closed/Posted, Records Are Immutable**:
- ✅ Completed transactions cannot be edited (read-only)
- ✅ Accounting periods, once closed, are locked
- ✅ Audit logs cannot be deleted or modified
- ✅ Any corrections require new transactions (reversals, adjustments)

**Manual Adjustments Require**:
- ✅ Written justification
- ✅ Manager approval
- ✅ Audit log entry
- ✅ Alert to business owner for large adjustments

**Automated Integrity Checks**:
- Daily reconciliation: Physical count locations vs. system quantities
- Weekly variance analysis: Flag unusual patterns
- Monthly audit: Compare costs, quantities, and financial totals

---

### 5. Scalability

**Growth Targets**:

| Metric | Phase 1 (Year 1) | Phase 2 (Year 2) | Phase 3 (Year 3+) |
|--------|------------------|------------------|-------------------|
| **Companies** | 10 companies | 50 companies | 200+ companies |
| **Users per Company** | 20-50 users | 50-200 users | 200-500 users |
| **Transactions/Day** | 1,000-5,000 | 5,000-20,000 | 20,000+ |
| **Storage** | 10 GB | 50 GB | 200 GB+ |

**Scalability Strategy**:
- **Horizontal Scaling**: Add more servers as load increases
- **Database Sharding**: Partition data by company for large deployments
- **Caching**: Implement Redis/Memcached for frequently accessed data
- **CDN**: Serve static assets from content delivery network
- **Microservices** (Phase 3): Break monolith into independent services for better scalability

---

## User Experience Requirements

### UX Philosophy

**Core Principles**:
1. **Role-Appropriate**: Each user sees only what's relevant to their job
2. **Mobile-First for Operations**: Warehouse, production, and store users work primarily on mobile
3. **Desktop for Planning**: Procurement, management, and finance users work on desktop
4. **Minimal Clicks**: Common actions should take ≤ 3 clicks
5. **Offline-Capable**: Critical operations work without internet
6. **Visual Feedback**: Every action has immediate visual confirmation
7. **Context-Aware**: System remembers user preferences and last actions

---

### Frontend 1: Mobile Operational App

**Target Users**: Warehouse, QC, Production, Store Managers

**Platform**: iOS and Android native apps (or React Native)

**Key Features**:

**Home Screen**:
- Quick action buttons (based on role):
  - Warehouse: "Receive Goods", "Issue Items", "Scan QR"
  - QC: "Pending Inspections"
  - Production: "Confirm Production"
  - Store Manager: "Request Stock"
- Pending tasks counter (e.g., "5 items awaiting inspection")
- Recent activity feed

**QR Code Scanner**:
- Instant camera access (one tap)
- Auto-focus and scan
- Visual confirmation (green check, sound)
- Show scanned location/item info immediately

**Confirmations**:
- Large, thumb-friendly buttons
- Swipe-to-confirm for critical actions
- Photo attachment (one tap to camera)
- Voice notes (optional)

**Offline Mode**:
- Cached data for last 24 hours
- Queue pending confirmations
- Visual indicator when offline
- Auto-sync when online

**UX Requirements**:
- ✅ Large touch targets (minimum 44x44 points)
- ✅ High contrast for warehouse lighting conditions
- ✅ Works with gloves (if needed for warehouse workers)
- ✅ Minimal text entry (use dropdowns, scanners, voice)
- ✅ Landscape and portrait orientation support
- ✅ Battery-efficient (scan intermittently, not continuous)

**Performance**:
- App launch: < 2 seconds
- Screen transitions: < 500ms
- QR scan: Instant recognition
- Photo upload: Background upload (doesn't block user)

---

### Frontend 2: Web Backoffice (Operations & Control)

**Target Users**: Procurement, Warehouse Supervisors, Production Managers

**Platform**: Responsive web application (desktop-optimized)

**Key Sections**:

**Dashboard** (Home):
- KPI cards (pending approvals, low stock alerts, overdue tasks)
- Charts (inventory trends, procurement summary)
- Quick links to common tasks
- Activity feed

**Procurement Module**:
- Supplier list (searchable, filterable)
- PO management (create, approve, track)
- Receiving workflow
- Supplier performance reports

**Warehouse Module**:
- Inventory browser (tree view: location → item)
- Stock movements log
- Transfer requests
- Cycle count management

**Production Module** (Phase 2):
- Production orders (create, schedule, track)
- BOM management
- Waste tracking
- Yield reports

**Shared Features**:
- Advanced search (filter by multiple criteria)
- Bulk actions (approve multiple POs at once)
- Export to Excel/PDF
- Print-friendly views

**UX Requirements**:
- ✅ Keyboard shortcuts for power users
- ✅ Breadcrumb navigation (always know where you are)
- ✅ Inline editing (click to edit, not full forms)
- ✅ Auto-save drafts
- ✅ Right-click context menus
- ✅ Responsive (works on tablets)

---

### Frontend 3: Management Dashboard

**Target Users**: Business Owner, Top Management, Finance Viewer

**Platform**: Responsive web application (desktop and tablet)

**Purpose**: Executive-level insights, not data entry

**Dashboard Layout**:

**Section 1: Financial Overview**
- Total inventory value (current)
- Cost of goods sold (COGS) - last 30 days
- Gross margin % (if sales data available)
- Outstanding payables

**Section 2: Inventory Health**
- Stock accuracy rate (cycle count results)
- Inventory turnover (times per year)
- Overstock value
- Stockout incidents (last 30 days)

**Section 3: Operational Alerts**
- Pending approvals (count + value)
- Overdue POs
- Low stock items (count)
- High variance production orders

**Section 4: Trends & Charts**
- Inventory value over time (last 12 months)
- Top 10 items by value
- Supplier spend distribution (pie chart)
- Production efficiency trend (if Phase 2)

**Section 5: Recent Activity**
- Last 10 transactions (high-value or exceptions)
- Recent approvals
- System alerts (security, errors)

**Drill-Down Capability**:
- Click any metric to see details
- Filter by date range, location, category
- Export detailed reports
- Schedule automatic email reports

**UX Requirements**:
- ✅ Read-only (no accidental edits)
- ✅ Customizable (users can rearrange widgets)
- ✅ Real-time updates (auto-refresh every 5 minutes)
- ✅ Mobile-friendly (responsive charts)
- ✅ Print-friendly (quarterly board reports)

---

### Shared UX Requirements (All Frontends)

**Notifications**:
- Push notifications (mobile) for critical actions
- In-app notifications (desktop) for updates
- Email notifications (configurable per user)
- SMS notifications (optional, for urgent alerts)

**Help & Support**:
- Contextual help (? icon on every screen)
- Video tutorials (embedded)
- Search help articles
- Live chat support (business hours)

**Accessibility**:
- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode option
- Font size adjustments

**Internationalization** (Phase 2):
- Support for Arabic (RTL layout)
- Support for English
- Currency formatting (EGP, USD, SAR, AED)
- Date/time formatting (localized)

---

## Integrations

### 1. Foodics POS Integration

**Purpose**: Sync sales data from Foodics POS to our ERP for complete visibility.

**Integration Type**: API-based (Foodics provides REST API)

**Data Flow**:

```
Foodics POS → Sales Transaction → Our ERP
                ↓
         Deduct inventory
         Record revenue
         Update customer data (if applicable)
```

**Sync Frequency**: Real-time (webhook) or every 15 minutes (polling)

**Data Synced from Foodics to ERP**:

| Data Type | Fields | Purpose |
|-----------|--------|---------|
| **Sales Transactions** | Order ID, Date, Time, Items, Quantities, Prices, Payment Method | Revenue tracking, inventory deduction |
| **Inventory Adjustments** | Item, Old Qty, New Qty, Reason | Reflect manual counts done in Foodics |
| **Menu Items** | Item Code, Name, Price, Category | Master data sync |
| **Customers** | Customer ID, Name, Phone, Email | CRM integration (Phase 2) |

**Data Synced from ERP to Foodics**:

| Data Type | Fields | Purpose |
|-----------|--------|---------|
| **Inventory Levels** | Item, Available Qty, Location | Real-time stock availability in POS |
| **New Items** | Item Code, Name, Price, Recipe (if applicable) | Sync new products to POS menu |
| **Price Updates** | Item, New Price | Centralized pricing management |

**Error Handling**:
- If sync fails, retry 3 times with exponential backoff
- Log all failed syncs for manual review
- Alert procurement team if inventory discrepancy > 10%

**Reconciliation**:
- Daily reconciliation report (ERP inventory vs. Foodics inventory)
- Weekly sync audit (all transactions matched)
- Manual reconciliation tool for exceptions

**Implementation Notes**:
- Use Foodics API v5 (latest stable version)
- Authenticate via OAuth 2.0
- Implement webhook listeners for real-time events
- Store Foodics transaction IDs for deduplication

---

### 2. Accounting Software Integration (Phase 1: Basic)

**Purpose**: Export financial data to existing accounting systems.

**Supported Formats**:
- Excel/CSV export
- QuickBooks IIF format (if customer uses QuickBooks)
- Generic journal entry format (for manual import)

**Exported Data**:
- Purchase transactions (date, supplier, items, costs, payment)
- Inventory valuation (by location and category)
- Payment summary (due dates, amounts, status)

**Export Schedule**: On-demand or automated (end of day, end of month)

---

### 3. Accounting Software Integration (Phase 2: Advanced)

**Purpose**: Real-time bidirectional sync with accounting systems.

**Supported Systems** (in priority order):
1. Zoho Books (popular in MENA)
2. QuickBooks Online
3. Xero
4. Odoo (if customers use Odoo Accounting)
5. SAP Business One (for enterprise customers)

**Sync Direction**:

**ERP → Accounting**:
- Purchase invoices (from POs)
- Inventory valuation changes
- Journal entries (inventory movements)
- Payment transactions

**Accounting → ERP**:
- Vendor payments confirmation
- Chart of accounts updates
- Tax rate changes

**Sync Frequency**: Real-time for critical transactions, daily batch for reports

---

### 4. Future Integrations (Phase 3+)

**Logistics Partners**:
- Aramex, DHL, FedEx (shipping APIs)
- Local delivery providers in Egypt
- Track shipments, auto-update transfer status

**Payment Gateways**:
- Fawry (Egypt)
- Paymob (MENA)
- Stripe (international)

**E-Commerce Platforms**:
- Shopify
- WooCommerce
- Custom web stores

**Government Compliance**:
- Egypt Tax Authority (e-invoicing)
- Saudi Arabia ZATCA (Fatoora)

---

## Risks, Constraints & Assumptions

### Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| **User Adoption Resistance** | High | High | Extensive training, phased rollout, incentivize early adopters |
| **Data Migration Errors** | Medium | High | Thorough testing, parallel run period, rollback plan |
| **Integration Failures** (Foodics) | Medium | Medium | Build robust error handling, manual fallback, test extensively |
| **Performance Issues at Scale** | Low | High | Load testing, cloud auto-scaling, optimize database queries |
| **Security Breach** | Low | Critical | Penetration testing, regular audits, encryption, access controls |
| **Supplier/Customer Resistance to Change** | Medium | Medium | Communicate benefits, provide support, gradual transition |
| **Budget Overruns** | Medium | Medium | Phased approach, MVP first, monitor costs closely |
| **Key Personnel Turnover** | Medium | High | Documentation, knowledge transfer, cross-training |

### Constraints

**Technical**:
- Must integrate with Foodics API (no alternative POS initially)
- Must work on Android and iOS (can't be iOS-only)
- Must support Arabic language (Phase 2, but plan architecture now)

**Business**:
- Initial budget: $X (to be defined)
- Go-live deadline: Q3 2026 (Phase 1)
- Team size: 5-8 developers + 2 designers + 1 PM

**Operational**:
- Internet connectivity may be unreliable in some locations (hence offline mode)
- Some users may have low technical literacy (hence simple mobile UX)
- Customers may resist complex approval workflows (hence configurable thresholds)

### Assumptions

**User Assumptions**:
- ✅ Users have smartphones (Android or iOS)
- ✅ Users have basic smartphone literacy (can scan QR codes)
- ✅ Warehouse locations have WiFi or cellular connectivity (at least intermittently)
- ✅ Management reviews dashboards at least weekly

**Business Assumptions**:
- ✅ Customers are willing to pay $X per user per month (SaaS pricing)
- ✅ Customers see value in supply chain control (not just POS)
- ✅ Initial target market is F&B, but system is flexible for other industries

**Technical Assumptions**:
- ✅ Cloud infrastructure is reliable and scalable
- ✅ Foodics API remains stable and accessible
- ✅ QR code scanning technology is mature and reliable

**Data Assumptions**:
- ✅ Customers can provide clean master data (items, suppliers, locations)
- ✅ Historical data migration is limited (start fresh for most customers)

---

## Out of Scope (Phase 1)

**Explicitly Not Included**:

- ❌ Full production management (deferred to Phase 2)
- ❌ Advanced finance (GL, AP, AR) - basic only in Phase 1
- ❌ HR and payroll
- ❌ CRM and sales pipeline
- ❌ E-commerce integration
- ❌ Marketing automation
- ❌ Multi-company consolidation
- ❌ Advanced forecasting and demand planning
- ❌ Route optimization for logistics
- ❌ Customer-facing portal
- ❌ Marketplace or supplier portal

**These may be added in future phases based on customer demand.**

---

## User Stories

### Epic 1: Inventory Management

#### Story 1.1: Inbound Receiving - Procurement Verification
**As a** Procurement User  
**I want to** verify received goods against purchase orders  
**So that** I can ensure we received the correct items and quantities from suppliers

**Acceptance Criteria:**
- [ ] I can view all pending purchase orders awaiting verification
- [ ] I can see expected vs. actual quantities side by side
- [ ] I can mark items as received, partially received, or rejected
- [ ] I can attach photos of damaged goods
- [ ] I can add notes explaining discrepancies
- [ ] System automatically routes to QC after I approve
- [ ] I cannot verify goods if I created the purchase order (segregation of duties)

**Priority:** P0 (Must Have)  
**Effort:** 5 points  
**Dependencies:** Purchase Order module complete

---

#### Story 1.2: Inbound Receiving - Quality Control Inspection
**As a** Quality Control User  
**I want to** inspect incoming goods for quality defects  
**So that** only acceptable products enter our inventory

**Acceptance Criteria:**
- [ ] I can view all items pending quality inspection
- [ ] I can see procurement notes and photos from verification step
- [ ] I can accept all, accept partial, or reject entire shipment
- [ ] I can categorize rejection reasons (damaged, expired, wrong specification, etc.)
- [ ] I can attach inspection photos
- [ ] System blocks rejected items from entering inventory
- [ ] System routes approved items to warehouse for storage

**Priority:** P0 (Must Have)  
**Effort:** 5 points  
**Dependencies:** Story 1.1 complete

---

#### Story 1.3: Inbound Receiving - Warehouse Storage Confirmation
**As a** Warehouse User  
**I want to** confirm receipt and assign storage locations using QR codes  
**So that** inventory is accurately tracked and easily located

**Acceptance Criteria:**
- [ ] I can view items approved by QC and ready for storage
- [ ] I can scan QR codes on shelves to assign locations
- [ ] System validates that scanned location is valid and available
- [ ] I can enter batch/lot numbers during receiving
- [ ] System only adds to available inventory after I confirm
- [ ] I can see real-time updates to stock levels
- [ ] System prevents duplicate scans of same shipment

**Priority:** P0 (Must Have)  
**Effort:** 8 points  
**Dependencies:** Story 1.2 complete, QR code system implemented

---

#### Story 1.4: Outbound Fulfillment - Request Submission
**As a** Chef/Production User  
**I want to** request materials from the warehouse through a simple interface  
**So that** I can get what I need for daily operations quickly

**Acceptance Criteria:**
- [ ] I can see available stock quantities for all items
- [ ] I can search and filter items by category
- [ ] I can select multiple items in one request
- [ ] System shows me if requested quantity exceeds available stock
- [ ] I can save requests as drafts
- [ ] I receive notification when warehouse fulfills my request
- [ ] I can view status of all my pending requests

**Priority:** P0 (Must Have)  
**Effort:** 5 points  
**Dependencies:** Inventory visibility module

---

#### Story 1.5: Outbound Fulfillment - Warehouse Issue
**As a** Warehouse User  
**I want to** pick items and scan shelf locations when fulfilling requests  
**So that** inventory is accurately deducted from the right locations

**Acceptance Criteria:**
- [ ] I can view pending requests in priority order
- [ ] I can scan shelf QR codes to confirm I'm taking from correct location
- [ ] System deducts inventory only after I confirm issue
- [ ] I can handle partial fulfillment if stock is insufficient
- [ ] System marks request as "in-transit" after issue
- [ ] I can see which requests are urgent vs. routine

**Priority:** P0 (Must Have)  
**Effort:** 5 points  
**Dependencies:** Story 1.4 complete

---

#### Story 1.6: Outbound Fulfillment - Receipt Confirmation
**As a** Chef/Production User  
**I want to** confirm receipt of items delivered from warehouse  
**So that** discrepancies are caught and inventory is accurate

**Acceptance Criteria:**
- [ ] I receive notification when items are in-transit
- [ ] I can confirm receipt with one tap
- [ ] I can report discrepancies (short shipment, wrong items)
- [ ] System requires me to explain any differences
- [ ] Transaction doesn't close until I confirm
- [ ] System escalates if I don't confirm within 24 hours

**Priority:** P0 (Must Have)  
**Effort:** 3 points  
**Dependencies:** Story 1.5 complete

---

#### Story 1.7: Real-Time Inventory Visibility
**As a** Manager/Business Owner  
**I want to** see real-time inventory levels across all locations  
**So that** I can make informed decisions about purchasing and operations

**Acceptance Criteria:**
- [ ] Dashboard shows total inventory value
- [ ] I can drill down by location (warehouse, store, in-transit)
- [ ] I can drill down by item category
- [ ] I can see items below minimum stock level (alerts)
- [ ] I can see slow-moving items (no movement in X days)
- [ ] I can export data to Excel
- [ ] Data updates in real-time (< 2 second lag)

**Priority:** P0 (Must Have)  
**Effort:** 8 points  
**Dependencies:** All inventory transactions logging correctly

---

### Epic 2: Procurement Management

#### Story 2.1: Supplier Management
**As a** Procurement User  
**I want to** maintain a database of suppliers with performance tracking  
**So that** I can choose the best suppliers and manage relationships

**Acceptance Criteria:**
- [ ] I can add new suppliers with contact info, payment terms, tax ID
- [ ] I can mark suppliers as active/inactive
- [ ] I can mark preferred suppliers
- [ ] System tracks on-time delivery rate per supplier
- [ ] System tracks quality acceptance rate per supplier
- [ ] I can view total spend per supplier (YTD, all-time)
- [ ] I can compare prices across suppliers for same item

**Priority:** P0 (Must Have)  
**Effort:** 5 points  
**Dependencies:** None

---

#### Story 2.2: Purchase Order Creation
**As a** Procurement User  
**I want to** create purchase orders quickly from templates or manually  
**So that** I can order materials efficiently

**Acceptance Criteria:**
- [ ] I can create PO from scratch or from low-stock alerts
- [ ] I can select supplier and system auto-fills payment terms
- [ ] I can add multiple line items (item, quantity, price)
- [ ] System auto-calculates totals including tax
- [ ] I can save as draft and submit for approval later
- [ ] I can duplicate previous POs to save time
- [ ] I can attach files (quotes, specifications)

**Priority:** P0 (Must Have)  
**Effort:** 8 points  
**Dependencies:** Story 2.1 complete, Item master data

---

#### Story 2.3: Purchase Order Approval Workflow
**As a** Procurement Manager  
**I want to** approve or reject purchase orders based on value thresholds  
**So that** spending is controlled and authorized

**Acceptance Criteria:**
- [ ] I receive notification when PO is pending my approval
- [ ] I can see PO details (supplier, items, total value)
- [ ] I can approve or reject with one click
- [ ] I must provide reason if rejecting
- [ ] System routes to next approver if value exceeds my threshold
- [ ] I can see approval history (who approved when)
- [ ] I cannot approve POs I created myself

**Priority:** P0 (Must Have)  
**Effort:** 8 points  
**Dependencies:** Story 2.2 complete

---

#### Story 2.4: Purchase Order Tracking
**As a** Procurement User  
**I want to** track status of all purchase orders in one view  
**So that** I can follow up on deliveries and manage exceptions

**Acceptance Criteria:**
- [ ] I can filter POs by status (draft, pending, approved, sent, received)
- [ ] I can see expected delivery date vs. actual
- [ ] I can see which POs are overdue
- [ ] I can mark PO as "sent to supplier"
- [ ] System shows partial vs. full receipt status
- [ ] I can add notes/comments to PO
- [ ] I can search by PO number, supplier, or item

**Priority:** P1 (Should Have)  
**Effort:** 5 points  
**Dependencies:** Story 2.3 complete

---

### Epic 3: Logistics & Transfers

#### Story 3.1: Inter-Location Transfer Request
**As a** Store Manager  
**I want to** request stock transfers from central warehouse  
**So that** my store has adequate inventory to operate

**Acceptance Criteria:**
- [ ] I can see what's available at the warehouse in real-time
- [ ] System suggests order quantities based on my consumption patterns
- [ ] I can manually adjust suggested quantities
- [ ] I can specify required delivery date
- [ ] System validates warehouse has enough stock
- [ ] I receive confirmation when request is approved
- [ ] I can track transfer status (pending, approved, in-transit, delivered)

**Priority:** P0 (Must Have)  
**Effort:** 8 points  
**Dependencies:** Inventory visibility, Transfer workflow

---

#### Story 3.2: Transfer Fulfillment
**As a** Warehouse User  
**I want to** pick and pack items for approved transfer requests  
**So that** stores receive correct items in good condition

**Acceptance Criteria:**
- [ ] I can view approved transfers in priority order
- [ ] I can scan shelf QR codes when picking items
- [ ] System deducts from warehouse inventory after pick confirmation
- [ ] I can mark items as "in-transit"
- [ ] I can generate packing slip for driver
- [ ] I can update expected delivery time
- [ ] System prevents over-picking (more than requested)

**Priority:** P0 (Must Have)  
**Effort:** 5 points  
**Dependencies:** Story 3.1 complete

---

#### Story 3.3: Transfer Receipt at Destination
**As a** Store Manager  
**I want to** confirm receipt of transferred items  
**So that** my store inventory is accurately updated

**Acceptance Criteria:**
- [ ] I receive notification when shipment is in-transit
- [ ] I can verify items against packing slip
- [ ] I can scan destination shelf QR codes
- [ ] I can report discrepancies (short shipment, damage)
- [ ] System adds items to my store inventory after confirmation
- [ ] System closes transfer and notifies warehouse
- [ ] Unconfirmed transfers auto-escalate after 24 hours

**Priority:** P0 (Must Have)  
**Effort:** 5 points  
**Dependencies:** Story 3.2 complete

---

### Epic 4: Production Management (Phase 2)

#### Story 4.1: Bill of Materials (BOM) Management
**As a** Production Manager  
**I want to** define recipes/formulas for products  
**So that** system knows what materials are needed for production

**Acceptance Criteria:**
- [ ] I can create BOM with output item and quantity
- [ ] I can add multiple input items with quantities
- [ ] I can specify expected loss percentage
- [ ] I can create multi-level BOMs (semi-finished → finished)
- [ ] I can version BOMs (track changes over time)
- [ ] System calculates material requirements automatically
- [ ] I can copy existing BOMs to create new ones

**Priority:** P0 (Phase 2)  
**Effort:** 8 points  
**Dependencies:** Item master data

---

#### Story 4.2: Production Order Creation
**As a** Production Manager  
**I want to** create production orders based on demand  
**So that** production is planned and materials are reserved

**Acceptance Criteria:**
- [ ] I can select item to produce and quantity
- [ ] System auto-calculates required materials from BOM
- [ ] System checks if materials are available
- [ ] System reserves materials (doesn't deduct yet)
- [ ] I can schedule production date
- [ ] I can create recurring production orders
- [ ] System alerts me if materials are insufficient

**Priority:** P0 (Phase 2)  
**Effort:** 8 points  
**Dependencies:** Story 4.1 complete

---

#### Story 4.3: Material Issue to Production
**As a** Warehouse User  
**I want to** issue materials to production floor  
**So that** production team has what they need and inventory is tracked

**Acceptance Criteria:**
- [ ] I can view production orders ready for material issue
- [ ] I can scan shelf locations when issuing materials
- [ ] System deducts from warehouse inventory
- [ ] System marks materials as "issued to production" (not consumed)
- [ ] I can issue partial quantities if needed
- [ ] System prevents issuing if production order not approved

**Priority:** P0 (Phase 2)  
**Effort:** 5 points  
**Dependencies:** Story 4.2 complete

---

#### Story 4.4: Production Execution & Confirmation
**As a** Production User  
**I want to** confirm production output and record waste  
**So that** inventory is updated with finished goods

**Acceptance Criteria:**
- [ ] I can view production orders in progress
- [ ] I can record actual quantity produced
- [ ] I must record waste by category (prep loss, cooking loss, spoilage, error)
- [ ] I can scan storage location for finished goods
- [ ] System calculates yield efficiency (actual vs. planned)
- [ ] System alerts if yield is abnormally low (<80%)
- [ ] System adds finished goods to inventory after confirmation

**Priority:** P0 (Phase 2)  
**Effort:** 8 points  
**Dependencies:** Story 4.3 complete

---

#### Story 4.5: Production Cost Calculation
**As a** Finance Manager  
**I want to** see actual production costs vs. standard costs  
**So that** I can identify inefficiencies and price products correctly

**Acceptance Criteria:**
- [ ] System calculates actual material cost (consumed quantities × unit cost)
- [ ] System rolls up costs for multi-level BOMs
- [ ] System compares actual vs. standard cost
- [ ] System highlights variances > 10%
- [ ] I can drill down to see which materials caused variance
- [ ] I can export cost reports to Excel
- [ ] System updates standard costs based on recent actuals (configurable)

**Priority:** P1 (Phase 2)  
**Effort:** 8 points  
**Dependencies:** Story 4.4 complete

---

### Epic 5: Finance Integration

#### Story 5.1: Cost Tracking at Receipt
**As a** Finance Viewer  
**I want to** see costs recorded when goods are received  
**So that** inventory valuation is accurate

**Acceptance Criteria:**
- [ ] System captures unit cost from purchase order
- [ ] System captures additional costs (shipping, taxes, duties)
- [ ] System calculates landed cost per unit
- [ ] System uses weighted average method for inventory valuation
- [ ] I can view cost history per item (price trends)
- [ ] System alerts if purchase price deviates >20% from average

**Priority:** P0 (Phase 1)  
**Effort:** 5 points  
**Dependencies:** Inbound receiving workflow

---

#### Story 5.2: Payment Tracking
**As a** Procurement User  
**I want to** track payment status for purchase orders  
**So that** I know what's owed to suppliers

**Acceptance Criteria:**
- [ ] I can link supplier invoice to purchase order
- [ ] I can mark payment status (pending, partial, paid)
- [ ] I can record payment date and amount
- [ ] System shows outstanding balance per supplier
- [ ] System alerts for overdue payments
- [ ] I can generate payment aging report

**Priority:** P1 (Phase 1)  
**Effort:** 5 points  
**Dependencies:** Purchase order module

---

#### Story 5.3: Inventory Valuation Report
**As a** Business Owner  
**I want to** see total inventory value across all locations  
**So that** I understand my working capital

**Acceptance Criteria:**
- [ ] Report shows total inventory value (quantity × cost)
- [ ] I can break down by location
- [ ] I can break down by category
- [ ] I can see value trend over time (last 12 months)
- [ ] I can export to Excel for accounting
- [ ] Report uses real-time data (< 5 min delay)

**Priority:** P0 (Phase 1)  
**Effort:** 5 points  
**Dependencies:** Cost tracking, inventory transactions

---

### Epic 6: Reporting & Analytics

#### Story 6.1: Management Dashboard
**As a** Business Owner  
**I want to** see key metrics in one dashboard  
**So that** I can monitor business health at a glance

**Acceptance Criteria:**
- [ ] Dashboard shows total inventory value
- [ ] Dashboard shows pending approvals count
- [ ] Dashboard shows low stock alerts
- [ ] Dashboard shows top 10 items by value
- [ ] Dashboard shows supplier spend distribution
- [ ] Dashboard auto-refreshes every 5 minutes
- [ ] I can customize which widgets to show

**Priority:** P0 (Phase 1)  
**Effort:** 8 points  
**Dependencies:** All core modules

---

#### Story 6.2: Inventory Accuracy Report
**As a** Warehouse Manager  
**I want to** track inventory accuracy over time  
**So that** I can measure improvement and identify problem areas

**Acceptance Criteria:**
- [ ] Report shows cycle count results (system vs. physical)
- [ ] Report calculates accuracy percentage
- [ ] I can see accuracy trend (improving or declining)
- [ ] I can drill down by location or item category
- [ ] I can see which items have biggest discrepancies
- [ ] I can export to PDF for management review

**Priority:** P1 (Phase 1)  
**Effort:** 5 points  
**Dependencies:** Cycle counting feature

---

#### Story 6.3: Supplier Performance Report
**As a** Procurement Manager  
**I want to** compare supplier performance metrics  
**So that** I can make better sourcing decisions

**Acceptance Criteria:**
- [ ] Report shows on-time delivery rate per supplier
- [ ] Report shows quality acceptance rate per supplier
- [ ] Report shows average lead time per supplier
- [ ] Report shows price variance (quoted vs. actual)
- [ ] I can filter by date range
- [ ] I can rank suppliers by performance score
- [ ] I can export to Excel

**Priority:** P1 (Phase 1)  
**Effort:** 5 points  
**Dependencies:** Procurement workflows complete

---

### Epic 7: Mobile & UX

#### Story 7.1: QR Code Scanning
**As a** Warehouse User  
**I want to** scan QR codes quickly with my mobile device  
**So that** I can work efficiently without typing

**Acceptance Criteria:**
- [ ] Camera opens instantly when scan button tapped
- [ ] QR code recognized within 1 second
- [ ] System validates QR code is correct location/item
- [ ] Visual and audio feedback on successful scan
- [ ] Works offline (validates against cached data)
- [ ] Works in low light (camera flash auto-activates)

**Priority:** P0 (Phase 1)  
**Effort:** 5 points  
**Dependencies:** Mobile app framework

---

#### Story 7.2: Offline Mode
**As a** Warehouse User  
**I want to** continue working when internet is down  
**So that** operations don't stop due to connectivity issues

**Acceptance Criteria:**
- [ ] App caches last 24 hours of data
- [ ] I can scan QR codes offline
- [ ] I can confirm receipts/issues offline
- [ ] Actions queue locally and sync when online
- [ ] Visual indicator shows I'm offline
- [ ] System prevents conflicting actions (same item edited twice)
- [ ] Auto-sync when connectivity restored

**Priority:** P1 (Phase 1)  
**Effort:** 13 points  
**Dependencies:** Mobile app, local storage

---

#### Story 7.3: Push Notifications
**As a** any user  
**I want to** receive timely notifications for actions requiring my attention  
**So that** I don't miss important tasks

**Acceptance Criteria:**
- [ ] I receive push notification when action requires my approval
- [ ] I receive notification when my request is fulfilled
- [ ] I can configure notification preferences (email, push, SMS)
- [ ] Notifications include actionable link (tap to open relevant screen)
- [ ] I can snooze non-urgent notifications
- [ ] Notifications don't duplicate (one per event)

**Priority:** P1 (Phase 1)  
**Effort:** 5 points  
**Dependencies:** Mobile app, notification service

---

### Epic 8: Security & Compliance

#### Story 8.1: Role-Based Access Control
**As a** System Administrator  
**I want to** assign roles and permissions to users  
**So that** users only access features relevant to their job

**Acceptance Criteria:**
- [ ] I can create custom roles
- [ ] I can assign permissions per module (view, create, edit, delete, approve)
- [ ] I can assign users to roles
- [ ] Users with multiple roles get combined permissions
- [ ] System enforces permissions (blocks unauthorized access)
- [ ] I can view audit log of permission changes

**Priority:** P0 (Phase 1)  
**Effort:** 8 points  
**Dependencies:** User management module

---

#### Story 8.2: Audit Trail
**As a** Business Owner  
**I want to** see complete history of all system actions  
**So that** I can investigate discrepancies and ensure accountability

**Acceptance Criteria:**
- [ ] Every transaction logs user, timestamp, action, before/after values
- [ ] Audit logs are immutable (cannot be edited/deleted)
- [ ] I can search audit log by user, date, action type, item
- [ ] I can export audit log to CSV
- [ ] System retains logs for 7 years minimum
- [ ] Critical actions (deletions, approvals) trigger immediate log entry

**Priority:** P0 (Phase 1)  
**Effort:** 8 points  
**Dependencies:** All modules logging correctly

---

#### Story 8.3: Approval Workflow Enforcement
**As a** Business Owner  
**I want to** ensure critical transactions require multiple approvals  
**So that** fraud and errors are prevented

**Acceptance Criteria:**
- [ ] System prevents skipping approval steps
- [ ] System prevents users from approving own transactions
- [ ] System routes to correct approver based on value threshold
- [ ] System locks transaction after first approval (no editing)
- [ ] Rejected transactions require re-submission (not just re-approval)
- [ ] All approvals logged with timestamp and justification

**Priority:** P0 (Phase 1)  
**Effort:** 8 points  
**Dependencies:** Approval workflow engine

---

### Epic 9: Integrations

#### Story 9.1: Foodics POS Integration - Sales Sync
**As a** Business Owner  
**I want to** automatically sync sales from Foodics POS  
**So that** inventory is deducted and revenue is recorded

**Acceptance Criteria:**
- [ ] System connects to Foodics API with OAuth
- [ ] Sales transactions sync in real-time (or every 15 min)
- [ ] System deducts sold items from store inventory
- [ ] System records revenue (if finance module enabled)
- [ ] System handles failed syncs (retry 3 times, then alert)
- [ ] I can view sync status and history
- [ ] System reconciles daily (ERP vs. Foodics inventory)

**Priority:** P0 (Phase 1)  
**Effort:** 13 points  
**Dependencies:** Foodics API access, Inventory module

---

#### Story 9.2: Accounting Software Export
**As a** Finance Manager  
**I want to** export transactions to my accounting software  
**So that** I don't have to enter data twice

**Acceptance Criteria:**
- [ ] I can export purchase transactions to Excel/CSV
- [ ] I can export inventory valuation report
- [ ] I can export payment summary
- [ ] Export format matches QuickBooks IIF (if customer uses QB)
- [ ] I can schedule automatic exports (daily, weekly, monthly)
- [ ] Export includes all required fields for accounting

**Priority:** P1 (Phase 1)  
**Effort:** 5 points  
**Dependencies:** Finance module

---

## Technical Architecture

### System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                            │
├──────────────────┬──────────────────┬──────────────────────────┤
│  Mobile App      │  Web Backoffice  │  Management Dashboard    │
│  (iOS/Android)   │  (React)         │  (React)                 │
│                  │                  │                          │
│  - Warehouse     │  - Procurement   │  - Business Owner        │
│  - QC            │  - Production    │  - Finance Viewer        │
│  - Production    │  - Managers      │  - Executives            │
│  - Store Mgr     │                  │                          │
└──────────────────┴──────────────────┴──────────────────────────┘
                            ↓ HTTPS/REST API
┌─────────────────────────────────────────────────────────────────┐
│                        API GATEWAY LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│  - Authentication (JWT)                                          │
│  - Rate Limiting                                                 │
│  - Request Validation                                            │
│  - API Versioning                                                │
│  - Load Balancing                                                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
├──────────────┬──────────────┬──────────────┬───────────────────┤
│  Inventory   │ Procurement  │  Logistics   │  Production       │
│  Service     │ Service      │  Service     │  Service          │
├──────────────┼──────────────┼──────────────┼───────────────────┤
│  Finance     │ Reporting    │  Workflow    │  Notification     │
│  Service     │ Service      │  Engine      │  Service          │
├──────────────┴──────────────┴──────────────┴───────────────────┤
│                    BUSINESS LOGIC LAYER                          │
│  - Domain Models                                                 │
│  - Business Rules Engine                                         │
│  - Validation                                                    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                │
├──────────────────┬──────────────────┬────────────────────────────┤
│  PostgreSQL      │  Redis Cache     │  Object Storage (S3)      │
│  (Primary DB)    │  (Session, Cache)│  (Photos, Documents)      │
└──────────────────┴──────────────────┴────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    INTEGRATION LAYER                             │
├──────────────────┬──────────────────┬────────────────────────────┤
│  Foodics API     │  Accounting APIs │  Email/SMS                │
│  Integration     │  (Zoho, QB)      │  Service                  │
└──────────────────┴──────────────────┴────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  Cloud Provider: AWS / Azure / Google Cloud                     │
│  - Compute: EC2/App Service/Compute Engine                      │
│  - Database: RDS/Azure SQL/Cloud SQL                            │
│  - Storage: S3/Blob Storage/Cloud Storage                       │
│  - CDN: CloudFront/Azure CDN/Cloud CDN                          │
│  - Monitoring: CloudWatch/Monitor/Operations Suite              │
└─────────────────────────────────────────────────────────────────┘
```

### Architecture Principles

#### 1. Microservices-Oriented (Modular Monolith to Start)

**Phase 1 Approach: Modular Monolith**
- Single deployable application with clear module boundaries
- Modules communicate via well-defined interfaces
- Easier to develop, test, and deploy initially
- Lower operational complexity for small team

**Phase 2+ Evolution: Microservices**
- Extract high-load modules (Inventory, Reporting) into separate services
- Independent scaling and deployment
- Better fault isolation

**Module Boundaries:**

```
Inventory Module
├── Inbound Management
├── Outbound Management
├── Stock Visibility
└── Location Management

Procurement Module
├── Supplier Management
├── Purchase Orders
├── Receiving
└── Vendor Performance

Logistics Module
├── Transfer Management
├── In-Transit Tracking
└── Delivery Confirmation

Production Module (Phase 2)
├── BOM Management
├── Production Orders
├── Material Issue
└── Cost Calculation

Finance Module
├── Cost Tracking (Phase 1)
├── Payment Management (Phase 1)
├── AP/AR (Phase 2)
└── GL Integration (Phase 2)

Platform Services
├── Authentication & Authorization
├── Workflow Engine
├── Notification Service
├── Reporting Engine
├── Audit Logging
└── Integration Hub
```

---

#### 2. Multi-Tenancy Architecture

**Tenant Isolation Strategy: Shared Database, Separate Schemas**

```
Database: erp_system
├── Schema: tenant_company1
│   ├── inventory
│   ├── procurement
│   ├── users
│   └── ...
├── Schema: tenant_company2
│   ├── inventory
│   ├── procurement
│   ├── users
│   └── ...
└── Schema: platform
    ├── tenants
    ├── subscriptions
    └── system_config
```

**Why This Approach:**
- ✅ Better data isolation than shared schema
- ✅ Easier per-tenant backup and restore
- ✅ Simpler than separate database per tenant
- ✅ Good balance of isolation and cost

**Tenant Context Propagation:**
- JWT token includes `tenant_id`
- API Gateway validates and extracts `tenant_id`
- All database queries scoped to tenant schema
- Row-level security as backup (defense in depth)

---

#### 3. Event-Driven Architecture (for async workflows)

**Event Bus (using Redis Streams or RabbitMQ):**

```
Event Producer → Event Bus → Event Consumer(s)

Examples:
- PO Approved → [Notify Supplier, Update Dashboard, Log Audit]
- Goods Received → [Update Inventory, Trigger Payment, Notify Requester]
- Stock Below Minimum → [Generate Auto-PO, Alert Procurement]
- Production Completed → [Update Inventory, Calculate Costs, Notify QC]
```

**Benefits:**
- Decouples modules (Inventory doesn't need to know about Notifications)
- Enables async processing (doesn't block user)
- Supports future integrations (new consumers can subscribe to events)
- Built-in retry and dead-letter queues

---

#### 4. API-First Design

**RESTful API Standards:**

```
Base URL: https://api.erp-system.com/v1

Endpoints:
GET    /inventory/items                    # List items
GET    /inventory/items/{id}               # Get item details
POST   /inventory/items                    # Create item
PUT    /inventory/items/{id}               # Update item
DELETE /inventory/items/{id}               # Delete item

GET    /procurement/purchase-orders        # List POs
POST   /procurement/purchase-orders        # Create PO
PUT    /procurement/purchase-orders/{id}/approve  # Approve PO
GET    /procurement/suppliers              # List suppliers

POST   /inventory/inbound/receive          # Receive goods
POST   /inventory/outbound/issue           # Issue items
GET    /inventory/locations/{id}/stock     # Stock at location

POST   /logistics/transfers                # Create transfer
PUT    /logistics/transfers/{id}/fulfill   # Fulfill transfer
PUT    /logistics/transfers/{id}/receive   # Receive transfer

POST   /production/production-orders       # Create production order (Phase 2)
PUT    /production/production-orders/{id}/confirm  # Confirm production

GET    /reports/inventory-valuation        # Inventory value report
GET    /reports/supplier-performance       # Supplier report
```

**API Response Format:**

```json
{
  "success": true,
  "data": {
    "id": "po-123",
    "supplier": "ABC Suppliers",
    "total": 5000.00,
    "status": "approved"
  },
  "metadata": {
    "timestamp": "2026-02-15T14:30:00Z",
    "version": "1.0"
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Cannot issue 100 units. Only 75 available.",
    "details": {
      "requested": 100,
      "available": 75,
      "item_id": "item-456"
    }
  },
  "metadata": {
    "timestamp": "2026-02-15T14:30:00Z",
    "request_id": "req-789"
  }
}
```

---

#### 5. Security Architecture

**Authentication Flow (JWT):**

```
1. User Login (username/password)
   ↓
2. API validates credentials
   ↓
3. Generate JWT token (includes: user_id, tenant_id, role, exp)
   ↓
4. Return JWT to client
   ↓
5. Client includes JWT in Authorization header for all requests
   ↓
6. API Gateway validates JWT
   ↓
7. Extract user context (tenant_id, role)
   ↓
8. Route to appropriate service with context
```

**JWT Payload Example:**

```json
{
  "user_id": "user-123",
  "tenant_id": "tenant-company1",
  "role": "warehouse_user",
  "permissions": ["inventory:read", "inventory:issue", "qr:scan"],
  "exp": 1708099200,
  "iat": 1708012800
}
```

**Authorization (Role-Based Access Control):**

```
Database: permissions
├── roles (role_id, role_name, tenant_id)
├── permissions (permission_id, resource, action)
├── role_permissions (role_id, permission_id)
└── user_roles (user_id, role_id)

Middleware checks:
1. Does user have required role?
2. Does role have required permission?
3. Is action within tenant scope?
```

**Data Encryption:**
- **In Transit:** TLS 1.3 for all API calls
- **At Rest:** Database encryption (AES-256)
- **Sensitive Fields:** Hashed passwords (bcrypt), encrypted tax IDs

**API Security:**
- Rate limiting (100 requests/min per user)
- CORS policy (whitelist allowed origins)
- Input validation (prevent SQL injection, XSS)
- CSRF protection for web sessions

---

#### 6. Data Architecture

**Database Schema Design (PostgreSQL)**

**Core Tables:**

```sql
-- Tenants
CREATE TABLE tenants (
    tenant_id UUID PRIMARY KEY,
    company_name VARCHAR(255),
    status VARCHAR(50), -- active, suspended, cancelled
    created_at TIMESTAMP,
    subscription_plan VARCHAR(50)
);

-- Users (within tenant schema)
CREATE TABLE users (
    user_id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role_id UUID REFERENCES roles(role_id),
    status VARCHAR(50), -- active, inactive
    created_at TIMESTAMP,
    last_login TIMESTAMP
);

-- Items (within tenant schema)
CREATE TABLE items (
    item_id UUID PRIMARY KEY,
    item_code VARCHAR(50) UNIQUE,
    item_name VARCHAR(255),
    category_id UUID REFERENCES categories(category_id),
    unit_of_measure VARCHAR(20), -- kg, liter, piece, etc.
    minimum_stock DECIMAL(10,2),
    maximum_stock DECIMAL(10,2),
    average_cost DECIMAL(10,2),
    status VARCHAR(50), -- active, discontinued
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Inventory (within tenant schema)
CREATE TABLE inventory (
    inventory_id UUID PRIMARY KEY,
    item_id UUID REFERENCES items(item_id),
    location_id UUID REFERENCES locations(location_id),
    quantity DECIMAL(10,2),
    batch_number VARCHAR(100),
    expiry_date DATE,
    cost_per_unit DECIMAL(10,2),
    last_updated TIMESTAMP
);

-- Locations (within tenant schema)
CREATE TABLE locations (
    location_id UUID PRIMARY KEY,
    location_code VARCHAR(50) UNIQUE,
    location_name VARCHAR(255),
    location_type VARCHAR(50), -- warehouse, store, production
    parent_location_id UUID REFERENCES locations(location_id),
    qr_code VARCHAR(255) UNIQUE,
    status VARCHAR(50), -- active, inactive
    created_at TIMESTAMP
);

-- Purchase Orders (within tenant schema)
CREATE TABLE purchase_orders (
    po_id UUID PRIMARY KEY,
    po_number VARCHAR(50) UNIQUE,
    supplier_id UUID REFERENCES suppliers(supplier_id),
    po_date DATE,
    expected_delivery_date DATE,
    total_amount DECIMAL(10,2),
    status VARCHAR(50), -- draft, pending, approved, sent, received, closed
    created_by UUID REFERENCES users(user_id),
    approved_by UUID REFERENCES users(user_id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- PO Line Items
CREATE TABLE po_line_items (
    po_line_id UUID PRIMARY KEY,
    po_id UUID REFERENCES purchase_orders(po_id),
    item_id UUID REFERENCES items(item_id),
    quantity_ordered DECIMAL(10,2),
    quantity_received DECIMAL(10,2),
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    created_at TIMESTAMP
);

-- Inventory Transactions (audit trail)
CREATE TABLE inventory_transactions (
    transaction_id UUID PRIMARY KEY,
    transaction_type VARCHAR(50), -- inbound, outbound, transfer, adjustment, production
    item_id UUID REFERENCES items(item_id),
    from_location_id UUID REFERENCES locations(location_id),
    to_location_id UUID REFERENCES locations(location_id),
    quantity DECIMAL(10,2),
    unit_cost DECIMAL(10,2),
    reference_id UUID, -- PO ID, Transfer ID, Production Order ID
    reference_type VARCHAR(50),
    performed_by UUID REFERENCES users(user_id),
    performed_at TIMESTAMP,
    notes TEXT
);

-- Audit Logs
CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(user_id),
    action VARCHAR(100), -- created, updated, deleted, approved, rejected
    resource_type VARCHAR(100), -- purchase_order, inventory, transfer
    resource_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(50),
    device_info TEXT,
    timestamp TIMESTAMP
);
```

**Indexes for Performance:**

```sql
-- Inventory lookups
CREATE INDEX idx_inventory_item_location ON inventory(item_id, location_id);
CREATE INDEX idx_inventory_location ON inventory(location_id);

-- Transaction history
CREATE INDEX idx_transactions_item ON inventory_transactions(item_id);
CREATE INDEX idx_transactions_date ON inventory_transactions(performed_at);
CREATE INDEX idx_transactions_reference ON inventory_transactions(reference_type, reference_id);

-- Purchase orders
CREATE INDEX idx_po_status ON purchase_orders(status);
CREATE INDEX idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_po_date ON purchase_orders(po_date);

-- Audit trail
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
```

---

#### 7. Caching Strategy

**Multi-Layer Caching:**

```
Request → Application Cache (In-Memory) → Redis Cache → Database

Layer 1: Application Cache (in-process)
- User sessions (5 min TTL)
- Role permissions (10 min TTL)
- Configuration (15 min TTL)

Layer 2: Redis Cache (centralized)
- Inventory quantities (1 min TTL, invalidate on update)
- Item master data (10 min TTL)
- Supplier data (10 min TTL)
- Report results (5 min TTL)

Layer 3: Database
- Source of truth
```

**Cache Invalidation:**
- **Write-through:** Update DB and cache simultaneously
- **Event-based:** Inventory update event → invalidate cache
- **TTL-based:** Auto-expire after configured time

---

#### 8. Scalability & Performance

**Horizontal Scaling:**

```
Load Balancer
    ↓
App Server 1  App Server 2  App Server 3
    ↓              ↓              ↓
       Database (Read Replicas)
Primary (Write) → Replica 1 (Read) → Replica 2 (Read)
```

**Database Optimization:**
- Read-heavy queries → Read replicas
- Write-heavy operations → Connection pooling, batch inserts
- Large reports → Materialized views, pre-aggregation

**CDN for Static Assets:**
- Frontend JavaScript/CSS bundles
- Images, icons, fonts
- QR code images (if generated server-side)

**Performance Targets:**
- API response time: < 200ms (p95)
- Database query time: < 50ms (p95)
- Page load time: < 2 seconds
- Mobile app startup: < 2 seconds

---

#### 9. Monitoring & Observability

**Metrics to Track:**

**System Health:**
- CPU, memory, disk usage
- API response times (p50, p95, p99)
- Error rates (4xx, 5xx)
- Database connection pool usage
- Cache hit rate

**Business Metrics:**
- Transactions per minute (inbound, outbound, transfers)
- Active users (concurrent, daily, monthly)
- Inventory accuracy rate
- Average approval time
- Failed integrations (Foodics sync errors)

**Logging Strategy:**

```
Application Logs → Centralized Logging (e.g., ELK Stack)
├── Error Logs (errors, exceptions)
├── Access Logs (API requests)
├── Audit Logs (user actions)
└── Integration Logs (external API calls)
```

**Alerting Rules:**
- API error rate > 5% for 5 minutes → Alert DevOps
- Database connections > 80% → Alert DBA
- Foodics sync failed 3 times → Alert Support
- Inventory discrepancy > 10% → Alert Management

**Tools:**
- **Monitoring:** Prometheus + Grafana (or CloudWatch, Datadog)
- **Logging:** ELK Stack (Elasticsearch, Logstash, Kibana)
- **APM:** New Relic, Datadog, or AppInsights
- **Uptime Monitoring:** Pingdom, UptimeRobot

---

#### 10. Disaster Recovery & Backup

**Backup Strategy:**

```
Database Backups:
- Full backup: Daily at 2 AM
- Incremental backup: Every 4 hours
- Retention: 30 days daily, 12 months monthly

Object Storage (S3):
- Versioning enabled
- Cross-region replication (future)
- Retention: 7 years

Application Code:
- Git repository (GitHub/GitLab)
- Automated deployments (CI/CD)
```

**Recovery Procedures:**

**RTO (Recovery Time Objective): 4 hours**
- Restore database from backup: 2 hours
- Redeploy application: 1 hour
- Validate and test: 1 hour

**RPO (Recovery Point Objective): 4 hours**
- Maximum acceptable data loss: 4 hours (last incremental backup)

**Disaster Recovery Plan:**
1. Identify failure (monitoring alerts)
2. Assess impact (which services affected)
3. Execute recovery (restore from backup or failover)
4. Validate (run health checks)
5. Communicate (notify users, update status page)
6. Post-mortem (root cause analysis)

---

## Technical Framework & Technology Stack

### Backend Stack

#### Primary Language: **Node.js (TypeScript)**

**Why Node.js + TypeScript:**
- ✅ Strong ecosystem for REST APIs (Express, NestJS)
- ✅ Excellent async/event-driven capabilities (perfect for our event bus)
- ✅ TypeScript adds type safety (reduces bugs, better DX)
- ✅ Large talent pool in MENA region
- ✅ Good performance for I/O-heavy operations (our use case)
- ✅ Easy to scale horizontally

**Backend Framework: NestJS**

**Why NestJS:**
- ✅ Built on Express, enterprise-ready
- ✅ TypeScript-first framework
- ✅ Modular architecture (matches our design)
- ✅ Built-in dependency injection
- ✅ Extensive documentation and community
- ✅ Supports microservices out of the box (future-proof)

**Folder Structure:**

```
src/
├── modules/
│   ├── inventory/
│   │   ├── controllers/
│   │   │   ├── inventory.controller.ts
│   │   │   ├── inbound.controller.ts
│   │   │   └── outbound.controller.ts
│   │   ├── services/
│   │   │   ├── inventory.service.ts
│   │   │   ├── inbound.service.ts
│   │   │   └── outbound.service.ts
│   │   ├── entities/
│   │   │   ├── inventory.entity.ts
│   │   │   ├── location.entity.ts
│   │   │   └── transaction.entity.ts
│   │   ├── dto/
│   │   │   ├── create-inventory.dto.ts
│   │   │   └── update-inventory.dto.ts
│   │   └── inventory.module.ts
│   ├── procurement/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── entities/
│   │   └── procurement.module.ts
│   ├── logistics/
│   ├── production/ (Phase 2)
│   ├── finance/
│   └── users/
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── middleware/
│   └── pipes/
├── config/
│   ├── database.config.ts
│   ├── cache.config.ts
│   └── app.config.ts
├── events/
│   ├── event-bus.service.ts
│   └── event-handlers/
├── integrations/
│   ├── foodics/
│   └── accounting/
└── main.ts
```

---

### Database: **PostgreSQL 15+**

**Why PostgreSQL:**
- ✅ Open-source, mature, reliable
- ✅ Excellent support for JSON (JSONB) for flexible data
- ✅ Strong ACID compliance (critical for financial data)
- ✅ Advanced indexing (GIN, BRIN, partial indexes)
- ✅ Full-text search capabilities
- ✅ Row-level security (multi-tenancy)
- ✅ Great performance for OLTP workloads

**ORM: TypeORM**

**Why TypeORM:**
- ✅ Native TypeScript support
- ✅ Works seamlessly with NestJS
- ✅ Supports migrations (database versioning)
- ✅ Query builder + raw SQL when needed
- ✅ Supports multiple databases (future flexibility)

**Example Entity:**

```typescript
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';

@Entity('inventory')
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  inventory_id: string;

  @Column('uuid')
  item_id: string;

  @Column('uuid')
  location_id: string;

  @Column('decimal', { precision: 10, scale: 2 })
  quantity: number;

  @Column({ nullable: true })
  batch_number: string;

  @Column('decimal', { precision: 10, scale: 2 })
  cost_per_unit: number;

  @CreateDateColumn()
  last_updated: Date;

  @ManyToOne(() => Item, item => item.inventory)
  item: Item;

  @ManyToOne(() => Location, location => location.inventory)
  location: Location;
}
```

---

### Caching: **Redis**

**Why Redis:**
- ✅ In-memory speed (microsecond latency)
- ✅ Supports complex data structures (strings, hashes, lists, sets)
- ✅ Pub/Sub for event bus
- ✅ Automatic expiration (TTL)
- ✅ Persistence options (AOF, RDS)

**Use Cases:**
- Session management (JWT refresh tokens)
- Cache inventory quantities (1 min TTL)
- Cache user permissions (10 min TTL)
- Event bus (Redis Streams)
- Rate limiting (sliding window)

**Redis Libraries:**
- `ioredis` (Node.js client)
- `@nestjs/cache-manager` (NestJS integration)

---

### Frontend Stack

#### Web Application: **React + TypeScript**

**Why React:**
- ✅ Component-based architecture (reusable UI)
- ✅ Large ecosystem (libraries for everything)
- ✅ Great developer experience (hot reload, DevTools)
- ✅ Strong community in MENA
- ✅ Works well with TypeScript

**UI Component Library: Ant Design (antd)**

**Why Ant Design:**
- ✅ Enterprise-grade components (tables, forms, modals)
- ✅ Built-in responsive design
- ✅ Comprehensive documentation
- ✅ TypeScript support
- ✅ RTL support (for Arabic - Phase 2)
- ✅ Customizable theming

**State Management: Redux Toolkit**

**Why Redux Toolkit:**
- ✅ Simplified Redux (less boilerplate)
- ✅ Built-in async handling (RTK Query)
- ✅ Immutable updates
- ✅ DevTools for debugging
- ✅ Industry standard for complex apps

**Alternative:** React Query (for server state only)

**Folder Structure:**

```
src/
├── components/
│   ├── common/
│   │   ├── Header/
│   │   ├── Sidebar/
│   │   ├── Table/
│   │   └── Modal/
│   ├── inventory/
│   │   ├── InventoryList/
│   │   ├── ReceiveGoodsModal/
│   │   └── IssueItemsModal/
│   └── procurement/
│       ├── POList/
│       ├── CreatePOForm/
│       └── SupplierCard/
├── pages/
│   ├── Dashboard/
│   ├── Inventory/
│   ├── Procurement/
│   ├── Logistics/
│   └── Reports/
├── store/
│   ├── slices/
│   │   ├── authSlice.ts
│   │   ├── inventorySlice.ts
│   │   └── procurementSlice.ts
│   └── store.ts
├── services/
│   ├── api.ts
│   ├── inventoryService.ts
│   └── procurementService.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useInventory.ts
│   └── usePermissions.ts
├── utils/
│   ├── formatters.ts
│   ├── validators.ts
│   └── constants.ts
└── App.tsx
```

**Key Libraries:**

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "antd": "^5.12.0",
    "@reduxjs/toolkit": "^2.0.0",
    "axios": "^1.6.0",
    "dayjs": "^1.11.10",
    "recharts": "^2.10.0",
    "react-qr-scanner": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "@types/react": "^18.2.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0"
  }
}
```

---

#### Mobile Application: **React Native (Expo)**

**Why React Native:**
- ✅ Cross-platform (iOS + Android from one codebase)
- ✅ Same language as web (TypeScript/JavaScript)
- ✅ Code sharing with web app (utilities, types, services)
- ✅ Large community, mature ecosystem
- ✅ Over-the-air updates (fix bugs without app store review)

**Why Expo:**
- ✅ Simplified React Native setup
- ✅ Built-in camera, notifications, barcode scanner
- ✅ OTA updates (push fixes instantly)
- ✅ Faster development (no Xcode/Android Studio needed initially)
- ✅ Easy deployment (Expo Application Services)

**Mobile Libraries:**

```json
{
  "dependencies": {
    "expo": "~50.0.0",
    "react-native": "0.73.0",
    "expo-camera": "~14.0.0",
    "expo-barcode-scanner": "~13.0.0",
    "expo-notifications": "~0.27.0",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/stack": "^6.3.0",
    "axios": "^1.6.0",
    "@reduxjs/toolkit": "^2.0.0",
    "react-native-paper": "^5.11.0",
    "async-storage": "^1.21.0"
  }
}
```

**Offline Support:**
- `@react-native-async-storage/async-storage` (local storage)
- `redux-persist` (persist Redux state locally)
- Custom sync service (queue actions when offline)

---

### API Gateway & Authentication

#### API Gateway: **NGINX or AWS API Gateway**

**Development/Small Scale:** NGINX
- ✅ Free, open-source
- ✅ High performance reverse proxy
- ✅ Load balancing
- ✅ SSL termination
- ✅ Rate limiting

**Production/Large Scale:** AWS API Gateway (or Azure API Management)
- ✅ Managed service (less operational overhead)
- ✅ Built-in rate limiting, caching
- ✅ Request/response transformation
- ✅ API versioning
- ✅ Detailed metrics and logging

---

#### Authentication: **JWT (JSON Web Tokens)**

**Library:** `@nestjs/jwt` + `passport-jwt`

**Authentication Flow:**

```typescript
// auth.service.ts
async login(email: string, password: string) {
  const user = await this.validateUser(email, password);
  
  const payload = {
    user_id: user.user_id,
    tenant_id: user.tenant_id,
    role: user.role,
    permissions: user.permissions
  };
  
  return {
    access_token: this.jwtService.sign(payload, { expiresIn: '15m' }),
    refresh_token: this.jwtService.sign(
      { user_id: user.user_id }, 
      { expiresIn: '7d' }
    )
  };
}
```

**JWT Validation Middleware:**

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}

// Apply to routes
@UseGuards(JwtAuthGuard)
@Get('inventory')
getInventory() {
  // Only authenticated users can access
}
```

---

### Event Bus: **Redis Streams or RabbitMQ**

**Phase 1:** Redis Streams (simpler, already using Redis)

**Why Redis Streams:**
- ✅ Part of Redis (no new infrastructure)
- ✅ Consumer groups (multiple workers)
- ✅ Message persistence
- ✅ Acknowledgment system
- ✅ Good for moderate load

**Example Event Publishing:**

```typescript
// event-bus.service.ts
async publish(event: string, data: any) {
  await this.redis.xadd(
    event,
    '*',
    'data', JSON.stringify(data),
    'timestamp', Date.now()
  );
}

// Usage
await this.eventBus.publish('goods.received', {
  po_id: 'po-123',
  items: [...],
  received_by: 'user-456'
});
```

**Example Event Consumption:**

```typescript
// Listen for events
const stream = this.redis.xreadgroup(
  'GROUP', 'inventory-updater', 'consumer-1',
  'STREAMS', 'goods.received', '>'
);

// Process events
stream.forEach(event => {
  const data = JSON.parse(event.data);
  this.inventoryService.updateStock(data);
  this.redis.xack('goods.received', 'inventory-updater', event.id);
});
```

**Phase 2+:** RabbitMQ (for higher scale)

---

### File Storage: **AWS S3 (or compatible)**

**Why S3:**
- ✅ Scalable, reliable object storage
- ✅ Pay per use (cost-effective)
- ✅ Built-in redundancy
- ✅ CDN integration (CloudFront)
- ✅ Versioning support

**Use Cases:**
- User-uploaded photos (damaged goods, inspections)
- Generated reports (PDF, Excel)
- QR code images (if pre-generated)
- Document attachments (quotes, invoices)

**S3 Library:** `@aws-sdk/client-s3`

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

async uploadFile(file: Buffer, key: string) {
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: file,
    ContentType: 'image/jpeg'
  });
  
  await this.s3Client.send(command);
  return `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`;
}
```

---

### Notifications

#### Email: **SendGrid or AWS SES**

**Why SendGrid:**
- ✅ Simple API
- ✅ Templates and personalization
- ✅ Delivery analytics
- ✅ Free tier (100 emails/day)

**Library:** `@sendgrid/mail`

```typescript
import sgMail from '@sendgrid/mail';

async sendEmail(to: string, subject: string, html: string) {
  const msg = {
    to,
    from: 'noreply@erp-system.com',
    subject,
    html
  };
  
  await sgMail.send(msg);
}
```

---

#### Push Notifications: **Firebase Cloud Messaging (FCM)**

**Why FCM:**
- ✅ Free
- ✅ Works on iOS and Android
- ✅ Reliable delivery
- ✅ Supports data payloads
- ✅ Easy Expo integration

**Library:** `expo-notifications` + Firebase Admin SDK

```typescript
import { Expo } from 'expo-server-sdk';

async sendPushNotification(pushToken: string, message: string) {
  const expo = new Expo();
  
  const notification = {
    to: pushToken,
    sound: 'default',
    title: 'Action Required',
    body: message,
    data: { type: 'approval_pending' }
  };
  
  await expo.sendPushNotificationsAsync([notification]);
}
```

---

#### SMS: **Twilio or local provider (Egypt: Vodafone, Orange)**

**Why Twilio:**
- ✅ Global coverage
- ✅ Programmable API
- ✅ Delivery tracking

**For Egypt:** Integrate with local SMS gateway for better rates

---

### DevOps & CI/CD

#### Version Control: **Git (GitHub or GitLab)**

**Branching Strategy: GitFlow**

```
main (production)
  ↓
develop (staging)
  ↓
feature/inventory-module
feature/procurement-module
hotfix/critical-bug
```

---

#### CI/CD Pipeline: **GitHub Actions or GitLab CI**

**Example GitHub Actions Workflow:**

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm test
      - run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run build
      - uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: erp-backend:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Production
        run: |
          # Deploy to AWS/Azure/GCP
          # Run database migrations
          # Restart services
```

---

#### Containerization: **Docker**

**Why Docker:**
- ✅ Consistent environments (dev = staging = prod)
- ✅ Easy scaling (Kubernetes-ready)
- ✅ Dependency isolation

**Dockerfile (Backend):**

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

**Docker Compose (Local Development):**

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://user:pass@db:5432/erp
      REDIS_URL: redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: erp
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

---

#### Hosting: **AWS (Primary Recommendation)**

**Infrastructure:**

```
AWS Services:
├── EC2 / ECS (Application Servers)
├── RDS PostgreSQL (Database)
├── ElastiCache Redis (Caching)
├── S3 (File Storage)
├── CloudFront (CDN)
├── Route 53 (DNS)
├── Application Load Balancer (ALB)
├── CloudWatch (Monitoring)
└── IAM (Access Management)
```

**Alternative:** Azure or Google Cloud (similar architecture)

**For Small Scale:** DigitalOcean, Linode (cheaper, simpler)

---

### Testing Strategy

#### Unit Tests: **Jest**

```typescript
// inventory.service.spec.ts
describe('InventoryService', () => {
  it('should update inventory after receiving goods', async () => {
    const service = new InventoryService();
    const result = await service.receiveGoods({
      item_id: 'item-123',
      quantity: 100,
      location_id: 'loc-456'
    });
    
    expect(result.quantity).toBe(100);
    expect(result.location_id).toBe('loc-456');
  });
});
```

**Coverage Target:** >80% for critical business logic

---

#### Integration Tests: **Supertest (API testing)**

```typescript
// inventory.e2e.spec.ts
describe('Inventory API', () => {
  it('GET /inventory should return list', async () => {
    const response = await request(app.getHttpServer())
      .get('/inventory/items')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    
    expect(response.body.data).toBeInstanceOf(Array);
  });
});
```

---

#### End-to-End Tests: **Playwright or Cypress**

```typescript
// procurement.e2e.ts
test('should create purchase order', async ({ page }) => {
  await page.goto('/procurement/purchase-orders');
  await page.click('button:has-text("Create PO")');
  await page.selectOption('#supplier', 'supplier-123');
  await page.fill('#item-1-quantity', '100');
  await page.click('button:has-text("Submit")');
  
  await expect(page.locator('.success-message')).toBeVisible();
});
```

---

### Development Tools

**Recommended IDE:** Visual Studio Code

**Extensions:**
- ESLint
- Prettier
- TypeScript
- Docker
- GitLens
- REST Client

**Code Quality:**
- ESLint (linting)
- Prettier (formatting)
- Husky (pre-commit hooks)
- Conventional Commits (commit message format)

**API Documentation:**
- Swagger/OpenAPI (auto-generated from NestJS)
- Postman collections (for manual testing)

---

## Technology Summary Table

| Layer | Technology | Why |
|-------|------------|-----|
| **Backend Framework** | NestJS (Node.js + TypeScript) | Enterprise-grade, modular, TypeScript-first |
| **Database** | PostgreSQL 15+ | ACID compliance, JSONB support, mature |
| **ORM** | TypeORM | Native TypeScript support, migrations |
| **Caching** | Redis | In-memory speed, pub/sub, session storage |
| **Frontend Web** | React + TypeScript + Ant Design | Component-based, large ecosystem, enterprise UI |
| **Frontend Mobile** | React Native (Expo) | Cross-platform, code sharing, OTA updates |
| **API Gateway** | NGINX / AWS API Gateway | Load balancing, rate limiting, SSL |
| **Authentication** | JWT (JSON Web Tokens) | Stateless, scalable, secure |
| **Event Bus** | Redis Streams (Phase 1), RabbitMQ (Phase 2+) | Async workflows, decoupling |
| **File Storage** | AWS S3 | Scalable, reliable, cost-effective |
| **Email** | SendGrid / AWS SES | Simple API, delivery tracking |
| **Push Notifications** | Firebase Cloud Messaging (FCM) | Free, reliable, cross-platform |
| **SMS** | Twilio / Local provider | Programmable, global/local coverage |
| **Monitoring** | Prometheus + Grafana / CloudWatch | Metrics, alerting, dashboards |
| **Logging** | ELK Stack / CloudWatch Logs | Centralized, searchable logs |
| **CI/CD** | GitHub Actions / GitLab CI | Automated testing and deployment |
| **Containerization** | Docker | Consistent environments, easy scaling |
| **Hosting** | AWS (EC2/ECS, RDS, ElastiCache, S3) | Reliable, scalable, comprehensive |

---

## Appendices

#### Purchase Order Workflow

```
Draft
  ↓
Pending Approval
  ↓
Approved ────────→ Sent to Supplier
  ↓                      ↓
Rejected           Pending Receipt
  ↓                      ↓
Closed             Partially Received
                         ↓
                   Fully Received
                         ↓
                      Closed
```

#### Outbound Workflow

```
Pending Fulfillment
  ↓
In Progress (Warehouse Preparing)
  ↓
Issued (In-Transit)
  ↓
Completed (Receipt Confirmed)
  ↓
Closed
```

#### Production Order Workflow (Phase 2)

```
Draft
  ↓
Pending Approval
  ↓
Approved
  ↓
Materials Issued
  ↓
In Progress (Production Executing)
  ↓
Completed (Output Confirmed)
  ↓
Costed
  ↓
Closed
```

---

### Appendix B: Hard Business Rules

**Inventory Rules**:
1. Inventory cannot go negative without explicit approval and justification
2. Shelf location QR scan is mandatory for receiving and issuing
3. Expired items cannot be issued (system blocks)
4. Items below minimum threshold trigger auto-reorder (configurable)

**Approval Rules**:
1. No user can approve their own transactions
2. Approval thresholds are enforced (cannot bypass)
3. Rejected approvals require written reason
4. Approvals cannot be delegated without system configuration

**Financial Rules**:
1. Costs must be recorded at time of receipt
2. Inventory valuation method: Weighted Average Cost (configurable to FIFO)
3. Accounting periods, once closed, cannot be reopened without admin override
4. Manual adjustments > $X require Business Owner approval

**Segregation of Duties**:
1. Inbound: 3 different users (Procurement, QC, Warehouse)
2. Outbound: 2 different users (Requester, Warehouse)
3. Production: 3 different users (Order creator, Material issuer, Production confirmer)
4. Approvals: Approver ≠ Creator

---

### Appendix C: Exception Handling

**Receiving Exceptions**:

| Exception | System Response | Required Action |
|-----------|----------------|-----------------|
| Received qty > Ordered qty | Flag for approval | Procurement Manager approves or rejects over-receipt |
| Received qty < Ordered qty | Mark as partial receipt | Procurement decides: wait for rest or close PO |
| Quality rejection | Block receipt, return to procurement | Procurement contacts supplier, arrange return |
| Wrong item received | Block receipt | Procurement investigates, creates new PO if needed |

**Issuing Exceptions**:

| Exception | System Response | Required Action |
|-----------|----------------|-----------------|
| Requested qty > Available | Block request | Requester reduces qty or waits for stock |
| Issued qty ≠ Requested qty | Allow with justification | Warehouse explains difference, manager reviews |
| Receipt not confirmed within 24hrs | Auto-escalate | Manager follows up with requester |

**Production Exceptions**:

| Exception | System Response | Required Action |
|-----------|----------------|-----------------|
| Yield < 80% | Flag as critical variance | Production Manager investigates, documents cause |
| Waste > 15% | Require manager approval to close order | Manager reviews, approves, or investigates |
| Actual cost > Standard cost by >20% | Alert finance team | Finance reviews, updates standard costs if needed |

---

### Appendix D: System Boundaries

**In Scope**:
- Inventory management (warehouse, store, production)
- Procurement (suppliers, POs, receiving)
- Internal logistics (transfers between locations)
- Basic finance (cost tracking, payment status)
- Production management (Phase 2)
- Advanced finance (Phase 2)

**Out of Scope**:
- Customer-facing e-commerce
- Sales order management (may integrate with Foodics)
- Marketing and promotions
- HR and payroll
- Fixed assets management
- Project management
- External logistics (third-party carriers) - future integration

**Integration Points** (Data In/Out):
- Foodics POS (sales, inventory sync)
- Accounting software (financial data export/import)
- Future: E-commerce platforms, logistics APIs

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-15 | Digital Solutions | Initial comprehensive PRD |

---

## Approval & Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Product Owner** | [Name] | _________ | __/__/____ |
| **CTO** | [Name] | _________ | __/__/____ |
| **Business Stakeholder** | [Name] | _________ | __/__/____ |

---

**END OF DOCUMENT**
