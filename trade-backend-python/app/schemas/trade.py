from pydantic import BaseModel


class TradeIn(BaseModel):
    """A trade as submitted by a client.

    The backend does not apply any pricing rule: ``executed_price`` and
    ``status_trade`` are stored exactly as sent. This differs from the TypeScript
    ``trade-backend``, which computes both from the market price and the strategy.

    Attributes:
        symbol: 4 uppercase letters of a symbol already in ``market_price``;
            otherwise the insert is rejected.
        customer_name: Free-text player name; not validated.
        executed_price: Price paid; must not be negative.
        open_price: Market open price to record; must not be negative.
        closed_price: Market close price to record. Note the spelling: the
            TypeScript API calls this ``close_price``.
        status_trade: Whether the trade succeeded. Defaults to False.
    """

    symbol: str
    customer_name: str
    executed_price: float
    open_price: float
    closed_price: float
    status_trade: bool = False


class Trade(TradeIn):
    """A trade with its derived profit figure, as stored.

    Attributes:
        price_difference: ``closed_price - open_price``, set by the service. It
            does not use ``executed_price``, unlike the TypeScript backend, which
            computes ``close_price - executed_price``.
    """

    price_difference: float
