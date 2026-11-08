INSERT INTO market_price (symbol, open_price, high_price, low_price, close_price) VALUES
('AAPL', 180.00, 185.50, 178.20, 183.10),
('GART', 90.00, 94.75, 88.40, 92.30),
('MSFT', 410.00, 415.80, 406.50, 412.25);

INSERT INTO trade (symbol, customer_name, executed_price, open_price, closed_price, price_difference, status_trade) VALUES
('AAPL', 'Alice', 182.00, 180.00, 183.10, 3.10, 1),
('AAPL', 'Bob', 184.50, 180.00, 183.10, 3.10, 1),
('AAPL', 'Carla', 179.00, 180.00, 183.10, 3.10, 0),
('GART', 'Alice', 91.00, 90.00, 92.30, 2.30, 1),
('GART', 'David', 93.50, 90.00, 92.30, 2.30, 1),
('GART', 'Carla', 89.00, 90.00, 92.30, 2.30, 0),
('MSFT', 'Bob', 411.00, 410.00, 412.25, 2.25, 1),
('MSFT', 'David', 414.00, 410.00, 412.25, 2.25, 1),
('MSFT', 'Alice', 409.50, 410.00, 412.25, 2.25, 0),
('MSFT', 'Carla', 1300.00, 410.00, 412.25, 887.75, 1);

-- One customer per distinct customer_name in trade above (no foreign key links them).
-- crm_managed is 0 for everyone: nothing has been synced to the CRM yet.
INSERT INTO customers (customer_name, fullname, email, allowed_contact, crm_managed) VALUES
('Alice', 'Alice Johnson', 'alice.johnson@example.com', 1, 0),
('Bob', 'Bob Smith', 'bob.smith@example.com', 0, 0),
('Carla', 'Carla Diaz', 'carla.diaz@example.com', 1, 0),
('David', NULL, NULL, 0, 0);
