import logging

from fastapi import APIRouter, HTTPException

from app.schemas.market_price import MarketPrice
from app.services.market_price_services import (
    create_market_price,
    list_market_prices,
    remove_market_price,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/market-price", tags=["market-price"])


@router.post("", status_code=201)
def post_market_price(market_price: MarketPrice):
    logger.info("insert market_price %s", market_price.symbol)
    try:
        create_market_price(
            market_price.symbol,
            market_price.open_price,
            market_price.high_price,
            market_price.low_price,
            market_price.close_price,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return market_price


@router.get("")
def get_market_price(symbol: str | None = None):
    logger.info("select market_price %s", symbol)
    return list_market_prices(symbol)


@router.delete("/{symbol}")
def delete_market_price(symbol: str):
    logger.info("delete market_price %s", symbol)
    try:
        remove_market_price(symbol)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"deleted": symbol}
