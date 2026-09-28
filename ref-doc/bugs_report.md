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
| **BUG-10** | Payment & Integrity | Demo Payment Prompt Bypass on Payment Failure | ✅ **FIXED** | [Verification 8](#8-bug-10-production-payment-error-handling) |
| **BUG-11** | Data Integrity | Dummy Default Ingredients & Mock Seed Resurrections | ✅ **FIXED** | [Verification 9](#9-bug-11-purge-dummy-ingredient--seed-fallbacks) |
| **BUG-12** | UI & Categories | Category Placeholder Image Auto-Injection | ✅ **FIXED** | [Verification 10](#10-bug-12-optional-category-image-handling) |
| **GAP-13** | UX & Management | Reusable Common Delete Confirmation Modal & Toasts | ✅ **FIXED** | [Verification 11](#11-gap-13-common-delete-confirmation-modal--toast-feedback) |
| **GAP-14** | Admin Management | Portion Sizes & Multiplier Inline Chip Editing | ✅ **FIXED** | [Verification 12](#12-gap-14-portion-sizes--pricing-chips-inline-editing) |

---

## 🔎 Detailed Bug & Fix Breakdown

### **1. BUG-01: Stale Local Storage Merging Deleted Supabase Records**
- **Location**: `src/utils/apiService.js` (`getOrders`, `getTables`, `getWaiters`, `getDishes`)
- **Root Cause**: The data fetching functions previously retrieved remote records from Supabase, identified items in `localStorage` whose IDs were missing from Supabase (`localOnly`), and merged them back into the array. When an admin deleted a record directly in Supabase, the application assumed the missing item was an offline draft and revived it from `localStorage`.
- **Resolution**: Completely purged `localStorage` mock data tracking (`MOCK_*_KEY`) and fallback caching logic from `apiService.js`. The system now acts exclusively as an online application querying Supabase directly as the single source of truth, eliminating any chance of stale offline data surfacing.

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

### **9. BUG-10: Production Payment Error Handling (No Demo Bypasses)**
- **Location**: `src/pages/Cart.jsx`
- **Root Cause**: When online payment failed, a browser `window.confirm` modal popped up prompting the user to complete the transaction via demo test payment (`pay_demo_...`), creating a security bypass in production.
- **Resolution**: Removed the demo payment confirmation modal. Payment errors now cleanly update `checkoutError` state and display clear user feedback (`"Payment failed. Please try again."`).

---

### **10. BUG-11: Purged Dummy Default Ingredients & Mock Seed Resurrections**
- **Location**: `src/pages/admin/AdminDishes.jsx`, `src/pages/FoodDetails.jsx`, `src/utils/apiService.js`
- **Root Cause**: New dishes and customer dish views defaulted to hardcoded ingredient arrays (`['Cheese', 'Onion', 'Garlic', 'Spice']`). Additionally, database queries returning 0 items fell back to static mock seed objects (`foodDataMap`, `categoriesData`, `initialBanners`), resurrecting deleted data.
- **Resolution**: Initialized ingredient customization state to empty arrays (`[]`). Updated data fetchers in `apiService.js` to treat 0-item empty database tables as valid empty state rather than resurrecting demo seed items.

---

### **11. BUG-12: Optional Category Image Handling (No Auto-Assigned Food Photos)**
- **Location**: `src/pages/admin/AdminCategories.jsx`
- **Root Cause**: Creating or saving a food category without uploading an image defaulted `image_url` to `'/placeholderfood.png'`.
- **Resolution**: Updated category save and table cell rendering to keep image fields empty (`""`) when unprovided and render a clean category icon (`FolderKanban`) instead of auto-assigning sample food photos.

---

### **12. GAP-13: Reusable Common Delete Confirmation Modal & Toast Feedback**
- **Location**: `src/components/ConfirmDeleteModal.jsx`, `AdminDishes.jsx`, `AdminCategories.jsx`, `AdminTables.jsx`, `AdminBanners.jsx`
- **Requirement**: Replace native browser `window.confirm` popups with a uniform styled modal component and display success/failure toast notifications after deletion.
- **Resolution**: Created `ConfirmDeleteModal.jsx` matching the `#114536` theme with item title displays and active loading state indicators. Integrated `react-hot-toast` notifications across all admin management screens.

---

### **13. GAP-14: Portion Sizes & Multiplier Inline Chip Editing**
- **Location**: `src/pages/admin/AdminDishes.jsx`
- **Requirement**: Allow direct inline editing of already-added portion chips and price multipliers within the dish modal.
- **Resolution**: Added inline chip editing mode (`Edit2` button, label input, multiplier input, live price calculation preview, save/cancel buttons) and formatted chips to display clean size name + calculated price.

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

### **5. Bug-10 & Bug-11: Production Integrity & Clean Data State**
1. Create a new dish in Admin Dishes without adding ingredient customizations.
2. Open the dish details on customer menu.
3. **Expected Result**: No dummy `Cheese`, `Onion`, `Garlic`, `Spice` preferences appear.
4. Delete all categories or dishes in Supabase / Admin panel.
5. Refresh page.
6. **Expected Result**: Catalog displays cleanly empty list (0 items) without resurrecting sample demo items.

### **6. Gap-13: Reusable Delete Modal & Toast**
1. In Admin Dishes, Categories, Tables, or Banners, click the Delete icon.
2. **Expected Result**: The common `ConfirmDeleteModal` pops up cleanly with item title and cancel/delete buttons. Upon confirming deletion, a green success toast appears in top center.

---

*Report generated and verified against `ref-doc/requirment.md` requirements specification.*
