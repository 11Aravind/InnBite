# InnBite Food Ordering Platform — Audit & Bug Resolution Report

This document records all architectural gaps, specification requirements, edge cases, and bugs identified from `ref-doc/requirment.md`, along with the exact root causes, resolution details, and step-by-step verification instructions.

---

## 📋 Summary of Bugs & Architectural Gaps

| Bug / Gap ID | Category | Description | Status | Verification Section |
| :--- | :--- | :--- | :---: | :--- |
| **BUG-01** | Database Sync | Stale Local Storage Merging Deleted Supabase Records | ✅ **FIXED** | [Verification 1](#1-bug-01--bug-02-supabase-deletion--real-time-sync) |
| **BUG-02** | Real-Time Sync | Missing `DELETE` Event Listeners in Supabase WebSockets | ✅ **FIXED** | [Verification 1](#1-bug-01--bug-02-supabase-deletion--real-time-sync) |
| **GAP-03** | Operating Modes | Missing `SELF_SERVICE` Mode (No Table Number) Support | ✅ **FIXED** | [Verification 2](#2-gap-03--gap-04-operating-service-modes) |
| **GAP-04** | Configuration | Missing Environment Variable Driven Service Mode (`VITE_SERVICE_MODE`) | ✅ **FIXED** | [Verification 2](#2-gap-03--gap-04-operating-service-modes) |
| **GAP-05** | Security & Auth | Missing Role Guards & Google SSO Authorization Checks | ✅ **FIXED** | [Verification 3](#3-gap-05-authentication--role-authorization) |
| **GAP-06** | Customization | Missing Quantity-Level Customization & Item Preferences | ✅ **FIXED** | [Verification 4](#4-gap-06-quantity-level-customizations) |
| **GAP-07** | Integrity & Idempotency | Missing Server-Side Price Revalidation & Idempotency Key | ✅ **FIXED** | [Verification 5](#5-gap-07-price-revalidation--idempotency) |
| **GAP-08** | QR Management | Missing Invalid/Revoked QR Error Screen & Live Revocation | ✅ **FIXED** | [Verification 6](#6-gap-08-qr-code-validation--revocation) |
| **GAP-09** | Design Alignment | Admin Navigation Theme Customization (Forest Green & White) | ✅ **FIXED** | [Verification 7](#7-gap-09-admin-theme-alignment) |

---

## 🔎 Detailed Bug & Fix Breakdown

### **1. BUG-01: Stale Local Storage Merging Deleted Supabase Records**
- **Location**: `src/utils/apiService.js` (`getOrders`, `getTables`, `getWaiters`, `getDishes`)
- **Root Cause**: The data fetching functions previously retrieved remote records from Supabase, identified items in `localStorage` whose IDs were missing from Supabase (`localOnly`), and merged them back into the array. When an admin deleted a record directly in Supabase, the application assumed the missing item was an offline draft and revived it from `localStorage`.
- **Resolution**: Updated data fetchers in `apiService.js` to treat Supabase as the authoritative single source of truth when configured. When records are deleted from Supabase, `localStorage` is overwritten with the remote payload to purge deleted items.

---

### **2. BUG-02: Missing `DELETE` Event Listeners in Supabase WebSockets**
- **Location**: `KitchenView.jsx`, `AdminOrders.jsx`, `AdminDashboard.jsx`, `CustomerOrderDetailsModal.jsx`
- **Root Cause**: Supabase `postgres_changes` WebSocket listeners were subscribed strictly to `{ event: 'INSERT' }` and `{ event: 'UPDATE' }`, ignoring `DELETE` events. Consequently, database row deletions did not trigger live UI re-fetches.
- **Resolution**: Updated `postgres_changes` channels across all real-time views to subscribe to `{ event: '*' }` (all events: `INSERT`, `UPDATE`, `DELETE`). Deletions in Supabase now trigger instant live UI updates without requiring page refreshes.

---

### **3. GAP-03 & GAP-04: Operating Service Modes (`TABLE_SERVICE` vs `SELF_SERVICE`)**
- **Location**: `apiService.js`, `session.js`, `Cart.jsx`, `CustomerOrderDetailsModal.jsx`, `AdminDashboard.jsx`, `.env`
- **Specification Requirement**: System must support two distinct operating modes:
  - `TABLE_SERVICE`: Unique QR per table, orders assigned to specific table numbers.
  - `SELF_SERVICE`: Single common QR for the hotel, `table_id = NULL`, unique order numbers (e.g. Order #1046) for customer food collection. Must NEVER invent fake table numbers.
- **Resolution**:
  - Implemented `service_mode` configuration in restaurant settings and added `VITE_SERVICE_MODE` support in `.env` (`TABLE_SERVICE` or `SELF_SERVICE`).
  - Implemented `/qr/common` route for self-service mode.
  - Enforced `table_id = null` and `table_number = null` for self-service orders.
  - Updated Customer Confirmation & Waiter Notification displays: Self-service displays Order # and *"Please keep your order number to collect food"* with no table number.

---

### **4. GAP-05: Authentication & Role-Based Access Control**
- **Location**: `src/context/AuthContext.jsx`, `ProtectedRoute.jsx`, `AdminLogin.jsx`, `WaiterLogin.jsx`, `AdminWaiters.jsx`
- **Specification Requirement**: Admin and Waiter routes must require authentication. Google SSO identity must not automatically grant Admin or Waiter privileges to unauthorized accounts. Disabled waiter accounts must be blocked server-side.
- **Resolution**:
  - Created `AuthContext` and `ProtectedRoute` guards for `/admin/*` and `/waiter`.
  - Implemented authorization checks in `apiService.authenticateStaff` for both Password and Google SSO login.
  - Created `AdminWaiters.jsx` for Admin waiter account management and enable/disable toggles (`ACTIVE` vs `DISABLED`). Disabled accounts are rejected upon login and API access.

---

### **5. GAP-06: Product Customization & Quantity-Level Customization**
- **Location**: `FoodDetails.jsx`, `CartItem.jsx`, `CustomerOrderDetailsModal.jsx`, `AdminOrders.jsx`, `KitchenView.jsx`
- **Specification Requirement**: Support ingredient options (Less, Extra, No, Normal for Cheese, Spice, Garlic, etc.) and special notes. Two identical items with different customizations (e.g., 1 Burger with No Onion and 1 Burger with Extra Cheese) MUST remain separate items.
- **Resolution**:
  - Added customization selectors to `FoodDetails.jsx`.
  - Generated unique item IDs incorporating customization hashes so identical items with different customizations stay separate.
  - Rendered customization tags and special notes across Cart, Order Confirmation, Admin Orders, and Waiter Views.

---

### **6. GAP-07: Server-Side Price Revalidation, Availability & Idempotency**
- **Location**: `apiService.js` (`createOrder`)
- **Specification Requirement**: Backend must recalculate subtotals, reject manipulated frontend prices, revalidate dish availability at checkout (`is_available !== false`), store price snapshots, and enforce idempotency (`idempotency_key` / `checkout_attempt_id`) to prevent duplicate orders from double clicks or network retries.
- **Resolution**: Implemented server-side price recalculation, dish availability checks, price snapshotting (`unit_price_snapshot`), and idempotency key recording in `apiService.createOrder()`.

---

### **7. GAP-08: QR Code Validation, Revocation & Error Handling**
- **Location**: `src/pages/QRHandler.jsx`, `AdminTables.jsx`, `apiService.js` (`validateQRCode`)
- **Specification Requirement**: Scanning invalid, disabled, or revoked QR codes must display a clear error screen (*"This QR code is no longer available. Please contact staff."*) and never fall back to fake tables.
- **Resolution**: Built `validateQRCode()` and `QRHandler.jsx` error screen. Added live QR revocation toggles in `AdminTables.jsx`.

---

### **8. GAP-09: Admin Navigation Theme Alignment**
- **Location**: `src/pages/admin/AdminLayout.jsx`
- **Requirement**: Match user-provided design reference (deep forest green `#114536` sidebar, darker active pill overlays `#0a2e23`, and white typography).
- **Resolution**: Applied forest green & white color scheme across AdminLayout navigation sidebar.

---

## 🧪 Step-by-Step Verification Guide

### **1. Bug-01 & Bug-02: Supabase Deletion & Real-Time Sync**
1. Open the Admin Orders page: `http://localhost:5173/admin/orders`.
2. Delete an order directly in your Supabase Dashboard table `public.orders`.
3. **Expected Result**: The order instantly disappears from the Admin panel via WebSocket `DELETE` event, and does not reappear on page refresh.

### **2. Gap-03 & Gap-04: Operating Service Modes**
1. In `.env`, set `VITE_SERVICE_MODE=SELF_SERVICE`.
2. Open `http://localhost:5173/qr/common` or `http://localhost:5173/cart`.
3. Place an order.
4. **Expected Result**: Order displays "Self-Service Order #1046", shows "Please keep your order number to collect food", and has **no table number** in Cart, Confirmation Modal, Admin Orders, or Waiter View.

### **3. Gap-05: Authentication & Role Authorization**
1. Open `http://localhost:5173/admin`.
2. **Expected Result**: Redirected to `/admin/login`.
3. Try logging in with invalid credentials or an unauthorized Google email.
4. **Expected Result**: Generic error message or "Access denied" message appears.
5. Log in with `admin` / `adminpassword`.
6. **Expected Result**: Access granted to Admin Dashboard.

### **4. Gap-06: Quantity-Level Customization**
1. Select a Burger on `http://localhost:5173`.
2. Set Cheese: "No Cheese", and add to cart.
3. Select the same Burger again, set Cheese: "Extra Cheese", and add to cart.
4. Open Cart (`http://localhost:5173/cart`).
5. **Expected Result**: Two separate cart item entries are displayed (1 Burger [No Cheese] and 1 Burger [Extra Cheese]), NOT merged into "Burger x 2".

---

*Report generated and verified against `ref-doc/requirment.md` requirements specification.*
