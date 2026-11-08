# F-012 Plan

1. **Crew** (done): researcher, writer and reviewer agents, one crew per customer, `output_file` set on the reviewer task. Covers R1 to R5, R8.
2. **Privacy** (done): tracing and telemetry off, `.gitignore` entries. Covers R6, R7.
3. **Docs** (done): module docstring in `main.py` and `trade-ai-crewai/README.md`.
4. **Pipeline** (done): `ci-python.yml` Pyright matrix and `make pydoc` include the project; Ruff already covers the whole repo.
5. **Tests** (not now): no unit tests yet, so the project is not in `make unit-test-python`.
6. **Later** (planned): unit tests with a stubbed LLM and search tool; skip customers without `allowed_contact`; read customers from the API instead of the CSV; tracing in a tool of choice.
