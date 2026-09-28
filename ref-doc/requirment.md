Food Ordering System — Complete Functional Specification
1. Purpose
This document is the functional source of truth for a food-ordering platform supporting two restaurant operating modes:

Premium Hotel / Table-Service Mode

Every table has its own QR code.
The QR identifies the table.
Multiple customers can scan the same table QR independently.
Each customer has an isolated session and cart.
Confirmed orders are delivered to the Waiter application.
Self-Service Hotel Mode

The entire hotel has one common QR code.
The QR does not identify a table.
Each customer gets an independent session/cart.
Each confirmed order receives a unique order number.
Customers collect/receive food according to the self-service workflow.
The current system includes:

Customer ordering
Admin application
Waiter application
Authentication for Admin and Waiter
Menu/product management
QR-based ordering
Cart and customization
Payment
Order confirmation
Waiter notifications
The current system does not include:

Table booking/reservation
Kitchen Display System (KDS)
Automatic waiter-to-kitchen communication
Customer account registration/login
2. Critical Architecture Rule
The system must never treat a:

QR code
Table
Customer
Device
Customer session
Cart
Order
as the same entity.

They are separate concepts.

Premium Hotel
copy


Restaurant
   |
Table
   |
Table QR
   |
Customer Session
   |
Cart
   |
Order
   |
Payment
Self-Service
copy


Restaurant
   |
Common QR
   |
Customer Session
   |
Cart
   |
Order
   |
Payment
A QR code identifies an ordering context. It does not itself represent a customer or an order.

3. Operating Modes
The restaurant must have a service mode:

copy


TABLE_SERVICE
SELF_SERVICE
3.1 TABLE_SERVICE
Each active table has a unique QR code.
Scanning the QR identifies that table.
Multiple customers can scan the same QR.
Each customer gets an independent session/cart.
Orders remain separate between customers.
Every confirmed order contains the correct table.
Waiter receives the confirmed order with table information.
There is no table booking system.
There is no automatic kitchen system.
3.2 SELF_SERVICE
The restaurant has one common QR code.
The common QR identifies the restaurant ordering context only.
It does not identify a table.
Each customer gets an independent session/cart.
Every confirmed order gets a unique order number.
table_id must be NULL for self-service orders.
The system must never invent a table number.
4. User Roles
The system has three main user categories:

copy


CUSTOMER
ADMIN
WAITER
Customer
Customers use guest ordering and do not need an account.

Admin
Admin must authenticate before accessing the Admin application.

Waiter
Waiter must authenticate before accessing the Waiter application.

5. Authentication
Authentication is required for Admin and Waiter applications.

Customer ordering remains a guest flow.

copy


Admin
  → Login required

Waiter
  → Login required

Customer
  → Guest QR ordering
6. Admin Authentication
Admin must support:

Username/Email + Password
copy


Username / Email
Password

[ Login ]
Google Login / Sign Up
copy


[ Continue with Google ]
Google authentication must not automatically grant Admin privileges to any Google account.

Recommended flow:

copy


Google Account
      ↓
Google Authentication
      ↓
Check authorized Admin account
      ↓
Admin Dashboard
If the Google account is not authorized:

copy


Access denied.
You are not authorized to access the Admin panel.
7. Waiter Authentication
Waiter must support:

Username/Email + Password
copy


Username / Email
Password

[ Login ]
Google Login / Sign Up
copy


[ Continue with Google ]
A random Google account must not automatically become a Waiter.

Recommended flow:

copy


Google Account
      ↓
Google Authentication
      ↓
Check authorized Waiter account
      ↓
Waiter Dashboard
Recommended operational model:

copy


Admin
  ↓
Creates/invites Waiter
  ↓
Waiter account is authorized
  ↓
Waiter logs in with Password or Google
8. Authentication Security Rules
Never allow:

copy


Anyone
   ↓
Google Sign Up
   ↓
Admin Dashboard
or:

