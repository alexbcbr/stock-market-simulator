
-- Customers (F-010). customer_name holds the same text as trade.customer_name,
-- but there is deliberately no FOREIGN KEY or trigger linking the two tables.
CREATE TABLE customers (
    customer_name               TEXT PRIMARY KEY,
    fullname                    TEXT,
    email                       TEXT,
    company                     TEXT,   -- optional, where the customer works
    date_of_birth               DATE,   -- optional, ISO YYYY-MM-DD
    state_residence             TEXT,   -- optional, 2-letter US state code (e.g. WA, CA)
    allowed_contact             BOOLEAN NOT NULL DEFAULT 0,
    crm_managed                 BOOLEAN NOT NULL DEFAULT 0,

    CHECK (length(customer_name) > 0),
    CHECK (date_of_birth IS NULL OR date(date_of_birth) = date_of_birth),
    CHECK (state_residence IS NULL OR (length(state_residence) = 2 AND state_residence = upper(state_residence))),
    CHECK (allowed_contact IN (0,1)),
    CHECK (crm_managed IN (0,1))
);
