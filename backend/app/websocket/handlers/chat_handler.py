import logging
# from app.repositories.chat_log import ChatLog # Avoid circular imports if any, but should be fine
# Dynamic import inside function is safer if we are not sure about initialization order
import datetime
import asyncio
import uuid

logger = logging.getLogger(__name__)

async def _process_ai_reply(sio, room_id, project_id, user_content, session_id):
    """Process AI response in background and broadcast."""
    try:
        from app.services.agents.agent_service import agent_service
        from app.repositories.chat_log import ChatLog
        from app.services.activity_service import activity_service
        
        # Emit typing event
        await sio.emit('typing', {
            'roomId': room_id,
            'userId': 'ai_assistant',
            'username': 'AICSL智能助手'
        }, room=room_id)

        # Accumulate response
        full_response = ""
        # Using project_id as session_id for continuity within the project
        async for chunk in agent_service.chat_stream(
            persona_key="supervisor", # Entry point
            message=user_content,
            session_id=session_id
        ):
            full_response += chunk

        # Emit stop_typing event
        await sio.emit('stop_typing', {
            'roomId': room_id,
            'userId': 'ai_assistant'
        }, room=room_id)

        if not full_response:
            return

        # Create AI message payload
        ai_user_id = "ai_assistant"
        message_id = str(uuid.uuid4())
        
        # Save to DB
        chat_log = ChatLog(
            project_id=project_id,
            user_id=ai_user_id,
            content=full_response,
            message_type="text",
            mentions=[]
        )
        await chat_log.insert()
        
        # Log activity
        await activity_service.log_activity(
            project_id=project_id,
            user_id=ai_user_id,
            module="chat",
            action="reply",
            metadata={"length": len(full_response)}
        )
        
        # Broadcast
        timestamp = datetime.datetime.utcnow().isoformat()
        response_op = {
            "id": str(uuid.uuid4()),
            "module": "chat",
            "roomId": room_id,
            "type": "message",
            "clientId": ai_user_id,  # Required by frontend ChatAdapter
            "data": {
                "messageId": message_id,
                "content": full_response,
                "mentions": [],
                "sender": {
                    "id": ai_user_id,
                    "username": "AICSL智能助手",
                    "avatar": "/avatars/ai_assistant.png"
                }
            },
            "timestamp": timestamp
        }
        
        await sio.emit("operation", response_op, room=room_id)
        
    except Exception as e:
        logger.error(f"Error processing AI reply: {e}")

async def handle_chat_op(sio, sid, data, user_id):
    """
    Handle chat operation.
    data (Operation): {
        "id": "...",
        "module": "chat",
        "roomId": "...",
        "type": "message",
        "data": { // ChatOperationData
            "messageId": "...",
            "content": "...",
            "mentions": []
        },
        "timestamp": ...
    }
    """
    room_id = data.get("roomId")
    op_type = data.get("type")
    op_payload = data.get("data", {})
    
    if not room_id or not op_payload:
        return

    if op_type == "message":
        content = op_payload.get("content")
        # Allow empty content? Usually no.
        if not content:
            return

        try:
            # Resolve Project ID
            # Assuming roomId format "project:ID" or just "ID" (from ChatAdapter adapter logic)
            # In useChatSync: roomId = `project:${projectId}`.
            parts = room_id.split(':')
            project_id = parts[-1]
            
            # Dynamic import to avoid potential circular dependencies at module level
            from app.repositories.chat_log import ChatLog
            
            chat_log = ChatLog(
                project_id=project_id,
                user_id=user_id,
                content=content,
                message_type="text",
                mentions=op_payload.get("mentions", [])
            )
            await chat_log.insert()
            
            # Log as activity for dashboard/dynamics
            from app.services.activity_service import activity_service
            await activity_service.log_activity(
                project_id=project_id,
                user_id=user_id,
                module="chat",
                action="send",
                metadata={"length": len(content)}
            )
            
            # Get sender info for richer broadcast
            from app.repositories.user import User
            sender = await User.get(user_id)
            if sender:
                if "data" not in data:
                    data["data"] = {}
                data["data"]["sender"] = {
                    "id": user_id,
                    "username": sender.username,
                    "avatar": sender.avatar_url
                }

            # Broadcast operation
            await sio.emit("operation", data, room=room_id, skip_sid=sid)
            
            # Check for AI Mentions
            # 1. Structured mentions
            mentions = op_payload.get("mentions", [])
            is_ai_mentioned = any(m.get("id") == "ai_assistant" for m in mentions)
            
            # 2. Heuristic text check (for testing or direct typing)
            ai_keywords = ["@资料研究员", "@学习协调者", "@内容总结者", "@批判思考者", "@AICSL", "@AI", "@智能助手"]
            if not is_ai_mentioned and any(k in content for k in ai_keywords):
                is_ai_mentioned = True
                
            if is_ai_mentioned:
                # Trigger AI response in background
                # Use project_id as session_id to maintain context
                asyncio.create_task(_process_ai_reply(sio, room_id, project_id, content, project_id))
            
        except Exception as e:
            logger.error(f"Error handling chat op for {room_id}: {e}")
