import logging

from app.schemas.market_price import MarketPrice
from app.services.market_price_services import (
    create_market_price,
    list_market_prices,
    remove_market_price,
)
from fastapi import APIRouter, HTTPException

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/market-price", tags=["market-price"])


@router.post("", status_code=201)
def post_market_price(market_price: MarketPrice):
    """Create a market price.

    Args:
        market_price: Price snapshot to store; see ``MarketPrice`` for the rules.

    Returns:
        MarketPrice: The submitted body, unchanged (status 201).

    Raises:
        HTTPException: 400 if the database rejects the row: duplicate symbol,
            symbol not 4 uppercase letters, or a negative price. A malformed body
            is answered by FastAPI with 422 before this runs.
    """
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
    """List market prices, optionally for one symbol.

    Args:
        symbol: Exact, case-sensitive symbol to filter by. Omit to list all.

    Returns:
        list[dict]: Matching rows. An unknown symbol returns an empty list, never
            404.
    """
    logger.info("select market_price %s", symbol)
    return list_market_prices(symbol)


@router.delete("/{symbol}")
def delete_market_price(symbol: str):
    """Delete a market price.

    Args:
        symbol: Exact, case-sensitive symbol to delete.

    Returns:
        dict: ``{"deleted": symbol}``.

    Raises:
        HTTPException: 404 if the symbol does not exist.
        sqlite3.IntegrityError: If trades still reference the symbol. It is not
            caught here, so the client receives a 500.
    """
    logger.info("delete market_price %s", symbol)
    try:
        remove_market_price(symbol)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"deleted": symbol}
