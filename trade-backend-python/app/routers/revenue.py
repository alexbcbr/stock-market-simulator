import logging

from app.services.market_price_services import getRevenue
from fastapi import APIRouter

logger = logging.getLogger(__name__)

router = APIRouter(tags=["revenue"])


@router.get("/revenue")
def get_revenue(open_price: float, close_price: float):
    """Return the revenue for a pair of prices.

    Args:
        open_price: Opening price (required query parameter).
        close_price: Closing price (required query parameter).

    Returns:
        dict: ``{"revenue": close_price - open_price}``. Stateless; the database
            is not read. A missing parameter is answered with 422.
    """
    logger.info("select revevue")
    return {"revenue": getRevenue(open_price, close_price)}
