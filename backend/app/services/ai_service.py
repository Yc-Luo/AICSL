"""AI service for chat and conversation management."""


from typing import AsyncIterator, List, Optional
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

import tiktoken
from app.core.llm_config import get_llm, get_llm_for_role
from app.repositories.ai_conversation import AIConversation
from app.repositories.ai_message import AIMessage as AIMessageModel
from app.repositories.ai_role import AIRole


class AIService:
    """Service for AI chat and conversation."""

    # Token budget configuration
    MAX_CONTEXT_TOKENS = 8000  # Maximum context tokens
    MAX_RESPONSE_TOKENS = 2000  # Maximum response tokens
    TOKEN_BUDGET_PER_USER = 100000  # Daily token budget per user

    @staticmethod
    def estimate_tokens(text: str) -> int:
        """Estimate token count using tiktoken."""
        try:
            encoding = tiktoken.encoding_for_model("gpt-4")
            return len(encoding.encode(text))
        except Exception:
            # Fallback: rough estimate (1 token ≈ 4 characters)
            return len(text) // 4

    @staticmethod
    def truncate_context(messages: List, max_tokens: int) -> List:
        """Truncate context to fit within token budget."""
        total_tokens = sum(
            AIService.estimate_tokens(str(msg.content)) for msg in messages
        )

        if total_tokens <= max_tokens:
            return messages

        # Remove oldest messages first (except system message)
        truncated = [messages[0]]  # Keep system message
        remaining_tokens = max_tokens - AIService.estimate_tokens(str(messages[0].content))

        for msg in reversed(messages[1:]):
            msg_tokens = AIService.estimate_tokens(str(msg.content))
            if msg_tokens <= remaining_tokens:
                truncated.insert(1, msg)
                remaining_tokens -= msg_tokens
            else:
                break

        return truncated

    @staticmethod
    async def generate_followup_suggestions(message: str) -> List[str]:
        """Generate 3 follow-up questions based on the AI response."""
        try:
            llm = await get_llm(temperature=0.7)
            prompt = f"""Based on this AI response, generate 3 short, relevant follow-up questions that a student might ask to deepen their understanding. 
Response: "{message}"
Format: Return exactly 3 lines, one question per line. No numbers, no extra text."""
            
            response = await llm.ainvoke(prompt)
            content = response.content if hasattr(response, "content") else str(response)
            suggestions = [s.strip() for s in content.split("\n") if s.strip()][:3]
            return suggestions
        except Exception as e:
            print(f"Suggestion Error: {e}")
            return []

    @staticmethod
    async def generate_conversation_title(message: str) -> str:
        """Generate a short title for the conversation based on the first message."""
        try:
            llm = await get_llm(temperature=0)
            prompt = f"""请根据以下用户发送的第一条对话内容，生成一个非常简短、精准的中文标题（不超过10个字）。
内容: "{message}"
注意：只返回标题文字，不要包含引号、书名号或多余的解释。"""
            
            response = await llm.ainvoke(prompt)
            title = response.content if hasattr(response, "content") else str(response)
            # Basic cleanup
            title = title.strip().replace('"', '').replace('“', '').replace('”', '').replace('《', '').replace('》', '')
            if len(title) > 20: # Safety truncation
                title = title[:17] + "..."
            return title
        except Exception as e:
            print(f"Title Generation Error: {e}")
            return "新对话"

    @staticmethod
    async def get_default_role() -> Optional[AIRole]:
        """Get default AI role."""
        role = await AIRole.find_one(AIRole.is_default == True)
        if not role:
            # Return first role if no default
            role = await AIRole.find_one()
        return role

    @staticmethod
    async def get_role(role_id: str) -> Optional[AIRole]:
        """Get AI role by ID."""
        if not role_id:
            return None
        
        # Handle special string IDs
        if role_id in ["default", "default-tutor"]:
            return await AIService.get_default_role()

        try:
            return await AIRole.get(role_id)
        except Exception:
            # Handle non-ObjectId strings (e.g., "default", "default-tutor")
            return None

    @staticmethod
    async def chat(
        project_id: str,
        user_id: str,
        message: str,
        role_id: Optional[str] = None,
        conversation_id: Optional[str] = None,
        context: Optional[dict] = None,
        system_message_override: Optional[str] = None,
        category: str = "chat",
    ) -> dict:
        """Non-streaming chat with AI.

        Args:
            project_id: Project ID
            user_id: User ID
            message: User message
            role_id: Optional AI role ID
            conversation_id: Optional conversation ID (for continuing conversation)
            context: Optional context (e.g., RAG results)
            system_message_override: Optional system prompt override

        Returns:
            Response dict with message and conversation_id
        """
        # Get or create conversation
        if conversation_id:
            conversation = await AIConversation.get(conversation_id)
            if not conversation:
                raise ValueError("Conversation not found")
        else:
            # Get AI role
            if role_id:
                role = await AIService.get_role(role_id)
            else:
                role = await AIService.get_default_role()

            if not role:
                raise ValueError("No AI role available")

            # Create new conversation
            conversation = AIConversation(
                project_id=project_id,
                user_id=user_id,
                persona_id=str(role.id),
                category=category,
            )
            await conversation.insert()

        # Get role
        # Fix: handle role aliases correctly
        role_id = conversation.persona_id
        if role_id in ["default", "default-tutor"]:
             role = await AIService.get_default_role()
        else:
             role = await AIService.get_role(role_id)
             
        if not role:
            # Last ditch attempt: force get first role
            role = await AIRole.find_one()
            
        if not role:
            print(f"[ERROR] AIService.chat failed to find role. Conversation ID: {conversation_id}, Persona ID from DB: {role_id}")
            # List all roles for debugging
            all_roles = await AIRole.find().to_list()
            print(f"[DEBUG] Available roles in DB: {[r.name for r in all_roles]}")
            raise ValueError(f"No AI role available (Requested: {role_id})")

        # Get conversation history
        history = await AIMessageModel.find(
            {"conversation_id": str(conversation.id)}
        ).sort("created_at").to_list()

        # Update title if this is the first real exchange
        if len(history) == 0:
            new_title = await AIService.generate_conversation_title(message)
            conversation.title = new_title
            await conversation.save()

        # Build messages
        sys_prompt = system_message_override if system_message_override else role.system_prompt
        messages = [SystemMessage(content=sys_prompt)]
        for msg in history:
            if msg.role == "user":
                messages.append(HumanMessage(content=msg.content))
            else:
                messages.append(AIMessage(content=msg.content))
        messages.append(HumanMessage(content=message))

        # Add context if provided
        if context:
            context_text = "\n\nContext:\n" + str(context)
            messages[-1] = HumanMessage(content=message + context_text)

        # Get LLM
        llm = await get_llm_for_role(role.name, role.temperature)

        # Generate response
        response = await llm.ainvoke(messages)

        # Save messages
        user_message = AIMessageModel(
            conversation_id=str(conversation.id),
            role="user",
            content=message,
        )
        await user_message.insert()

        ai_message = AIMessageModel(
            conversation_id=str(conversation.id),
            role="assistant",
            content=response.content if hasattr(response, "content") else str(response),
            citations=context.get("citations", []) if context else [],
        )
        await ai_message.insert()

        # Generate dynamic suggestions
        suggestions = await AIService.generate_followup_suggestions(
            response.content if hasattr(response, "content") else str(response)
        )

        return {
            "conversation_id": str(conversation.id),
            "message": response.content if hasattr(response, "content") else str(response),
            "citations": context.get("citations", []) if context else [],
            "suggestions": suggestions,
        }

    @staticmethod
    async def chat_stream(
        project_id: str,
        user_id: str,
        message: str,
        role_id: Optional[str] = None,
        conversation_id: Optional[str] = None,
        context: Optional[dict] = None,
        system_message_override: Optional[str] = None,
        category: str = "chat",
    ) -> AsyncIterator[str]:
        """Streaming chat with AI.

        Args:
            project_id: Project ID
            user_id: User ID
            message: User message
            role_id: Optional AI role ID
            conversation_id: Optional conversation ID
            context: Optional context
            system_message_override: Optional system prompt override

        Yields:
            Response chunks
        """
        # Get or create conversation
        if conversation_id:
            conversation = await AIConversation.get(conversation_id)
            if not conversation:
                raise ValueError("Conversation not found")
        else:
            if role_id:
                role = await AIService.get_role(role_id)
            else:
                role = await AIService.get_default_role()

            if not role:
                raise ValueError("No AI role available")

            conversation = AIConversation(
                project_id=project_id,
                user_id=user_id,
                persona_id=str(role.id),
                category=category,
            )
            await conversation.insert()

        # Get role
        role = await AIService.get_role(conversation.persona_id)
        if not role:
            role = await AIService.get_default_role()
            
        if not role:
            raise ValueError("No AI role available")

        # Get conversation history
        history = await AIMessageModel.find(
            {"conversation_id": str(conversation.id)}
        ).sort("created_at").to_list()

        # Update title if this is the first real exchange
        if len(history) == 0:
            new_title = await AIService.generate_conversation_title(message)
            conversation.title = new_title
            await conversation.save()

        # Build messages
        sys_prompt = system_message_override if system_message_override else role.system_prompt
        messages = [SystemMessage(content=sys_prompt)]
        for msg in history:
            if msg.role == "user":
                messages.append(HumanMessage(content=msg.content))
            else:
                messages.append(AIMessage(content=msg.content))
        messages.append(HumanMessage(content=message))

        # Add context if provided
        if context:
            context_text = "\n\nContext:\n" + str(context)
            messages[-1] = HumanMessage(content=message + context_text)

        # Get LLM
        llm = await get_llm_for_role(role.name, role.temperature)

        # Save user message
        user_message = AIMessageModel(
            conversation_id=str(conversation.id),
            role="user",
            content=message,
        )
        await user_message.insert()

        # Stream response
        full_response = ""
        async for chunk in llm.astream(messages):
            content = chunk.content if hasattr(chunk, "content") else str(chunk)
            full_response += content
            yield content

        # Save AI message
        ai_message = AIMessageModel(
            conversation_id=str(conversation.id),
            role="assistant",
            content=full_response,
            citations=context.get("citations", []) if context else [],
        )
        await ai_message.insert()


ai_service = AIService()
