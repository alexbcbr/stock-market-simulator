---
id: F-006
title: AI financial assistant
status: implemented
---
# F-006 AI financial assistant

## Context
The point of the project: show agents working in a critical workflow. An assistant answers finance questions, looks up prices and trades, and places trades for authorized users, only through a narrow tool interface (MCP). Three implementations of the same assistant exist: `trade-ai/` (LangChain / LangGraph; files `01` to `04` are progressive versions, `04fin_assistant_bp.py` is the current one), `trade-ai-claude-agent-sdk/` and `trade-ai-microsoft-agent-framework/` (has a server and a Dockerfile). The tools call the Python FastAPI backend (`trade-backend-k8s`, port 8000), not the TypeScript backend.

## User stories
| ID | Priority | Story | Requirements |
|---|---|---|---|
| F-006-S1 | P1 | As a **player**, I want to ask the assistant about prices and my trades, so I get answers without using the UI. | R1, R2, R3 |
| F-006-S2 | P1 | As a **player**, I want the assistant to place a trade for me, so I can see an agent act on my behalf. | R4, R5 |
| F-006-S3 | P1 | As a **facilitator**, I want the assistant to refuse unauthorized users and off-topic requests, so the demo shows controlled agent behavior. | R5, R6 |
| F-006-S4 | P2 | As a **presenter**, I want the same assistant on three frameworks, so I can compare them. | R7 |
| F-006-S5 | P2 | As a **developer**, I want the agents to see the backend only through tools, so I can test and trace every action. | R1, R8 |

## Requirements
- **R1** The MCP server (`trade-ai/stock_mcp_server.py`, port 8001, streamable HTTP) SHALL expose the tools `check_user`, `buy_stock`, `list_market_prices`, `list_trades` and `create_trade`.
- **R2** WHEN `list_market_prices` is called, the server SHALL call `GET /market-price`; WHEN `list_trades` is called, it SHALL call `GET /trade`.
- **R3** WHEN the backend is unreachable or answers an error, the tool SHALL return an `ApiError` message with the backend's detail or the connection failure.
- **R4** WHEN `create_trade` is called with a trade, the server SHALL `POST /trade` and return the backend's answer (201 on success, 400 with detail on a rule violation).
- **R5** WHEN `check_user` is called, it SHALL return true only for names in the allow-list (`alex`, `john`, `sue`, `maria`, `jim`).
- **R6** The agent's system prompt SHALL restrict it to financial-market topics: "You're a financial assistant. Don't answer question outside of the context of financial market."
- **R7** Each agent SHALL use the same tools and the same system prompt; models SHALL come from AWS Bedrock.
- **R8** Agents SHALL NOT call the backend directly; all backend access SHALL go through MCP tools.
- **R9** Start order SHALL be: FastAPI backend, MCP server, agent.

## Out of scope
Voice interaction (planned as a separate feature), real authentication, agents on the TypeScript backend (planned).

## Decisions
- D1: Narrow tool interface (MCP) so every agent action can be checked and traced.
- D2: Three frameworks are kept on purpose, to compare them on the same task.
- D3: The agents use the Python backend; its trade rules are separate from the TypeScript core.

## Known gaps
- **G1** `buy_stock` in the MCP server is a stub that always returns `True`; the real purchase is `create_trade`.
- **G2** The allow-list is hard-coded in the server.
- **G3** The agent decides the trade, and nothing in the tool layer requires that the player was checked first (`check_user` is advice to the model, not enforced).
- **G4** The Python backend's rules can differ from the TypeScript core (F-001 G5), so an agent trade may behave differently from a UI trade.
