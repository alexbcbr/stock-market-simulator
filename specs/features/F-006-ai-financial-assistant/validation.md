# F-006 Validation

Mergeable when the checks for every requirement you touched pass.

## Global
- No `.env` or key is committed (pre-commit and secret scan pass).
- Run order: FastAPI backend, MCP server, agent.

## Per requirement
| Requirement | How it is checked |
|---|---|
| R1 | Start the MCP server; list its tools; the five tool names are present |
| R2, R4 | Call `list_market_prices`, `list_trades` and `create_trade` directly (MCP client or `stock_mcp_client.py`) against a running backend; check the data and a new row in `GET /trade` |
| R3 | Stop the backend and call a tool: the error mentions "Could not reach" |
| R5 | `check_user("alex")` is true; `check_user("bob")` is false |
| R6 | Each agent refuses an off-topic question (for example a recipe) |
| R7 | Each agent answers the same price question and the same trade-history question with a tool call |
| R8 | Code review: agents import no HTTP client for the backend; only the MCP client |
| R9 | Following the documented order works from a clean start |

The F-007 evaluation loop runs on the changed agent, and its scores do not drop against the previous experiment.

## Open (until the gap tasks are done)
- G1: the `buy_stock` stub is gone or does a real purchase.
- G3: calling `create_trade` for a name not in the allow-list is refused by the tool, without the model.
