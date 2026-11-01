from app.db import get_connection
import pytest

from app.repositories import trade_repository as trade
from app.repositories import market_price_repository as mp
from app.schemas.market_price import MarketPrice
from app.schemas.trade import Trade

@pytest.fixture(scope="module", autouse=True)
def setup_module_data():
    def _clear():
        with get_connection() as conn:
            conn.execute("DELETE FROM trade")
            conn.execute("DELETE FROM market_price")
    _clear()
    yield
    _clear()

def test_confirm_trade():
    mp.add(MarketPrice(symbol="GART", open_price=10, high_price=12, low_price=9, close_price=11))
    trade.add(
        Trade(
            symbol="GART",
            customer_name="Alex",
            executed_price=121.0,
            open_price=120.1,
            closed_price=118.4,
            price_difference=-1.7,
            status_trade=True,
        )
    )
    rows = trade.find_by_customer("Alex")
    assert {row["customer_name"] for row in rows} == {"Alex"}

