"""Baseline financial assistant: no tools, fully synchronous.

Plain chat agent with a system prompt and conversation memory, but tools=[]
so it can't look up real market data or place trades - it only answers from
the model's own knowledge. Synchronous throughout (agent.invoke).

See 02fin_assistant_with_tools.py for the MCP-tools version and
03fin_assistant_async.py for the fully async version.
"""

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.chat_models import init_chat_model
from langchain_core.messages import HumanMessage
from langgraph.checkpoint.memory import InMemorySaver

load_dotenv()

SYSTEM_PROMPT = "You're a financial assistant. Don't answer question outside of the context of financial market."

checkpointer = InMemorySaver()

agent = create_agent(
    model=init_chat_model(
        model='us.anthropic.claude-sonnet-4-5-20250929-v1:0',
        model_provider='bedrock_converse',
        temperature=0.1,
    ),
    tools=[],
    system_prompt=SYSTEM_PROMPT,
    checkpointer=checkpointer,
)

def inference(question: str, thread_id: str):
    config = {"configurable": {"thread_id": thread_id}}
    result = agent.invoke(
        {"messages": [HumanMessage(content=question)]},
        config=config,
    )
    return result["messages"][-1].content

if __name__ == "__main__":
    print("*** Welcome to the Financial Bot. How can I help? ***")
    print("***************************************************")
    thread_id = "cli-session"
    while(True):
        question = input(">> ")
        print(inference(question, thread_id))
        print("***************************************************")
