"""MCP server that exposes the trade backend to the AI agents as tools.

Start it with ``uv run stock_mcp_server.py``. It serves MCP over streamable HTTP
at ``http://127.0.0.1:8001/mcp`` and forwards every call to the Python FastAPI
backend at ``http://127.0.0.1:8000`` (``BASE_URL``, fixed in code). Start the
backend first; the server itself starts without it, and each tool call then
fails with ``ApiError``.

Tools: ``check_user``, ``buy_stock``, ``list_market_prices``, ``list_trades``,
``create_trade``. The docstring of each tool is sent to the model as its
description, so those docstrings are written for the model. Editing one changes
agent behavior and can move the eval scores in ``evals/``.

Constraints:
    ``mcp.run`` executes at import time and blocks, so this module cannot be
    imported by other code. ``users_authorized`` is a fixed allow-list and is
    only advice to the model: ``create_trade`` does not check it.
    ``buy_stock`` is a stub that always returns True and buys nothing; the real
    purchase is ``create_trade``.
"""

import json
import urllib.error
import urllib.request

from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP

load_dotenv()

mcp = FastMCP("stocks", host="127.0.0.1", port=8001)
BASE_URL = "http://127.0.0.1:8000"

users_authorized = ["alex", "john", "sue", "maria", "jim"]


class ApiError(Exception):
    """Raised when a backend call fails.

    The message is the backend's ``detail`` field for an HTTP error, or the
    connection failure text when the backend cannot be reached.
    """


def _request(method, path, payload=None):
    """Call the FastAPI backend and parse the JSON answer.

    Args:
        method: HTTP method, for example ``"GET"`` or ``"POST"``.
        path: Path under ``BASE_URL``, starting with ``/``.
        payload: Body to send as JSON, or None for no body.

    Returns:
        The decoded JSON response.

    Raises:
        ApiError: On an HTTP error status or when the backend is unreachable. An
            HTTP error whose body is not JSON raises ``json.JSONDecodeError``
            instead, since the body is decoded to read ``detail``.
    """
    url = f"{BASE_URL}{path}"
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(
        url, data=data, method=method, headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as exc:
        detail = json.loads(exc.read()).get("detail", exc.reason)
        raise ApiError(detail) from exc
    except urllib.error.URLError as exc:
        raise ApiError(f"Could not reach {url}: {exc.reason}") from exc


@mcp.tool()
def check_user(user_name: str) -> bool:
    """Find if the user is authorized to execute a transaction"""
    return user_name in users_authorized


@mcp.tool()
def buy_stock(ticker: str) -> bool:
    """Buy a stock"""
    return True


@mcp.tool()
def list_market_prices():
    """List all the stocks in the market"""
    return _request("GET", "/market-price")


@mcp.tool()
def list_trades():
    """List all the trades available"""
    return _request("GET", "/trade")


@mcp.tool()
def create_trade(trade):
    """Submit a Trade"""
    return _request("POST", "/trade", trade)


mcp.run(transport="streamable-http")