copy


Anyone
   ↓
Google Sign Up
   ↓
Waiter Dashboard
Google identity proves identity, but application authorization determines whether the person can access Admin or Waiter functionality.

The backend must enforce authorization.

Frontend values such as:

copy


role = "ADMIN"
must never be trusted.

9. Role-Based Access Control
Minimum roles:

copy


ADMIN
WAITER
Possible future roles:

copy


SUPER_ADMIN
MANAGER
KITCHEN_STAFF
These are not required in the current version.

Admin permissions
Admin can manage:

Restaurant settings
Service mode
Tables
Table QR codes
Common self-service QR
Menu categories
Products
Prices
Images
Ingredients/components
Product availability
Orders
Waiter accounts
Operational settings
Waiter permissions
Waiter can:

View waiter dashboard
Receive order notifications
View orders
View order details
View table information for table-service orders
View customer customizations
View special instructions
Perform permitted order-status actions
Waiter must not be able to:

Change service mode
Change product prices
Manage Admin accounts
Modify restaurant configuration
Access another restaurant
Perform Admin-only operations
unless explicitly authorized.

10. Restaurant-Level Data Isolation
Every authenticated Admin/Waiter must be associated with a restaurant.

Example:

copy


Admin A
Restaurant A
    ↓
Restaurant A data only

Waiter B
Restaurant B
    ↓
Restaurant B data only
Changing restaurant_id in a URL/API request must never grant access to another restaurant.

Backend must validate:

copy


authenticated_user
       ↓
restaurant
       ↓
requested resource
11. Authentication Session
After successful authentication, create a secure authenticated session/token.

Backend must determine:

User identity
Role
Restaurant
Account status
Permissions
Do not rely on frontend-only authentication such as:

copy


localStorage.role = "admin"
12. Logout
Admin and Waiter applications must provide:

copy


Logout
After logout:

Protected screens must not remain usable.
Protected API requests must require authentication.
Expired/invalid sessions must be rejected.
User must return to login when authentication is required.
13. Disabled Users
Admin must be able to disable a Waiter account.

Example:

copy


Waiter
Status: DISABLED
A disabled Waiter must not be able to log in or use protected APIs.

Account status must be checked server-side.

14. Authentication Edge Cases
The following must work correctly:

Correct password → successful login.
Wrong password → login rejected.
Unauthorized Google account → access denied.
Authorized Google account → correct dashboard.
Disabled account → access denied.
Expired session → authentication required.
Logged-out user → protected resources unavailable.
Waiter attempting Admin API → rejected.
Frontend role manipulation → rejected.
Restaurant ID manipulation → rejected.
Multiple users logged in simultaneously → independent sessions.
Customer QR ordering → no Admin/Waiter login required.
For incorrect credentials use a generic message:

copy


Invalid username/email or password.
Do not reveal whether an account exists.

15. QR Code Architecture
15.1 Table-Service QR
Every table has a unique QR.

Example:

copy


TABLE-001
TABLE-002
TABLE-003
The server must validate:

Restaurant exists
Table exists
Table belongs to that restaurant
Table is active
QR is valid
QR has not been revoked
Never trust a table ID supplied by the frontend.

15.2 Self-Service QR
There is one common QR for the restaurant.

It identifies:

copy


Restaurant ordering context
not:

copy


Table
The backend must validate that the restaurant is active and configured for SELF_SERVICE.

16. Invalid QR Handling
If a QR is:

Invalid
Deleted
Disabled
Revoked
Expired
Belongs to another restaurant
Points to a deleted table
show a clear error.

Never silently assign another table or restaurant.

Example:

copy


This QR code is no longer available.
Please contact staff.
17. Customer Session
A customer session is the temporary ordering context.

Conceptually:

copy


session_id
restaurant_id
service_mode
table_id (nullable)
created_at
last_activity_at
status
Possible states:

copy


