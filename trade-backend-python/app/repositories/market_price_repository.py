from app.db import get_connection
from app.schemas.market_price import MarketPrice


def add(market_price: MarketPrice):
    """Insert a market price row.

    Args:
        market_price: Row to insert.

    Raises:
        sqlite3.IntegrityError: On a duplicate symbol or a failed CHECK (symbol
            length or case, negative price).
    """
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
    """Read market prices.

    Args:
        symbol: Exact, case-sensitive symbol, or None for every row.

    Returns:
        list[dict]: Rows as column-name mappings; empty when nothing matches.
    """
    with get_connection() as conn:
        if symbol is None:
            rows = conn.execute("SELECT * FROM market_price").fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM market_price WHERE symbol = ?", (symbol,)
            ).fetchall()
        return [dict(row) for row in rows]


def remove(symbol):
    """Delete the row for a symbol.

    Args:
        symbol: Exact, case-sensitive symbol.

    Returns:
        int: Number of rows deleted, 0 when the symbol does not exist.

    Raises:
        sqlite3.IntegrityError: If a trade references the symbol (foreign key is
            ``ON DELETE RESTRICT``).
    """
    with get_connection() as conn:
        cursor = conn.execute("DELETE FROM market_price WHERE symbol = ?", (symbol,))
        return cursor.rowcount
