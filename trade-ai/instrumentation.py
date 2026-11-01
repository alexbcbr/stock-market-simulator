"""Arize AX tracing setup, shared by the fin_assistant agents and the MCP server/client.

Import this module before any LangChain or mcp import - instrumentation must be
wired before those libraries are imported, or their calls won't be patched.

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