ACTIVE
CHECKOUT
COMPLETED
EXPIRED
CANCELLED
A session is not the same thing as an order.

18. Customer Ordering — Premium Hotel
Complete flow:

copy


Customer arrives
      ↓
Sits at table
      ↓
Scans table QR
      ↓
Table identified
      ↓
Customer session created/restored
      ↓
Digital menu
      ↓
Product details
      ↓
Customization
      ↓
Add to cart
      ↓
Checkout
      ↓
Payment
      ↓
Payment verification
      ↓
Order confirmed
      ↓
Waiter notification
      ↓
Waiter manually tells kitchen
      ↓
Kitchen prepares
      ↓
Waiter serves customer
19. Multiple Customers at One Table
This is a mandatory requirement.

Example:

copy


TABLE 12
   |
   +-- Customer A
   |     Session A
   |     Cart A
   |     Order A
   |
   +-- Customer B
   |     Session B
   |     Cart B
   |     Order B
   |
   +-- Customer C
         Session C
         Cart C
         Order C
All customers can scan the same Table 12 QR.

Their carts must remain completely independent.

Example:

Customer A:

copy


Chicken Alfredo
Less cheese
Customer B:

copy


Grilled Fish
No onion
Customer C:

copy


Burger
Extra cheese
Customer A must never see or modify Customer B's cart.

The waiter may see all confirmed orders associated with Table 12, but each order must have its own order ID.

20. Same Customer Scans QR Multiple Times
Repeated QR scanning must not automatically create duplicate carts or orders.

Recommended behavior:

copy


Existing valid session
      ↓
Reuse session
If the previous session is expired/completed/unavailable:

copy


Create new session
Scanning the QR again must not duplicate cart items.

21. Different Customers on Same Device
Do not assume:

copy


same device = same customer
If different customers use the same phone:

Completed session must not expose previous customer's cart.
Previous customer's order data must not become the next customer's active cart.
A new session must be created when appropriate.
22. Different Devices at Same Table
This is expected.

copy


Phone A → Table 12 QR → Session A

Phone B → Table 12 QR → Session B
Both must work simultaneously.

The table is shared, but the sessions/carts are independent.

23. Self-Service Ordering
Self-service has only one QR for the entire hotel.

copy


                 HOTEL
                   |
             ONE COMMON QR
                   |
        +----------+----------+
        |          |          |
     Customer A Customer B Customer C
        |          |          |
     Session A  Session B  Session C
        |          |          |
      Order A    Order B    Order C
There is no table identification.

24. Self-Service Complete Flow
copy


Customer enters hotel
       ↓
Scans common QR
       ↓
Restaurant menu
       ↓
Select product
       ↓
Product details
       ↓
Customization
       ↓
Add to cart
       ↓
Checkout
       ↓
Payment
       ↓
Payment success
       ↓
Order confirmed
       ↓
Order number generated
       ↓
Customer collects/receives food
Example:

copy


ORDER CONFIRMED

Order #1045

Chicken Burger × 1
Less spicy

Total: ₹220

Please keep your order number.
25. Self-Service Multiple Customers
Multiple customers can scan the same common QR.

copy


Common QR
   |
   +-- Customer A → Session A → Order #1001
   |
   +-- Customer B → Session B → Order #1002
   |
   +-- Customer C → Session C → Order #1003
The common QR must not create one shared cart for everyone.

26. Table ID in Self-Service
Self-service orders must contain:

copy


table_id = NULL
If a customer attempts to send a table ID manually:

copy


table_id = "T012"
the backend must reject or ignore it according to the API contract.

The system must never show a fake table number.

27. Digital Menu
Customer can view:

Categories
Products
Food images
Product name
Description
Price
Availability
Example categories:

copy


Starters
Soups
Main Course
Rice
Noodles
Pizza
Pasta
Desserts
Beverages
28. Product Detail Page
Product details can contain:

Food image
Name
Price
Description
Ingredients/components
Recipe-related information
Customization options
Example:

