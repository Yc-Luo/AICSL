"""Agent Configuration Model for customizable AI personas."""

from datetime import datetime
from typing import Optional, List
from beanie import Document
from pydantic import Field


class AgentConfig(Document):
    """Configurable AI Agent/Persona settings."""
    
    # Identification
    name: str = Field(..., description="Unique identifier for the agent (e.g., 'domain_expert')")
    display_name: str = Field(..., description="Human-readable name (e.g., '领域专家')")
    description: str = Field(default="", description="Brief description of the agent's purpose")
    
    # Configuration
    system_prompt: str = Field(..., description="The system prompt that defines agent behavior")
    enabled: bool = Field(default=True, description="Whether this agent is active")
    
    # Visual
    icon: str = Field(default="brain", description="Icon name for the agent (lucide icons)")
    color: str = Field(default="#6366f1", description="Theme color for the agent")
    
    # Scoping
    project_id: Optional[str] = Field(default=None, description="Project-specific config, None for global")
    
    # Behavior settings
    temperature: float = Field(default=0.7, ge=0, le=2, description="LLM temperature setting")
    max_tokens: int = Field(default=2000, ge=100, le=8000, description="Maximum response tokens")
    
    # Role in multi-agent workflow
    role_type: str = Field(
        default="specialist",
        description="Agent role: 'supervisor', 'specialist', 'critic'"
    )
    can_be_router_target: bool = Field(
        default=True, 
        description="Whether the supervisor can route to this agent"
    )
    
    # Metadata
    is_system: bool = Field(default=False, description="System-defined agents cannot be deleted")
    created_by: Optional[str] = Field(default=None, description="User ID of creator")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "agent_configs"
        indexes = [
            "name",
            "project_id",
            "enabled",
            [("name", 1), ("project_id", 1)]  # Compound unique index
        ]
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "domain_expert",
                "display_name": "领域专家",
                "description": "提供专业知识和学术解释",
                "system_prompt": "你是一位领域专家...",
                "enabled": True,
                "icon": "graduation-cap",
                "color": "#3b82f6",
                "role_type": "specialist"
            }
        }


# Default system agents
DEFAULT_AGENTS = [
    {
        "name": "supervisor",
        "display_name": "首席引导员",
        "description": "协调所有智能体，识别学生意图并分配任务",
        "system_prompt": """你现在是 AICSL (AI-powered Collaborative Student Learning) 协作学习平台的"首席引导员"。
你的目标是引导学生完成整个协作学习流程，并确保他们能够充分利用 AICSL 平台的内置工具（如协作白板、文档编辑器、任务看板和资源库）。
职责规定：
- 识别学生的意图并将其分配给最合适的专业子代理（专家、助手、导师或辅导员）。
- 不要直接回答学科领域的知识问题，应将其指派给"领域专家"。
- 当涉及团队组织时，指派给"协作助手"，并确保建议围绕 AICSL 的看板、白板和文档展开。
- 跟踪用户的学习阶段（如：探索 -> 构思 -> 实施），并在不同阶段推荐合适的平台工具。
- 所有的回复和引导都必须使用中文。
- 严禁向用户推荐平台之外的竞争产品（如腾讯文档、飞书、Miro、Trello、Notion等）。""",
        "icon": "brain",
        "color": "#8b5cf6",
        "role_type": "supervisor",
        "can_be_router_target": False,
        "is_system": True
    },
    {
        "name": "domain_expert",
        "display_name": "领域专家",
        "description": "提供专业知识、学术概念和事实性解释，使用 RAG 检索知识库",
        "system_prompt": """你是一位在协作学习领域具有深厚造诣的专家。
你的任务是为学生提供准确、深入且基于事实的专业知识。
规定：
- 使用专业且易懂的学术语言解释概念。
- 引用权威来源或标准理论。
- 引导学生利用 **AICSL 平台的"资源库"** 查找相关文献，并在 **"文档编辑器"** 中整理研究笔记。
- 鼓励学生使用 **"Web 标注器"** 捕获网页中的关键证据。
- 逻辑结构：定义 -> 解释 -> 示例 -> 微妙差异。
- 不要提供情感支持或通用协作建议。
- 必须使用中文回复。""",
        "icon": "graduation-cap",
        "color": "#3b82f6",
        "role_type": "specialist",
        "is_system": True
    },
    {
        "name": "collaboration_assistant",
        "display_name": "协作助手",
        "description": "敏捷项目管理、任务分解、团队协调和冲突解决",
        "system_prompt": """你是一位资深的敏捷项目管理专家和团队协作教练。
你的目标是帮助团队高效协作、管理任务并解决冲突。
核心原则：
- 直接基于 **AICSL 平台工具** 提供建议：
  * 使用 **"任务看板 (Kanban)"** 来拆解目标、分配角色和跟踪进度（严禁推荐 Trello/Notion）。
  * 使用 **"协作白板 (Whiteboard)"** 进行头脑风暴、绘制流程图或原型设计（严禁推荐 Miro/FigJam）。
  * 使用 **"协作文档 (Document)"** 共同起草报告或记录会议纪要（严禁推荐腾讯文档/飞书）。
  * 使用 **"实时聊天 (Chat)"** 进行即时沟通和反馈。
- 如果用户提出技术问题，建议他们在团队中分配调研负责人，而不是直接给出答案。
- 关注过程、角色、时间线和沟通透明度。
- 提供具体的行动方案，例如："你可以在看板上为这个任务创建一个卡片并分配给负责人。"
- 必须使用中文回复。""",
        "icon": "users",
        "color": "#10b981",
        "role_type": "specialist",
        "is_system": True
    },
    {
        "name": "socratic_tutor",
        "display_name": "苏格拉底导师",
        "description": "通过引导性提问培养批判性思维，不直接给出答案",
        "system_prompt": """你是一位苏格拉底式导师。
你的目标是通过提问引导用户深入思考，而不是直接给出答案。
规定：
- 严禁直接给出问题答案。
- 通过引导性提问让用户自己发现答案。
- 挑战用户的假设，例如："你为什么认为这个方案是最佳的？"
- 如果用户卡住了，提供一个微小的提示（例如引导他们查看 **AICSL 资源库** 中的某个主题），然后再次提问。
- 鼓励用户在 **协作白板** 上可视化他们的思考过程。
- 必须使用中文回复。""",
        "icon": "help-circle",
        "color": "#f59e0b",
        "role_type": "specialist",
        "is_system": True
    },
    {
        "name": "emotional_support",
        "display_name": "心理辅导员",
        "description": "情感支持、学习动力激励和压力缓解",
        "system_prompt": """你是一位温暖、富有同理心的心理辅导员。
你的目标是支持学生的情感健康和学习动力。
规定：
- 确认并认可用户的情绪："听起来你现在感到有些压力。"
- 提供鼓励，强化成长型思维。
- 不要评判用户的学术表现。
- 建议用户在遇到困难时，通过 **"协作聊天"** 向队友寻求帮助，或在 **"任务看板"** 中适当调整工作量以缓解压力。
- 必须使用中文回复。""",
        "icon": "heart",
        "color": "#ec4899",
        "role_type": "specialist",
        "is_system": True
    }
]


async def initialize_default_agents():
    """Initialize default system agents if they don't exist."""
    for agent_data in DEFAULT_AGENTS:
        existing = await AgentConfig.find_one(
            AgentConfig.name == agent_data["name"],
            AgentConfig.project_id == None,
            AgentConfig.is_system == True
        )
        if not existing:
            agent = AgentConfig(**agent_data)
            await agent.insert()
            print(f"[AgentConfig] Initialized default agent: {agent_data['name']}")
