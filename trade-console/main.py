import os

from api_client import (
    ApiError,
    create_market_price,
    create_trade,
    list_market_prices,
    list_trades,
)


def clear_screen():
    os.system("cls" if os.name == "nt" else "clear")


def print_table(rows):
    if not rows:
        print("No records found.")
        return
    headers = list(rows[0].keys())
    widths = [
        max(len(h), *(len(str(row[h])) for row in rows)) for h in headers
    ]
    print(" | ".join(h.ljust(w) for h, w in zip(headers, widths)))
    print("-" * (sum(widths) + 3 * (len(headers) - 1)))
    for row in rows:
        print(" | ".join(str(row[h]).ljust(w) for h, w in zip(headers, widths)))


def fraud_status(trade):
    closed_price = trade.get("closed_price")
    if closed_price is None or closed_price <= 0:
        return "Yes", "Value Market manipulated"
    if trade["executed_price"] > 3 * closed_price:
        return "Suspect", "Gains above the market standard"
    return "No", ""


def list_fraud():
    rows = []
    for trade in list_trades():
        fraud, reason = fraud_status(trade)
        rows.append(
            {
                "trade_id": trade["trade_id"],
                "symbol": trade["symbol"],
                "executed_price": trade["executed_price"],
                "fraud": fraud,
                "reason": reason,
            }
        )
    print_table(rows)


def prompt_market_price():
    symbol = input("Symbol (Enter to cancel): ").strip().upper()
    if not symbol:
        return None
    open_price = float(input("Open price: "))
    high_price = float(input("High price: "))
    low_price = float(input("Low price: "))
    close_price = float(input("Close price: "))
    return {
        "symbol": symbol,
        "open_price": open_price,
        "high_price": high_price,
        "low_price": low_price,
        "close_price": close_price,
    }


def prompt_trade():
    symbol = input("Symbol (Enter to cancel): ").strip().upper()
    if not symbol:
        return None
    customer_name = input("Customer name: ").strip()
    executed_price = float(input("Executed price: "))
    open_price = float(input("Open price: "))
    closed_price = float(input("Closed price: "))
    status_trade = input("Status trade (y/n): ").strip().lower() == "y"
    return {
        "symbol": symbol,
        "customer_name": customer_name,
        "executed_price": executed_price,
        "open_price": open_price,
        "closed_price": closed_price,
        "status_trade": status_trade,
    }


def print_menu():
    print("\n1. List market prices")
    print("2. List trades")
    print("3. List fraud")
    print("4. Insert trade")
    print("5. Insert market price")
    print("0. Exit")


def main():
    while True:
        clear_screen()
        print_menu()
        choice = input("Choose an option: ").strip()

        if choice == "0":
            break

        clear_screen()
        try:
            if choice == "1":
                print_table(list_market_prices())
            elif choice == "2":
                print_table(list_trades())
            elif choice == "3":
                list_fraud()
            elif choice == "4":
                trade = prompt_trade()
                if trade is None:
                    continue
                create_trade(trade)
                print("Trade inserted successfully.")
            elif choice == "5":
                market_price = prompt_market_price()
                if market_price is None:
                    continue
                create_market_price(market_price)
                print("Market price inserted successfully.")
            else:
                print("Invalid option.")
        except ApiError as exc:
            print(f"Error: {exc}")
        except ValueError:
            print("Invalid input, please enter numeric values where expected.")

        input("\nPress Enter to continue...")


if __name__ == "__main__":
    main()