copy


Chicken Alfredo

Ingredients:
- Pasta
- Chicken
- Parmesan
- Cream
- Garlic
- Herbs
- Black pepper
29. Product Customization
Customers can specify:

Less
More
Normal
Not wanted
Special instructions
Example:

copy


Cheese
Less

Onion
No onion

Spice
Less spicy

Garlic
Extra
Special instruction:

copy


No garlic
Customization must belong to the individual order item.

30. Quantity-Level Customization
If two identical products have different customizations, they must be represented separately.

Example:

copy


Burger × 1
No onion

Burger × 1
Extra cheese
Do not incorrectly combine them into:

copy


Burger × 2
with one customization.

31. Cart
Cart belongs to exactly one customer session.

Cart item should contain:

copy


product_id
product_name_snapshot
unit_price_snapshot
quantity
customizations
special_instruction
Customer can:

Increase quantity
Decrease quantity
Remove item
Modify customization
Add products
32. Empty Cart
Checkout must be blocked when:

copy


cart.items.length = 0
Customer should be returned to the menu.

33. Invalid Quantity
Backend must reject:

copy


quantity = 0
quantity < 0
and unreasonable quantities according to configured limits.

Frontend validation is not sufficient.

34. Product Availability
A product can become unavailable after it was added to a cart.

At checkout the backend must revalidate:

Product exists
Product belongs to restaurant
Product is active
Product is available
Quantity is valid
If unavailable:

copy


This item is currently unavailable.
Do not charge for unavailable products.

35. Price Validation
Frontend prices must never be trusted.

If the customer changes:

copy


₹500 → ₹5
in the browser/request, the backend must reject the manipulated price.

The backend must calculate the actual amount.

36. Price Snapshot
When an order is confirmed, store the price used for that order.

If Admin changes:

copy


Burger
₹200 → ₹220
existing confirmed orders must continue to show:

copy


₹200
if that was the price charged.

Historical orders must not change when menu prices change.

37. Checkout
Backend must calculate:

copy


Subtotal
Tax
Service charge
Discount
Grand total
according to configured business rules.

The frontend may display totals, but the backend is the authoritative source.

38. Payment States
Payment must support clear states:

copy


INITIATED
PENDING
SUCCESS
FAILED
CANCELLED
REFUNDED
Showing a payment screen does not mean payment succeeded.

Only verified payment success can create/activate a confirmed paid order.

39. Payment Success
Correct flow:

copy


Payment provider
       ↓
Verified success
       ↓
Order confirmed
       ↓
Customer confirmation
       ↓
Waiter notification if applicable
40. Payment Failure
If payment fails:

copy


Payment FAILED
Then:

No confirmed order notification to waiter
Customer can retry
Cart remains recoverable
No duplicate order
No duplicate waiter notification
41. Payment Timeout / Unknown Result
Critical case:

copy


Customer pays
      ↓
Payment succeeds
      ↓
Browser loses connection
      ↓
Customer does not receive result
Do not immediately create another order/payment.

Verify payment status with backend/payment provider.

Possible results:

copy


SUCCESS
PENDING
FAILED
If already successful, show the existing order.

42. Double Payment Prevention
Repeated clicking must not create multiple payments.

Use an idempotency mechanism such as:

copy


checkout_attempt_id
idempotency_key
Same checkout request repeated multiple times must produce the same payment/order result.

43. Order Creation
Confirmed order should contain:

copy


order_id
order_number
restaurant_id
service_mode
table_id (nullable)
session_id
items
customizations
subtotal
tax
discount
total
payment_id
payment_status
order_status
created_at
For TABLE_SERVICE:

copy


table_id = actual table
For SELF_SERVICE:

copy


table_id = NULL
44. Order Number
Every confirmed order must have a unique visible order number.

Example:

copy


Order #1045
Internal order ID should also be unique.

45. Customer Order Confirmation — Table Service
Example:

