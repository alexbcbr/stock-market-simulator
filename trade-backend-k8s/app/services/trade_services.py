import sqlite3

from app.repositories import trade_repository
from app.schemas.trade import Trade, TradeIn


def create_trade(trade_in: TradeIn):
    trade = Trade(
        price_difference=trade_in.closed_price - trade_in.open_price,
        **trade_in.model_dump(),
    )
    try:
        trade_repository.add(trade)
    except sqlite3.IntegrityError as exc:
        raise ValueError(str(exc)) from exc


def list_trades():
    return trade_repository.get_all()
