CREATE TABLE market_price (
    symbol          TEXT NOT NULL,
    open_price      REAL NOT NULL,
    high_price      REAL NOT NULL,
    low_price       REAL NOT NULL,
    close_price     REAL NOT NULL,

    PRIMARY KEY (symbol),

    CHECK (length(symbol) = 4),
    CHECK (symbol = upper(symbol)),
    CHECK (open_price >= 0),
    CHECK (high_price >= 0),
    CHECK (low_price >= 0),
    CHECK (close_price >= 0)
);

CREATE INDEX idx_market_price_symbol
ON market_price (symbol);