copy


ORDER CONFIRMED

Order #1045
Table 12

Chicken Alfredo × 1
Less cheese
No garlic

Grilled Fish × 1
No onion

Total: ₹1,155
46. Customer Order Confirmation — Self-Service
Example:

copy


ORDER CONFIRMED

Order #1046

Chicken Burger × 1
Less spicy

Total: ₹220

Please keep your order number.
No table number must be shown.

47. Customer Order Details
Customer can view their own order details.

Example:

copy


Order #1045

Table: 12
Status: Confirmed

Chicken Alfredo × 1
Less cheese
No garlic

Total: ₹450
For self-service:

copy


Order #1046

Status: Confirmed

Chicken Burger × 1
Less spicy

Total: ₹220
48. Order Privacy
A customer must not be able to access another customer's order by changing:

copy


order_id
session_id
table_id
URL parameters
API parameters
Backend must authorize every protected request.

49. Refresh and Browser Navigation
Refreshing pages must not:

Duplicate orders
Duplicate cart items
Duplicate payments
Duplicate waiter notifications
Browser Back/Forward must not duplicate payment or order creation.

If payment has already succeeded, returning to the payment page must show the existing result.

50. Multiple Browser Tabs
If the same customer opens multiple tabs:

Backend remains authoritative.
Cart changes must be safely revalidated.
Checkout must be idempotent.
Multiple tabs must not create duplicate paid orders.
51. Network Failure
Network can fail during:

Menu loading
Cart updates
Checkout
Payment
Order confirmation
Never assume:

copy


No response = operation failed
For payment/order operations, query backend state before retrying.

52. Server Failure During Order Creation
Possible case:

copy


Client sends order
      ↓
Server creates order
      ↓
Connection lost
      ↓
Client receives no response
When retrying, use the same idempotency key.

The server must return the existing order rather than creating another one.

53. Payment Webhook Idempotency
Payment providers may send the same webhook multiple times.

Example:

copy


SUCCESS
SUCCESS
SUCCESS
The backend must process it once.

Use payment transaction/event ID or equivalent unique identifier.

54. Payment and Order Consistency
Avoid:

copy


Customer charged
BUT
No order
and:

copy


Order marked paid
BUT
Payment failed
Payment confirmation and order creation must use a reliable state transition/reconciliation design.

55. Waiter Application
The Waiter application is available only to authenticated Waiters.

After login:

copy


Waiter Login
     ↓
Waiter Dashboard
     ↓
New Orders
56. Waiter Notification — Table Service
After successful payment/order confirmation:

copy


NEW ORDER

Order #1045
Table 12

Chicken Alfredo × 1
• Less cheese
• No garlic

Grilled Fish × 1
• No onion

Paid
The waiter must receive:

Order number
Table number
Items
Quantity
Customizations
Special instructions
Payment status
Order time
57. Waiter Notification — Self-Service
If waiter notification is used for self-service operational handling:

copy


NEW ORDER

Order #1046

Chicken Burger × 1
Less spicy

Paid
There must be no table number.

If the self-service operational workflow does not use the Waiter application, the order can instead be handled by the configured self-service workflow. The order data model must still remain independent of tables.

58. Notification Reliability
Notifications are alerts, not the permanent order record.

Database/server remains the source of truth.

If the Waiter application disconnects:

copy


disconnect
   ↓
reconnect
   ↓
retrieve current confirmed orders
The waiter must not miss an order simply because a real-time notification was unavailable.

59. Duplicate Notifications
The same order can be delivered multiple times due to network retry.

Example:

copy


Order #1045
Order #1045
Order #1045
The UI must deduplicate using the unique order_id.

Duplicate notification must never create a duplicate order.

60. Waiter Order Status
Possible workflow:

copy


CONFIRMED
    ↓
ACCEPTED
    ↓
PREPARING
    ↓
READY
    ↓
SERVED
The exact statuses should only be implemented if supported by the current UI/workflow.

