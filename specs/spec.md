As a product developer, I want to create a stock market simulation which allow show the stocks which a person built. 

It as simulator which means that there is no connection with the real stocks in the market. 

As part of the simulation, I want to crete 3 major features. 

1/ Dashboard to show transactions executed: I want a dashboard which lists the stock that a customer bought. This dashboard should show the name of the customer, the stock code (e.g AMZN, APPL), the price that this stock was bought and the price in the end of the day an the difference between what was paid versus what the closed price in the day. This dashboard should order the list of transactions based on the biggest difference between what price the stock was bought versus the closed price. 

2/ Buyer option: which allows customer buy the transaction. This feature allows customers buy the stock. They should inform their name, the name of the stock and the price you want to pay. After click in the button confirm, the operation should be recorded in the database including what the price from the market.

3/ Import market data: Feature to import CSV data into the market price database.

4/ Show the list of transactions of a single customer and list in the table

5/ Reset the simulation: Clean the game

Admin: 1, 3, 5
Customer: 2, 4

1. Bounded Contexts
1.1. Trading Context: Responsible for buying stocks and querying transactions.
1.2. Market Data Context: Responsible for stock prices and market opening data import.

2. Core Domain Concepts (Ubiquitous Language)
	•	Trade
	•	Stock
	•	Market Price
	•	Customer
	•	Market Session Start

3. Aggregates and Entities

3.1 Trade Aggregate (Trading Context)

Aggregate Root: Trade

Represents a completed stock purchase.

Trade
- tradeId
- symbol
- customerName
- executedPrice
- openPriceAtExecution
- closePriceAtExecution
- priceDifference

Notes
	•	priceDifference = executedPrice - openPriceAtExecution
	•	Symbol is a Value Object, not a raw string.

⸻

3.2 Stock Aggregate (Market Data Context)

Aggregate Root: Stock

Stock
- symbol
- currentMarketPrice


⸻

3.3 MarketPrice Entity: Represents daily price data for a stock.

MarketPrice
- symbol
- openPrice
- highPrice
- closePrice

⸻

4. Value Objects

4.1 StockSymbol

StockSymbol
- value (String, 4 chars)

Validation:
	•	Length = 4
	•	Uppercase

⸻


5. Repositories (Persistence Abstractions)

TradeRepository
- save(trade)
- findAllTrades()
- listTradesByCustomer(customerName)

StockRepository
- findBySymbol(symbol)
- save(stock)

MarketPriceRepository
- saveAll(marketPrices)
- findBySymbol(symbol)


⸻

6. Domain Services (involves multiple aggregates (Stock, Trade, MarketPrice))

6.1 StockTradingService

Handles stock buying transactions.

StockTradingService
- buyStock(symbol, customerName)

Responsibilities
	1.	Validate stock exists
	2.	Get current open/close price
	3.	Calculate executed price
	4.	Create and persist a Trade

⸻

6.2 TradeQueryService (Application Service)

Handles read-only use cases.

TradeQueryService
- listAllTrades()
- listTradesByCustomer(date, customerName)

⸻

6.3 StockPriceLookupService

StockPriceLookupService
- findPriceBySymbol(symbol)

Returns:
	•	Open
	•	High
	•	Close

⸻

6.4 MarketOpeningService

Handles importing stock prices when the market opens.

MarketOpeningService
- importOpeningPrices(priceFeed)

Responsibilities
	•	Parse external data
	•	Create MarketPrice entities
	•	Persist them
	•	Update Stock aggregates

⸻

7. Mapping from Tables to Domain Model

MarketTransaction → Trade

Table Column	Domain Attribute
Symbol	StockSymbol
Customer name	customerName
Price paid	executedPrice
Open priced	openPriceAtExecution
Closed priced	closePriceAtExecution
Price difference	priceDifference


⸻

StockPrice → MarketPrice

Table Column	Domain Attribute
Symbol	StockSymbol
Open	openPrice
High	highPrice
Close	closePrice


⸻

8. Use Case Flows

Buy Stock: Controller → StockTradingService → StockRepository → MarketPriceRepository → TradeRepository
List Today’s Trades: Controller → TradeQueryService → TradeRepository
Import Market Prices at Open: Scheduler → MarketOpeningService → MarketPriceRepository → StockRepository

⸻

9. Key DDD Design Decisions (Summary)
	•	Trade is the Aggregate Root, not the database table.
	•	Stock prices are immutable snapshots once recorded.
	•	Buying stock is a domain service, not an entity method.
	•	Queries are separated from command logic (CQRS-lite).
	•	Tables reflect persistence, not domain design.

 