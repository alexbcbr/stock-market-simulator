import pandas as pd
import yfinance as yf

with open("nasdaq-clean-symbols.txt", "r") as f:
    tickers = [line.strip() for line in f if line.strip()]

# tickers = ["AAPL","MSFT"]

start = "2026-01-21"
end = "2026-01-22"

df = yf.download(tickers, start=start, end=end)

# Filter for active tickers: those with at least one non-NaN 'Close' value
active_tickers = []
for ticker in tickers:
    ticker_df = df.xs(ticker, level=1, axis=1)
    if not ticker_df.empty and ticker_df["Close"].notna().any():
        active_tickers.append(ticker)

# Save active tickers to a new file
with open("nasdaq-active-symbols.txt", "w") as f:
    for ticker in active_tickers:
        f.write(f"{ticker}\n")

# Process and save data only for active tickers
for date in df.index:
    day_df = df.loc[[date]]
    stocks_data = []
    for ticker in active_tickers:
        stock_series = day_df.xs(ticker, level=1, axis=1).iloc[0]
        stock_row = stock_series.to_dict()
        stock_row["Ticker"] = ticker
        stocks_data.append(stock_row)
    day_df_out = pd.DataFrame(stocks_data)
    day_df_out.to_csv(f"{date.date()}.csv", index=False)