Because there is no kitchen application, kitchen preparation is currently a manual process.

61. Manual Kitchen Workflow
Current system:

copy


Customer
   ↓
Payment
   ↓
Confirmed Order
   ↓
Waiter Application
   ↓
Waiter manually communicates order
   ↓
Kitchen Staff
   ↓
Food prepared
   ↓
Waiter
   ↓
Customer
There is no automatic:

copy


Waiter App → Kitchen Display
integration in the current version.

62. Self-Service Collection
Self-service should use:

copy


Customer
   ↓
Common QR
   ↓
Order
   ↓
Payment
   ↓
Order #1045
   ↓
Collection/serving workflow
The order number is the primary customer reference.

No table is required.

63. No Table Booking
The current application does not provide:

Table reservation
Table booking
Reservation calendar
Table allocation
Scanning a table QR means:

The customer is ordering in the context of that table.
It does not mean:

The customer has reserved the table.
64. Table Disabled/Closed
If a table is disabled:

copy


Customer scans old QR
Show:

copy


This table is currently unavailable.
Please contact staff.
Do not redirect to another random table.

65. QR Revocation
Old QR codes must be able to become invalid/revoked.

Example:

copy


Old QR
REVOKED

New QR
ACTIVE
Historical orders must retain their original table/order information.

66. Menu Changes
Admin may change:

Product name
Description
Image
Price
Ingredients
Availability
Confirmed orders must retain historical snapshots where required.

Never rewrite historical orders because a product was edited later.

67. Product Deletion
Prefer deactivation rather than hard deletion for products referenced by historical orders.

Example:

copy


active = false
Historical orders must remain readable.

68. Restaurant Mode Changes
Changing:

copy


TABLE_SERVICE
to:

copy


SELF_SERVICE
must not rewrite historical orders.

Existing orders retain their original:

copy


service_mode
table_id
New orders follow the new mode.

69. Concurrency
The system must support many customers ordering simultaneously.

Example:

copy


100 customers
      ↓
same restaurant
      ↓
multiple simultaneous orders
Backend must safely handle concurrent:

Cart updates
Product availability changes
Payments
Order creation
Notifications
Use appropriate database transactions and locking where required.

70. Core Entities
Recommended entities:

copy


Restaurant
RestaurantSettings
User
Role
Table
QRCode
MenuCategory
Product
ProductIngredient
ProductCustomization
CustomerSession
Cart
CartItem
Order
OrderItem
Payment
Waiter
OrderNotification
71. User Entity
Conceptually:

copy


User
 ├── id
 ├── name
 ├── email
 ├── username
 ├── role
 ├── restaurant_id
 ├── auth_provider
 ├── status
 ├── created_at
 └── updated_at
Possible auth providers:

copy


PASSWORD
GOOGLE
A user may have an approved linked authentication method according to the authentication implementation.

72. Core Relationships
copy


Restaurant
 ├── Users
 ├── Tables
 │     └── QR Codes
 │
 ├── Menu Categories
 │     └── Products
 │
 ├── Customer Sessions
 │     └── Cart
 │          └── Cart Items
 │
 ├── Orders
 │     └── Order Items
 │
 └── Payments
73. Order Relationship
copy


Order
 ├── restaurant_id
 ├── service_mode
 ├── table_id (nullable)
 ├── session_id
 ├── payment_id
 └── order_items[]
74. TABLE_SERVICE Data Example
JSON


{
  "serviceMode": "TABLE_SERVICE",
  "restaurantId": "R001",
  "tableId": "T012",
  "sessionId": "SABC123",
  "orderNumber": "1045",
  "paymentStatus": "SUCCESS",
  "orderStatus": "CONFIRMED"
}
75. SELF_SERVICE Data Example
JSON


