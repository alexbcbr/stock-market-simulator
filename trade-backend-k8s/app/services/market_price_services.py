import sqlite3

from app.repositories import market_price_repository
from app.schemas.market_price import MarketPrice


def getRevenue(open_price, close_price):
    return close_price - open_price;


def create_market_price(symbol, open_price, high_price, low_price, close_price):
    try:
        market_price_repository.add(
            MarketPrice(
                symbol=symbol,
                open_price=open_price,
                high_price=high_price,
                low_price=low_price,
                close_price=close_price,
            )
        )
    except sqlite3.IntegrityError as exc:
        raise ValueError(str(exc)) from exc


def list_market_prices(symbol=None):
    return market_price_repository.get_all(symbol)


def remove_market_price(symbol):
    deleted = market_price_repository.remove(symbol)
    if deleted == 0:
        raise LookupError(f"symbol '{symbol}' not found")