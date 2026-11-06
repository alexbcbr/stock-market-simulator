from pydantic import BaseModel


class MarketPrice(BaseModel):
    """Daily price snapshot for one symbol, as sent to and returned by the API.

    The model only checks types. The rules below are enforced by the database
    (``ddl/market_price.sql``), so a violation surfaces as a 400 from
    ``POST /market-price`` rather than a 422.

    Attributes:
        symbol: Exactly 4 uppercase letters; also the primary key, so a symbol can
            be inserted only once.
        open_price: Opening price; must not be negative.
        high_price: Highest price of the day; must not be negative.
        low_price: Lowest price of the day; must not be negative.
        close_price: Closing price; must not be negative.
    """

    symbol: str
    open_price: float
    high_price: float
    low_price: float
    close_price: float
