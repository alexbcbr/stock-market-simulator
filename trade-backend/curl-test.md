B=http://<URL>

# health and market data
curl $B/health
curl $B/listMarketPrices
curl "$B/getMarketPrice?symbol=AAON"
curl "$B/getMarketSymbol?symbol=AAON"

# buy: market, an agent mode, and a manual bid
curl -X POST $B/buyStock -H 'Content-Type: application/json' \
    -d '{"symbol":"AAON","customer_name":"alex","price_mode":"market"}'

curl -X POST $B/buyStock -H 'Content-Type: application/json' \
    -d '{"symbol":"AAON","customer_name":"alex","price_mode":"agent_aggressive"}'

curl -X POST $B/buyStock -H 'Content-Type: application/json' \
    -d '{"symbol":"AAON","customer_name":"alex","price_mode":"manual","bid_price":95}'

# list
curl $B/listAllTrades
curl -X POST $B/listTradesByCustomerName -H 'Content-Type: application/json' \

# Error
curl -i "$B/getMarketPrice?symbol=ZZZZZZ"

# customers (crm_managed is always false; 409 if the name exists)
curl -X POST $B/createCustomer -H 'Content-Type: application/json' \
    -d '{"customer_name":"alex","fullname":"Alex C","email":"alex@example.com","company":"Contoso","date_of_birth":"1990-04-12","state_residence":"WA","allowed_contact":true}'
curl "$B/getCustomer?customer_name=alex"
