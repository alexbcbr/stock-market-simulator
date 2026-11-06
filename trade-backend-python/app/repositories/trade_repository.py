import logging

from app.db import get_connection
from app.schemas.trade import Trade
from app.utils.logging import setup_logging

setup_logging()
logger = logging.getLogger(__name__)


def add(trade: Trade):
    """Insert a trade row.

    Args:
        trade: Trade to insert; ``trade_id`` is assigned by the database.

    Raises:
        sqlite3.IntegrityError: If the symbol has no market price (rejected by the
            ``prevent_trade_without_market_price`` trigger and the foreign key), or
            a CHECK fails (symbol length or case, negative price).
    """
    with get_connection() as conn:
        logger.info("Begin Insert record in Trade table")
        conn.execute(
            """
            INSERT INTO trade (symbol, customer_name, executed_price, open_price, closed_price, price_difference, status_trade)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                trade.symbol,
                trade.customer_name,
                trade.executed_price,
                trade.open_price,
                trade.closed_price,
                trade.price_difference,
                trade.status_trade,
            ),
        )
        logger.info("End Transaction record in Trade table")


def find_by_customer(customer_name: str):
    """Read the trades of one customer.

    Not used by any route today.

    Args:
        customer_name: Exact, case-sensitive name.

    Returns:
        list[dict]: Matching rows; empty when none. No guaranteed order.
    """
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM trade WHERE customer_name = ?", (customer_name,)
        ).fetchall()
        return [dict(row) for row in rows]


def get_all():
    """Read every trade.

    Returns:
        list[dict]: All rows; no guaranteed order.
    """
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM trade").fetchall()
        return [dict(row) for row in rows]
