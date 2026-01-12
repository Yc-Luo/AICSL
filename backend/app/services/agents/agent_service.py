"""Agent Service using LangGraph and Deep Agents Shim."""

import json
from typing import Dict, Any, AsyncGenerator

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from langgraph.graph import END

from app.core.config import settings
from app.core.prompts.personas import PERSONAS
from app.services.agents.state import AgentState
from app.core.llm_config import get_llm
from app.services.rag_service import rag_service


class AgentService:
    """Service to manage AI Agents via LangGraph."""

    def __init__(self):
        """Initialize Graph state."""
        self.llm = None
        self.graph = None
        self._current_model_id = None

    async def initialize(self):
        """Async Initialization for the graph and LLM with hot-reload support."""
        # 1. Fetch latest model ID from DB
        try:
            from app.repositories.system_config import SystemConfig
            db_model = await SystemConfig.find_one(SystemConfig.key == "llm_model")
            latest_model_id = db_model.value if db_model else settings.OPENAI_MODEL
        except Exception:
            latest_model_id = settings.OPENAI_MODEL

        # 2. Check if we need to reload (Hot Update Logic)
        if not self.llm or self._current_model_id != latest_model_id:
            print(f"🔄 Detected model change or first init: {self._current_model_id} -> {latest_model_id}")
            self.llm = await get_llm(temperature=0.7)
            self._current_model_id = latest_model_id
            # Invalidation: Force graph rebuild
            self.graph = None

        # 3. Build graph if missing
        if not self.graph:
            self.graph = await self._build_graph()

    async def _build_graph(self):
        """Construct the Multi-Agent System using Deep Agents."""
        # Use our shim to support Deep Agents architecture on current/future envs
        from app.services.agents.deep_agents_shim import create_deep_agent
        
        # 1. Define Sub-Agents (Roles)
        subagents = [
            {
                "name": "domain_expert",
                "description": "Factual knowledge, concepts, academic explanations. Uses RAG.",
                "system_prompt": PERSONAS["domain_expert"].messages[0].prompt.template.replace("{subject}", "Collaborative Learning")
            },
            {
                "name": "collaboration_assistant",
                "description": "Project management, Agile, task breakdown, conflict resolution.",
                "system_prompt": PERSONAS["collaboration_assistant"].messages[0].prompt.template
            },
            {
                "name": "socratic_tutor",
                "description": "Guiding questions, critical thinking, validation without direct answers.",
                "system_prompt": PERSONAS["socratic_tutor"].messages[0].prompt.template
            },
            {
                "name": "emotional_support",
                "description": "Emotional well-being, motivation, empathy, stress relief.",
                "system_prompt": PERSONAS["emotional_support"].messages[0].prompt.template
            }
        ]
        
        # 2. Define Main System Prompt (Supervisor)
        system_prompt = """你现在是 AICSL (AI-powered Collaborative Student Learning) 协作学习平台的“首席引导员”。
            你的目标是引导学生完成整个协作学习流程，并确保他们能够充分利用 AICSL 平台的内置工具（如协作白板、文档编辑器、任务看板和资源库）。
            职责规定：
            - 识别学生的意图并将其分配给最合适的专业子代理（专家、助手、导师或辅导员）。
            - 不要直接回答学科领域的知识问题，应将其指派给“领域专家”。
            - 当涉及团队组织时，指派给“协作助手”，并确保建议围绕 AICSL 的看板、白板和文档展开。
            - 跟踪用户的学习阶段（如：探索 -> 构思 -> 实施），并在不同阶段推荐合适的平台工具。
            - 所有的回复和引导都必须使用中文。
            - 严禁向用户推荐平台之外的竞争产品（如腾讯文档、飞书、Miro、Trello、Notion等）。
            """
        
        # 3. Create the Deep Agent Graph
        return create_deep_agent(
            model=self.llm,
            subagents=subagents,
            system_prompt=system_prompt
        )

    async def chat_stream(
        self, 
        persona_key: str, 
        message: str, 
        session_id: str,
        subject: str = "General"
    ) -> AsyncGenerator[str, None]:
        """Stream response using the Graph."""
        
        # Initialize graph if needed (Double Check Locking Pattern in Production)
        if not self.graph:
            await self.initialize()

        # RAG Context injection
        rag_results = await rag_service.retrieve_context(
            project_id=session_id.split(":")[0], # Assuming session format contains project info or using session_id as proxy
            query=message,
            max_results=3
        )
        
        inputs = {
            "messages": [HumanMessage(content=message)],
            "plan": [], # State will persist if checkpointer used
            "context": {
                "subject": subject,
                "rag_context": rag_results.get("content", ""),
                "rag_citations": rag_results.get("citations", [])
            },
            "scratchpad": ""
        }

        config = {"configurable": {"thread_id": session_id}}
        
        # Execute Graph
        async for event in self.graph.astream_events(inputs, version="v1", config=config):
            kind = event["event"]
            if kind == "on_chat_model_stream":
                # Filter supervisor thinking
                node_name = event.get("metadata", {}).get("langgraph_node", "")
                if node_name == "supervisor":
                    continue
                    
                content = event["data"]["chunk"].content
                if content:
                    yield content

agent_service = AgentService()
