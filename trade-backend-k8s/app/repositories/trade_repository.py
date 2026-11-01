from app.db import get_connection
from app.schemas.trade import Trade
from app.utils.logging import setup_logging
import logging

setup_logging()
logger = logging.getLogger(__name__)

def add(trade: Trade):
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
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM trade WHERE customer_name = ?", (customer_name,)).fetchall()
        return [dict(row) for row in rows]

def get_all():
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM trade").fetchall()
        return [dict(row) for row in rows]