"""Arize AX tracing setup for the Claude Agent SDK financial assistant.

Import this module before any claude_agent_sdk import - instrumentation must
be wired before that library is imported, or its calls won't be patched.
"""

import os

from arize.otel import register
from openinference.instrumentation.claude_agent_sdk import ClaudeAgentSDKInstrumentor

tracer_provider = register(
    space_id=os.environ["ARIZE_SPACE_ID"],
    api_key=os.environ["ARIZE_API_KEY"],
    endpoint=os.environ["ARIZE_OTLP_ENDPOINT"],
    project_name=os.environ.get("ARIZE_PROJECT_NAME", "trade-ai-claude-agent-sdk"),
)

ClaudeAgentSDKInstrumentor().instrument(tracer_provider=tracer_provider)