{
  "serviceMode": "SELF_SERVICE",
  "restaurantId": "R001",
  "tableId": null,
  "sessionId": "SXYZ789",
  "orderNumber": "1046",
  "paymentStatus": "SUCCESS",
  "orderStatus": "CONFIRMED"
}
76. Security Rules
Backend must never trust frontend values for:

Restaurant ID
Table ID
User role
Product price
Payment status
Order ownership
Order status
Permissions
Account status
All must be validated server-side.

77. Security Against Direct URL/API Access
A user must not gain access by manually changing:

copy


/admin
/waiter
/order/123
/restaurant/R002
/table/T009
Every protected resource must be authorized on the backend.

78. End-to-End TABLE_SERVICE Test Cases
The implementation must test at least:

One customer scans one table QR and orders.
Two customers scan the same table QR simultaneously.
Three customers scan the same table QR.
Each customer has an independent cart.
One customer cannot see another customer's cart.
One customer cannot modify another customer's order.
Same customer scans QR multiple times.
Same QR is used from multiple phones.
Customer refreshes before checkout.
Customer refreshes after payment.
Customer double-clicks Pay.
Payment succeeds but browser connection fails.
Payment fails and customer retries.
Product becomes unavailable before payment.
Product price changes before checkout.
Customer attempts to manipulate price.
Customer attempts to access another order.
Invalid QR is scanned.
Revoked QR is scanned.
Disabled table is scanned.
Waiter disconnects/reconnects.
Duplicate waiter notification occurs.
Payment webhook is duplicated.
Order request is retried after network failure.
Multiple customers order simultaneously.
79. End-to-End SELF_SERVICE Test Cases
The implementation must test at least:

Customer scans common QR.
Customer creates an independent session.
Multiple customers scan the same common QR.
Each customer has a separate cart.
One customer's cart cannot affect another.
One customer completes payment while another is still browsing.
Customer refreshes after payment.
Customer double-clicks Pay.
Payment succeeds but confirmation response is lost.
Payment fails and is retried.
Product becomes unavailable before payment.
Customer attempts to inject a table ID.
Self-service order remains table_id = NULL.
Common QR is disabled.
Customer accesses another order.
Duplicate payment webhook.
Duplicate order request.
Multiple simultaneous orders.
No fake table number appears anywhere.
Order number remains unique.
80. Authentication Test Cases
Admin
Valid username/password → Admin Dashboard.
Wrong password → rejected.
Valid Google account → authorized Admin Dashboard.
Unauthorized Google account → access denied.
Logout → protected pages unavailable.
Expired session → login required.
Admin attempts another restaurant's data → rejected.
Waiter
Valid username/password → Waiter Dashboard.
Valid Google account → authorized Waiter Dashboard.
Unauthorized Google account → access denied.
Disabled Waiter → rejected.
Waiter opens Admin API → rejected.
Waiter changes restaurant ID → rejected.
Frontend changes role from WAITER to ADMIN → rejected.
Logout → protected pages unavailable.
Expired session → login required.
Customer
Customer scans QR → can order without login.
Customer must not gain Admin/Waiter access through customer session.
81. Acceptance Criteria
The application is functionally complete only when:

