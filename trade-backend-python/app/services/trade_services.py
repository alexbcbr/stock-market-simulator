import sqlite3

from app.repositories import trade_repository
from app.schemas.trade import Trade, TradeIn


def create_trade(trade_in: TradeIn):
    """Derive the profit figure and store a trade.

    ``price_difference`` is ``closed_price - open_price``. It ignores
    ``executed_price``, so it measures the day's move, not the player's gain. No
    pricing rule is applied and ``status_trade`` is stored as submitted.

    Args:
        trade_in: Trade as submitted by the client.

    Raises:
        ValueError: If the database rejects the trade (unknown symbol, malformed
            symbol, negative price). The message is the SQLite error text.
    """
    trade = Trade(
        price_difference=trade_in.closed_price - trade_in.open_price,
        **trade_in.model_dump(),
    )
    try:
        trade_repository.add(trade)
    except sqlite3.IntegrityError as exc:
        raise ValueError(str(exc)) from exc


def list_trades():
    """List every stored trade.

    Returns:
        list[dict]: All rows, with no filter and no guaranteed order.
    """
    return trade_repository.get_all()
