
-- Customers (F-010). customer_name holds the same text as trade.customer_name,
-- but there is deliberately no FOREIGN KEY or trigger linking the two tables.
CREATE TABLE customers (
    customer_name               TEXT PRIMARY KEY,
    fullname                    TEXT,
    email                       TEXT,
    allowed_contact             BOOLEAN NOT NULL DEFAULT 0,
    crm_managed                 BOOLEAN NOT NULL DEFAULT 0,

    CHECK (length(customer_name) > 0),
    CHECK (allowed_contact IN (0,1)),
    CHECK (crm_managed IN (0,1))
);
