import json
import urllib.error
import urllib.request

BASE_URL = "http://127.0.0.1:8000"


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


def list_market_prices():
    return _request("GET", "/market-price")


def create_market_price(market_price):
    return _request("POST", "/market-price", market_price)


def list_trades():
    return _request("GET", "/trade")


def create_trade(trade):
    return _request("POST", "/trade", trade)
