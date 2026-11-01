import sqlite3
import pytest

from app.db import get_connection
from app.repositories import market_price_repository as mp
from app.schemas.market_price import MarketPrice

SYMBOLS = ("AAPL", "GART")

@pytest.fixture(autouse=True)
def clear_market_price():
    def _clear():
        with get_connection() as conn:
            conn.executemany(
                "DELETE FROM market_price WHERE symbol = ?", [(s,) for s in SYMBOLS]
            )

    _clear()
    yield
    _clear()


def test_insert_market_price():
    mp.add(MarketPrice(symbol="AAPL", open_price=10, high_price=12, low_price=9, close_price=11))

    rows = mp.get_all("AAPL")
    assert rows == [
        {"symbol": "AAPL", "open_price": 10, "high_price": 12, "low_price": 9, "close_price": 11}
    ]


def test_insert_market_price_duplicate_symbol_raises():
    mp.add(MarketPrice(symbol="AAPL", open_price=10, high_price=12, low_price=9, close_price=11))

    with pytest.raises(sqlite3.IntegrityError):
        mp.add(MarketPrice(symbol="AAPL", open_price=20, high_price=22, low_price=19, close_price=21))


def test_insert_market_price_invalid_symbol_raises():
    with pytest.raises(sqlite3.IntegrityError):
        mp.add(MarketPrice(symbol="aapl", open_price=10, high_price=12, low_price=9, close_price=11))


def test_insert_market_price_negative_price_raises():
    with pytest.raises(sqlite3.IntegrityError):
        mp.add(MarketPrice(symbol="AAPL", open_price=-10, high_price=12, low_price=9, close_price=11))


def test_select_market_prices_returns_all():
    mp.add(MarketPrice(symbol="AAPL", open_price=10, high_price=12, low_price=9, close_price=11))
    mp.add(MarketPrice(symbol="GART", open_price=20, high_price=22, low_price=19, close_price=21))

    rows = mp.get_all()

    symbols = {row["symbol"] for row in rows}
    assert {"AAPL", "GART"} <= symbols


def test_select_market_prices_filters_by_symbol():
    mp.add(MarketPrice(symbol="AAPL", open_price=10, high_price=12, low_price=9, close_price=11))
    mp.add(MarketPrice(symbol="GART", open_price=20, high_price=22, low_price=19, close_price=21))

    rows = mp.get_all("GART")

    assert rows == [
        {"symbol": "GART", "open_price": 20, "high_price": 22, "low_price": 19, "close_price": 21}
    ]


def test_select_market_prices_unknown_symbol_returns_empty():
    assert mp.get_all("ZZZZ") == []


def test_delete_market_price_removes_row():
    mp.add(MarketPrice(symbol="AAPL", open_price=10, high_price=12, low_price=9, close_price=11))

    deleted = mp.remove("AAPL")

    assert deleted == 1
    assert mp.get_all("AAPL") == []


def test_delete_market_price_unknown_symbol_returns_zero():
    assert mp.remove("ZZZZ") == 0
