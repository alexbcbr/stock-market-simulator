from dotenv import load_dotenv
import json
import urllib.error
import urllib.request

from mcp.server.fastmcp import FastMCP

load_dotenv()

mcp = FastMCP("stocks", host="127.0.0.1", port=8001)
BASE_URL = "http://127.0.0.1:8000"

users_authorized=["alex", "john", "sue", "maria", "jim"]


class ApiError(Exception):
    pass


def _request(method, path, payload=None):
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
    if user_name in users_authorized:
        return True

    return False

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

mcp.run(transport='streamable-http')
