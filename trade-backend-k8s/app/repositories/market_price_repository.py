from app.db import get_connection
from app.schemas.market_price import MarketPrice


def add(market_price: MarketPrice):
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO market_price (symbol, open_price, high_price, low_price, close_price)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                market_price.symbol,
                market_price.open_price,
                market_price.high_price,
                market_price.low_price,
                market_price.close_price,
            ),
        )


def get_all(symbol=None):
    with get_connection() as conn:
        if symbol is None:
            rows = conn.execute("SELECT * FROM market_price").fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM market_price WHERE symbol = ?", (symbol,)
            ).fetchall()
        return [dict(row) for row in rows]


def remove(symbol):
    with get_connection() as conn:
        cursor = conn.execute(
            "DELETE FROM market_price WHERE symbol = ?", (symbol,)
        )
        return cursor.rowcount
