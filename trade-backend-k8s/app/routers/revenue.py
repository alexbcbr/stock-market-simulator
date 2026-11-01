import logging

from fastapi import APIRouter

from app.services.market_price_services import getRevenue

logger = logging.getLogger(__name__)

router = APIRouter(tags=["revenue"])


@router.get("/revenue")
def get_revenue(open_price: float, close_price: float):
    logger.info("select revevue")
    return {"revenue": getRevenue(open_price, close_price)}
