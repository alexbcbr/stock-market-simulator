⏺ Run these in separate terminals, from the repo root. The first two start the services the agent needs.

  # 1. Backend (seed the DB once; it's tracked in git, so restore it afterwards)
  sqlite3 trade-backend-python/data/market_stock.db < ddl/seed.sql
  cd trade-backend-python && uv run python -m uvicorn app.main:app --port 8000

  # 2. MCP stocks server
  cd trade-ai && uv run stock_mcp_server.py

  # 3. The agent (REPL). Ask something that needs prices, e.g.
  #    "What are the current prices of AAPL and MSFT? Should I buy either?"
  cd trade-ai-claude-agent-sdk && uv run finance_advisor_app.py

  Use uv run python -m uvicorn, not uv run uvicorn. The second form picked up the Homebrew uvicorn on my machine and failed with "No module named fastapi".

  Stop the agent with Ctrl+C after your questions. Spans export when the process exits, but the REPL never exits on its own, so give it a few seconds before stopping.

  Then trigger the AX evaluation. Set the time window to cover your run, in UTC with no trailing Z:

  ax tasks trigger-run T25saW5lVGFzazo1NjE0MzpqZTd6 \
    --data-start-time "2026-11-07T00:00:00" \
    --data-end-time "2026-11-07T23:59:59" \
    --max-spans 100 --wait

  To read the result, check the root span's evaluations field:

  ax spans export trade-ai-claude-agent-sdk --space "Default Space" -l 20 --days 1 --stdout \
    | python3 -c "import sys,json; [print(s['attributes'].get('input.value','')[:50], '->', s.get('evaluations')) for s in json.load(sys.stdin) if not s.get('parent_id')]"

  You can also open the project in the Arize UI.

  If it doesn't work
  - The window must be in UTC. Fresh spans can take up to 1–2 hours to appear in AX's evaluation index, so a run right after your test may score 0 spans. If so, wait and rerun.
  - Only turns where the agent made a tool call get scored. A question answered from memory is skipped, with "context has null values".
  - To test an unfaithful case, ask a question and then tamper with the tool result, or temporarily change the instruction in SYSTEM_PROMPT so the model is encouraged to guess. That shows the judge can return unfaithful. I haven't tried this.