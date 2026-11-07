#!/usr/bin/env bash
# Smoke test for any deployment of the trade API (local, k8s, AWS, Azure).
# Usage: scripts/smoke.sh <base-url>     e.g. http://localhost:8080 or https://xyz.execute-api.us-east-1.amazonaws.com/prod
# Env:   SYMBOL (default AAON, must exist in market_price)  CUSTOMER (default smoke-test)
# Every target must pass the same checks: same status codes, same plain-JSON shapes.
set -u
BASE="${1:?usage: smoke.sh <base-url>}"; BASE="${BASE%/}"
SYMBOL="${SYMBOL:-AAON}"; CUSTOMER="${CUSTOMER:-smoke-test}"
pass=0; fail=0

check() { # name expected_status method path [json-body] [jq-assertion]
  local name="$1" want="$2" method="$3" path="$4" body="${5:-}" assertion="${6:-}"
  local out status resp
  if [ -n "$body" ]; then
    out=$(curl -s -w $'\n%{http_code}' -X "$method" -H 'Content-Type: application/json' -d "$body" "$BASE/$path")
  else
    out=$(curl -s -w $'\n%{http_code}' -X "$method" "$BASE/$path")
  fi
  status="${out##*$'\n'}"; resp="${out%$'\n'*}"
  LAST="$resp"
  if [ "$status" != "$want" ]; then echo "FAIL $name: status $status, expected $want ($resp)"; fail=$((fail+1)); return; fi
  if [ -n "$assertion" ] && ! echo "$resp" | jq -e "$assertion" >/dev/null 2>&1; then
    echo "FAIL $name: response did not satisfy: $assertion ($resp)"; fail=$((fail+1)); return
  fi
  echo "ok   $name"; pass=$((pass+1))
}

check "listMarketPrices is plain JSON"  200 GET  listMarketPrices "" 'type=="array" and (.[0].symbol|type=="string") and (.[0].open_price|type=="number")'
check "getMarketPrice"                  200 GET  "getMarketPrice?symbol=$SYMBOL" "" '.symbol=="'$SYMBOL'" and (.highest_price|type=="number")'
check "getMarketPrice unknown symbol"   404 GET  "getMarketPrice?symbol=ZZZZZZ"
check "getMarketPrice missing symbol"   400 GET  getMarketPrice
check "getMarketSymbol"                 200 GET  "getMarketSymbol?symbol=$SYMBOL" "" '.symbol=="'$SYMBOL'" and (.name|type=="string")'
check "getMarketSymbol unknown symbol"  404 GET  "getMarketSymbol?symbol=ZZZZZZ"
check "buyStock invalid body"           400 POST buyStock '{"symbol":"'$SYMBOL'"}'
check "buyStock unknown symbol"         404 POST buyStock '{"symbol":"ZZZZZZ","customer_name":"'$CUSTOMER'","price_mode":"market"}'
check "buyStock market"                 201 POST buyStock '{"symbol":"'$SYMBOL'","customer_name":"'$CUSTOMER'","price_mode":"market"}' \
  '(.trade_id|type=="string") and (.executed_price|type=="number") and .status_trade==true and .status_sell==false and .trade_source=="market"'
TRADE_ID=$(echo "$LAST" | jq -r .trade_id); TRADE_TS=$(echo "$LAST" | jq -r .trade_timestamp)
check "listTradesByCustomerName"        200 POST listTradesByCustomerName '{"customer_name":"'$CUSTOMER'"}' 'type=="array" and any(.[]; .trade_id=="'$TRADE_ID'")'
check "listTradesByCustomerName no name" 400 POST listTradesByCustomerName '{}'
check "listAllTrades"                   200 GET  listAllTrades "" 'type=="array" and any(.[]; .trade_id=="'$TRADE_ID'")'
check "sellStock"                       200 POST sellStock '{"trade_id":"'$TRADE_ID'","trade_timestamp":"'$TRADE_TS'"}' '.success==true'
check "trade is marked sold"            200 POST listTradesByCustomerName '{"customer_name":"'$CUSTOMER'"}' 'any(.[]; .trade_id=="'$TRADE_ID'" and .status_sell==true)'
check "sellStock missing fields"        400 POST sellStock '{}'

NEW_CUSTOMER="smoke-$(date +%s)-$RANDOM"
check "createCustomer defaults"         201 POST createCustomer '{"customer_name":"'$NEW_CUSTOMER'"}' \
  '.customer_name=="'$NEW_CUSTOMER'" and .allowed_contact==false and .crm_managed==false and .fullname==null and .email==null'
check "createCustomer duplicate"        409 POST createCustomer '{"customer_name":"'$NEW_CUSTOMER'","allowed_contact":true}'
check "createCustomer invalid body"     400 POST createCustomer '{"customer_name":"x","allowed_contact":"yes"}'
check "createCustomer missing name"     400 POST createCustomer '{}'
check "getCustomer"                     200 GET  "getCustomer?customer_name=$NEW_CUSTOMER" "" '.customer_name=="'$NEW_CUSTOMER'" and .allowed_contact==false'
check "getCustomer unknown name"        404 GET  "getCustomer?customer_name=no-such-customer-$NEW_CUSTOMER"
check "getCustomer missing name"        400 GET  getCustomer

echo "passed=$pass failed=$fail"; [ "$fail" -eq 0 ]
