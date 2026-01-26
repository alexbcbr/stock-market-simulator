
CREATE TABLE trade (
    trade_id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol                      TEXT NOT NULL,
    customer_name               TEXT NOT NULL,
    executed_price              REAL NOT NULL,
    open_price                  REAL NOT NULL,
    closed_price                REAL NOT NULL,
    price_difference            REAL NOT NULL,
    status_trade                BOOLEAN NOT NULL DEFAULT 0,

    CHECK (length(symbol) = 4),
    CHECK (symbol = upper(symbol)),
    CHECK (executed_price >= 0),
    CHECK (open_price >= 0),
    CHECK (closed_price >= 0),
    CHECK (status_transaction IN (0,1)),

    FOREIGN KEY (symbol)
        REFERENCES market_price(symbol)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE INDEX idx_trade_customer_name
ON trade (customer_name);

CREATE TRIGGER prevent_trade_without_market_price
BEFORE INSERT ON trade
FOR EACH ROW
BEGIN
    SELECT
        CASE
            WHEN NOT EXISTS (
                SELECT 1 FROM market_price WHERE symbol = NEW.symbol
            )
            THEN RAISE(ABORT, 'Market price not available for symbol')
        END;
END;