TABLE_SERVICE works.
SELF_SERVICE works.
Table-service uses one QR per table.
Self-service uses one common QR.
Multiple customers can use the same table QR.
Multiple customers can use the same common QR.
Same-table customers have independent sessions.
Carts cannot cross between customers.
Orders cannot cross between customers.
Self-service orders never receive a fake table number.
Invalid QR codes are safely handled.
Disabled/revoked QR codes are safely handled.
Product availability is revalidated at checkout.
Prices are calculated server-side.
Historical prices remain correct.
Payment success is verified.
Failed payments do not create confirmed orders.
Payment retries are idempotent.
Duplicate webhooks are idempotent.
Duplicate order requests are idempotent.
Browser refresh cannot duplicate orders.
Network failure cannot create duplicate orders.
Waiter receives only valid confirmed orders.
Duplicate notifications do not create duplicate orders.
Waiter can reconnect and retrieve missed orders.
Admin requires authentication.
Waiter requires authentication.
Username/password authentication works.
Google Login works.
Google Sign-Up follows authorization rules.
Unauthorized Google accounts cannot access Admin/Waiter.
Disabled users cannot access protected systems.
Role-based authorization is server-side.
Restaurant-level isolation is enforced server-side.
Customer does not require an account.
No table booking exists in the current scope.
No kitchen display exists in the current scope.
Manual waiter-to-kitchen communication remains clear.
Historical orders remain correct after menu changes.
82. Final System Architecture
copy


                         FOOD ORDERING PLATFORM
                                  |
                +-----------------+-----------------+
                |                                   |
         CUSTOMER SIDE                       STAFF SIDE
                |                                   |
         Guest Ordering                    +---------+---------+
                |                          |                   |
         +------+-------+              ADMIN              WAITER
         |              |                |                   |
   TABLE SERVICE   SELF SERVICE        Login               Login
         |              |                |                   |
    QR per table    ONE QR              |             Order Dashboard
         |              |                |                   |
    Table ID       No Table ID      Admin Management    Order Notifications
         |              |                |                   |
    Customer       Customer             |             Order Details
    Session        Session              |                   |
         |              |                |                   |
       Cart           Cart              |             Manual Kitchen
         |              |                |                   |
      Payment        Payment            |                   |
         |              |                |                   |
    Confirmed      Confirmed             +---------+---------+
      Order          Order                        |
         |              |                          |
         +--------------+--------------------------+
                        |
                 Order Database
                        |
              Payment / Order State
83. Core Principles
The implementation must always follow these principles:

copy


1. ONE QR DOES NOT MEAN ONE CUSTOMER.

2. ONE TABLE DOES NOT MEAN ONE CUSTOMER.

3. ONE CUSTOMER SESSION DOES NOT MEAN ONE QR.

4. SELF-SERVICE HAS NO TABLE.

5. TABLE-SERVICE QR IDENTIFIES THE TABLE.

6. EVERY CUSTOMER SESSION HAS ITS OWN CART.

7. EVERY CONFIRMED ORDER HAS ITS OWN UNIQUE ID.

8. PAYMENT SUCCESS MUST NOT CREATE DUPLICATE ORDERS.

9. FRONTEND DATA MUST NEVER BE THE FINAL SOURCE OF TRUTH.

10. BACKEND/DATABASE IS THE SOURCE OF TRUTH.

11. ADMIN AND WAITER MUST BE AUTHENTICATED.

12. GOOGLE LOGIN DOES NOT AUTOMATICALLY GRANT STAFF ACCESS.

13. ROLE AND RESTAURANT AUTHORIZATION MUST BE ENFORCED SERVER-SIDE.

14. CUSTOMER ORDERING REMAINS A GUEST FLOW.

15. THERE IS NO TABLE BOOKING IN THE CURRENT SYSTEM.

16. THERE IS NO KITCHEN DISPLAY SYSTEM IN THE CURRENT SYSTEM.

17. WAITER-TO-KITCHEN COMMUNICATION IS CURRENTLY MANUAL.
84. Implementation Instruction
Use this document as the functional specification before implementing or modifying the application.

Do not simplify or remove the multiple-customer/session behavior.

Before implementing any feature that changes:

QR handling
Session handling
Cart
Checkout
Payment
Order creation
Authentication
Roles
Restaurant access
Waiter notifications
verify that the change does not break any of the edge cases and acceptance criteria in this document.

The implementation must prioritize:

Correct data isolation
Correct payment/order state
Idempotency
Server-side validation
Role-based authorization
Restaurant-level isolation
Reliable order retrieval
Clear behavior in both service modes
The goal is not merely to make the normal flow work. The application must behave correctly when multiple customers, devices, requests, payments, notifications, and authentication sessions happen simultaneously or fail unexpectedly.