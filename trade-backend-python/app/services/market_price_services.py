import sqlite3

from app.repositories import market_price_repository
from app.schemas.market_price import MarketPrice


def getRevenue(open_price, close_price):
    """Compute the revenue between an open and a close price.

    The camelCase name is kept because the router and tests import it.

    Args:
        open_price: Opening price.
        close_price: Closing price.

    Returns:
        The difference ``close_price - open_price``; negative for a loss.
    """
    return close_price - open_price


def create_market_price(symbol, open_price, high_price, low_price, close_price):
    """Store a market price.

    Args:
        symbol: 4 uppercase letters, unique among stored prices.
        open_price: Opening price, not negative.
        high_price: Highest price, not negative.
        low_price: Lowest price, not negative.
        close_price: Closing price, not negative.

    Raises:
        ValueError: If the database rejects the row (duplicate symbol or a failed
            check). The message is the SQLite error text. The high and low prices
            are not compared with each other.
    """
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
    """List stored market prices.

    Args:
        symbol: Exact symbol to filter by, or None for all.

    Returns:
        list[dict]: Matching rows; empty if none match.
    """
    return market_price_repository.get_all(symbol)


def remove_market_price(symbol):
    """Delete a market price by symbol.

    Args:
        symbol: Exact, case-sensitive symbol.

    Raises:
        LookupError: If no row has that symbol.
        sqlite3.IntegrityError: If trades reference the symbol; not translated,
            so it propagates to the caller.
    """
    deleted = market_price_repository.remove(symbol)
    if deleted == 0:
        raise LookupError(f"symbol '{symbol}' not found")
