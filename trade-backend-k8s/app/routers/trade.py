import logging

from fastapi import APIRouter, HTTPException

from app.schemas.trade import TradeIn
from app.services.trade_services import create_trade, list_trades

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/trade", tags=["trade"])


@router.post("", status_code=201)
def post_trade(trade: TradeIn):
    logger.info("insert trade %s", trade.symbol)
    try:
        create_trade(trade)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return trade


@router.get("")
def get_trades():
    logger.info("select trade")
    return list_trades()
