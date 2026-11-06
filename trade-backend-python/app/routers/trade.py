import logging

from app.schemas.trade import TradeIn
from app.services.trade_services import create_trade, list_trades
from fastapi import APIRouter, HTTPException

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/trade", tags=["trade"])


@router.post("", status_code=201)
def post_trade(trade: TradeIn):
    """Record a trade.

    Args:
        trade: Trade to store. The service derives ``price_difference``; see
            ``TradeIn`` for the fields and the lack of pricing rules.

    Returns:
        TradeIn: The submitted body (status 201). It does not include the
            database-assigned ``trade_id`` or ``price_difference``.

    Raises:
        HTTPException: 400 if the database rejects the trade: unknown symbol
            ("Market price not available for symbol"), symbol not 4 uppercase
            letters, or a negative price.
    """
    logger.info("insert trade %s", trade.symbol)
    try:
        create_trade(trade)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return trade


@router.get("")
def get_trades():
    """List all trades.

    Returns:
        list[dict]: Every stored trade including ``trade_id``. There is no filter
            and no guaranteed order; filtering by customer exists in the
            repository but is not exposed as a route.
    """
    logger.info("select trade")
    return list_trades()
