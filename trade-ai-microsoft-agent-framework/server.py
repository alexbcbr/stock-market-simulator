"""Foundry Hosted Agent entrypoint.

Wraps the financial assistant agent from 01fin_assistant.py in Azure AI
Foundry's Responses protocol server, so it can run as a hosted agent
container instead of the local CLI loop.
"""

import importlib.util
from pathlib import Path

from agent_framework_foundry_hosting import ResponsesHostServer

_spec = importlib.util.spec_from_file_location(
    "fin_assistant_01", Path(__file__).parent / "01fin_assistant.py"
)
_fin_assistant = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_fin_assistant)

host_server = ResponsesHostServer(_fin_assistant.agent)

if __name__ == "__main__":
    host_server.run()
