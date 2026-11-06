"""Arize AX tracing setup, shared by the fin_assistant agents and the MCP server/client.

Import this module before any LangChain or mcp import - instrumentation must be
wired before those libraries are imported, or their calls won't be patched.

Environment:
    ARIZE_SPACE_ID: Required.
    ARIZE_API_KEY: Required.
    ARIZE_OTLP_ENDPOINT: Required.
    ARIZE_PROJECT_NAME: Optional; defaults to ``trade-ai``.

Raises:
    KeyError: At import time, if a required variable is missing. Load ``.env``
        (``load_dotenv()``) before importing this module.

Attributes:
    tracer_provider: Provider the agents flush and shut down on exit.
"""

import os

from arize.otel import register
from openinference.instrumentation.langchain import LangChainInstrumentor
from openinference.instrumentation.mcp import MCPInstrumentor

tracer_provider = register(
    space_id=os.environ["ARIZE_SPACE_ID"],
    api_key=os.environ["ARIZE_API_KEY"],
    endpoint=os.environ["ARIZE_OTLP_ENDPOINT"],
    project_name=os.environ.get("ARIZE_PROJECT_NAME", "trade-ai"),
)

LangChainInstrumentor().instrument(tracer_provider=tracer_provider)
MCPInstrumentor().instrument(tracer_provider=tracer_provider)
