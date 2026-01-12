"""
Deep Agents Shim Implementation.
This module simulates the behavior of the 'deepagents' library (LangChain v1.2.0 feature)
by wrapping LangGraph functionalities. This allows the system to run the requested
architecture even if the cutting-edge PyPI package is not yet available in the environment.
"""

from typing import List, Dict, Any, Optional, Union, Callable
from langgraph.graph import StateGraph, END
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import JsonOutputParser
from langchain_openai import ChatOpenAI
from typing import TypedDict, Annotated
import operator
import json

# --- State Definition (Simulating Deep Agents Internal State) ---

class DeepAgentState(TypedDict):
    messages: Annotated[List[BaseMessage], operator.add]
    plan: List[str]
    context: Dict[str, Any]
    next_step: str
    scratchpad: str

# --- Core Function: create_deep_agent ---

def create_deep_agent(
    model: ChatOpenAI,
    subagents: List[Dict[str, Any]],
    system_prompt: str
) -> Any:
    """
    Creates a hierarchical agent graph following the Deep Agents architecture.
    
    Args:
        model: The LLM to act as the Supervisor/Planner.
        subagents: List of dicts defining sub-agents (name, description, prompt).
        system_prompt: The high-level instruction for the Supervisor.
        
    Returns:
        A compiled LangGraph application.
    """
    
    # 1. Define Supervisor Node (The Planner)
    async def supervisor_node(state: DeepAgentState):
        messages = state.get("messages", [])
        plan = state.get("plan", [])
        
        # 1.1 Calculate RAG Strategy
        context_data = state.get("context", {})
        rag_citations = context_data.get("rag_citations", [])
        rag_context = context_data.get("rag_context", "")
        max_score = max([c.get("score", 0) for c in rag_citations]) if rag_citations else 0
        
        # Define Tiered Strategy Note
        if max_score >= 0.7:
            strategy_note = "HIGH SIMILARITY: Relevant information found. Delegate to Domain Expert to provide direct answers with citations."
        elif max_score >= 0.3:
            strategy_note = "MEDIUM SIMILARITY: Some related info found but not exact match. Discuss connections and suggest further exploration."
        else:
            strategy_note = "LOW SIMILARITY: No relevant match in documents. Use Socratic Tutor to guide the student's independent thinking."

        # Identify available sub-agents for the prompt
        agents_desc = "\n".join([f"- {sa['name']}: {sa['description']}" for sa in subagents])
        
        supervisor_prompt = f"""{system_prompt}

You are the Deep Agent Supervisor. 
RAG Analysis: {strategy_note}
Retrieved Context: {rag_context}

Manage the conversation using the available Sub-Agents:
{agents_desc}

Current Plan: {plan}

Tiered Response Policy:
- If High Similarity: Use Domain Expert. Mention you found specific info in project docs.
- If Medium Similarity: Connect the query to the partial info found.
- If Low Similarity: Do NOT make up facts. Use Socratic Tutor to facilitate discovery.

Analyze the latest user message.
1. Update the Plan if necessary.
2. Delegate the next task to a Sub-Agent based on the RAG Analysis.
3. If the task is strictly planning or general chat, reply directly.

Response Format (JSON):
{{{{
    "next_step": "sub_agent_name" OR "FINISH",
    "updated_plan": ["step1", "step2"],
    "instruction": "Instructions for the sub-agent including how to use the provided Context"
}}}}
"""
        prompt = ChatPromptTemplate.from_messages([
            ("system", supervisor_prompt),
            MessagesPlaceholder(variable_name="messages")
        ])
        
        chain = prompt | model.bind(response_format={"type": "json_object"}) | JsonOutputParser()
        
        try:
            # Use limited context window interaction
            result = await chain.ainvoke({"messages": messages[-3:]})
            next_step = result.get("next_step", "FINISH")
            state_update = {
                "next_step": next_step,
                "plan": result.get("updated_plan", plan),
                "scratchpad": result.get("instruction", "")
            }
        except Exception as e:
            # Fallback
            print(f"!!! SUPERVISOR ERROR: {e}")
            state_update = {"next_step": "FINISH", "plan": plan}
            
        return state_update

    # 2. Define Sub-Agent Nodes (The Executors)
    def sub_agent_node_factory(agent_def: Dict[str, Any]):
        name = agent_def["name"]
        prompt_text = agent_def["system_prompt"]
        
        async def _node(state: DeepAgentState):
            messages = state["messages"]
            instruction = state.get("scratchpad", "")
            
            # Context Quarantine: Sub-agents see limited history + specific instruction
            rag_context = state.get("context", {}).get("rag_context", "")
            
            full_prompt = f"""{prompt_text}
            
Supervisor Instruction: {instruction}

Relevant Context for your use (Cite if using):
{rag_context}
"""
            msg_prompt = ChatPromptTemplate.from_messages([
                ("system", full_prompt),
                # Accessing only the last user message + potentially critical context
                ("human", "{input}") 
            ])
            
            chain = msg_prompt | model
            
            # Simple interaction: Instruction + Last User Msg
            last_human = messages[-1].content if messages else ""
            response = await chain.ainvoke({"input": last_human})
            
            return {"messages": [response]}
            
        return _node

    # 3. Build Graph
    workflow = StateGraph(DeepAgentState)
    
    workflow.add_node("supervisor", supervisor_node)
    
    # Map for routing
    routing_map = {"FINISH": END}
    
    for sa in subagents:
        node_func = sub_agent_node_factory(sa) # Valid synchronous call
        workflow.add_node(sa["name"], node_func)
        workflow.add_edge(sa["name"], END)
        routing_map[sa["name"]] = sa["name"]
    
    workflow.set_entry_point("supervisor")
    
    workflow.add_conditional_edges(
        "supervisor",
        lambda x: x["next_step"],
        routing_map
    )
    
    return workflow.compile()
