-- ==============================================================================
-- 003: Insert Admin and Waiter Credentials
-- ==============================================================================

-- Insert Demo Admin
INSERT INTO admins (id, name, email, username, password, role, restaurant_id, status, google_email)
VALUES 
('adm-1', 'Admin Manager', 'admin@innbite.com', 'admin', 'adminpassword', 'ADMIN', 'R001', 'ACTIVE', 'admin@gmail.com');

-- Insert Demo Waiters
INSERT INTO waiters (id, name, email, username, password, role, restaurant_id, status, google_email)
VALUES 
('wtr-1', 'John Waiter', 'waiter@innbite.com', 'waiter1', 'password123', 'WAITER', 'R001', 'ACTIVE', 'waiter@gmail.com'),
('wtr-2', 'Sarah Staff', 'sarah@innbite.com', 'sarah', 'password123', 'WAITER', 'R001', 'ACTIVE', 'sarah.waiter@gmail.com');
