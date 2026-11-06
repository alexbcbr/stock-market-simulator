"""Arize AX tracing setup for the Claude Agent SDK financial assistant.

Import this module before any claude_agent_sdk import - instrumentation must
be wired before that library is imported, or its calls won't be patched.

Environment:
    ARIZE_SPACE_ID: Required.
    ARIZE_API_KEY: Required.
    ARIZE_OTLP_ENDPOINT: Required.
    ARIZE_PROJECT_NAME: Optional; defaults to ``trade-ai-claude-agent-sdk``.
        The evals pipeline reads spans from this project name.

Raises:
    KeyError: At import time, if a required variable is missing.

Note:
    No application module imports this file today, so the agents send no traces
    until you add ``import instrumentation`` before the ``claude_agent_sdk``
    import.
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
