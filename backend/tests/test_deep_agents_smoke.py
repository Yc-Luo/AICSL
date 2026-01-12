import pytest
import asyncio
from app.services.agents.agent_service import agent_service
from langchain_core.messages import HumanMessage

@pytest.mark.asyncio
async def test_deep_agents_domain_expert_routing():
    """Test that Supervisor routes concept questions to Domain Expert."""
    # Ensure lazy init
    await agent_service.initialize()
    
    question = "什么是协作学习中的知识建构？"
    inputs = {
        "messages": [HumanMessage(content=question)],
        "plan": [],
        "scratchpad": ""
    }
    
    # We inspect the graph execution to verify routing
    # This is a white-box test
    route_happened = False
    response_content = ""
    
    config = {"configurable": {"thread_id": "test_session_domain"}}
    
    async for event in agent_service.graph.astream_events(inputs, version="v1", config=config):
        kind = event["event"]
        name = event.get("name", "")
        
        # Check if domain_expert node was entered
        if kind == "on_chain_start" and name == "domain_expert":
            route_happened = True
            
        # Collect response
        if kind == "on_chat_model_stream":
             node = event.get("metadata", {}).get("langgraph_node", "")
             if node == "domain_expert":
                 response_content += event["data"]["chunk"].content

    assert route_happened, "Supervisor failed to route to domain_expert"
    assert len(response_content) > 10, "Domain expert response too short"

@pytest.mark.asyncio
async def test_deep_agents_collaboration_routing():
    """Test that Supervisor routes project tasks to Collaboration Assistant."""
    await agent_service.initialize()
    
    question = "我们需要制定一个新的看板计划。"
    inputs = {
        "messages": [HumanMessage(content=question)],
        "plan": [],
        "scratchpad": ""
    }
    
    route_happened = False
    response_content = ""
    
    config = {"configurable": {"thread_id": "test_session_collab"}}
    
    async for event in agent_service.graph.astream_events(inputs, version="v1", config=config):
        kind = event["event"]
        name = event.get("name", "")
        
        if kind == "on_chain_start" and name == "collaboration_assistant":
            route_happened = True
            
        if kind == "on_chat_model_stream":
             node = event.get("metadata", {}).get("langgraph_node", "")
             if node == "collaboration_assistant":
                 response_content += event["data"]["chunk"].content

    assert route_happened, "Supervisor failed to route to collaboration_assistant"
    assert len(response_content) > 10, "Collaboration assistant response too short"
