"""FastAPI application entry point for the Python trade backend.

Run with ``uv run uvicorn app.main:app --reload`` (port 8000). The AI agents reach
this API through the MCP server in ``trade-ai/stock_mcp_server.py``, and the
console client calls it directly.

Constraints:
    CORS allows only the Vite dev server origins (``localhost:5173`` and
    ``127.0.0.1:5173``). A browser app served from anywhere else is blocked.
    The API has no authentication.
"""

import logging

from app.routers import market_price, revenue, trade
from app.utils.logging import setup_logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

setup_logging()
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(revenue.router)
app.include_router(market_price.router)
app.include_router(trade.router)


@app.get("/")
def read_root():
    """Return a greeting so callers can check that the API is up.

    Returns:
        dict: ``{"message": "Hello from trade-backend!"}``. Does not touch the
            database, so it succeeds even when the database file is missing.
    """
    logger.info("Initialize API")
    return {"message": "Hello from trade-backend!"}
