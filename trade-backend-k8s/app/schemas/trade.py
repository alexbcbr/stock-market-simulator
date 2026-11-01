from pydantic import BaseModel


class TradeIn(BaseModel):
    symbol: str
    customer_name: str
    executed_price: float
    open_price: float
    closed_price: float
    status_trade: bool = False


class Trade(TradeIn):
    price_difference: float