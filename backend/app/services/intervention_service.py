"""AI intervention service for automatic AI interventions."""

from typing import List, Optional

from app.repositories.ai_intervention_rule import AIInterventionRule
from app.services.ai_service import ai_service


class InterventionService:
    """Service for AI automatic interventions."""

    @staticmethod
    async def check_interventions(
        project_id: str,
        user_id: str,
        context: dict,
    ) -> List[dict]:
        """Check if any intervention rules should be triggered.

        Args:
            project_id: Project ID
            user_id: User ID
            context: Context dict with:
                - last_message_time: Timestamp of last message
                - recent_messages: List of recent messages
                - user_activity: User activity data

        Returns:
            List of intervention actions to take
        """
        # Get applicable rules (project-specific and global)
        rules = await AIInterventionRule.find(
            {
                "$or": [
                    {"project_id": project_id, "enabled": True},
                    {"project_id": None, "enabled": True},  # Global rules
                ]
            }
        ).sort("-priority").to_list()

        interventions = []

        for rule in rules:
            should_trigger = False

            # Check rule conditions
            if rule.rule_type == "silence":
                if rule.silence_threshold:
                    last_message_time = context.get("last_message_time")
                    if last_message_time:
                        from datetime import datetime

                        silence_duration = (
                            datetime.utcnow() - last_message_time
                        ).total_seconds()
                        if silence_duration >= rule.silence_threshold:
                            should_trigger = True

            elif rule.rule_type == "emotion":
                if rule.emotion_keywords:
                    recent_messages = context.get("recent_messages", [])
                    for msg in recent_messages:
                        content = msg.get("content", "").lower()
                        if any(
                            keyword.lower() in content
                            for keyword in rule.emotion_keywords
                        ):
                            should_trigger = True
                            break

            elif rule.rule_type == "keyword":
                if rule.trigger_keywords:
                    recent_messages = context.get("recent_messages", [])
                    for msg in recent_messages:
                        content = msg.get("content", "").lower()
                        if any(
                            keyword.lower() in content
                            for keyword in rule.trigger_keywords
                        ):
                            should_trigger = True
                            break

            elif rule.rule_type == "custom":
                # Evaluate custom condition using simple rule expressions
                # Supports conditions like: "activity_count > 5" or "message_count < 3"
                should_trigger = InterventionService._evaluate_custom_condition(
                    rule.custom_condition, context
                )

            if should_trigger:
                # Generate intervention message
                intervention = {
                    "rule_id": str(rule.id),
                    "rule_name": rule.name,
                    "action_type": rule.action_type,
                    "message": rule.message_template,
                    "ai_role_id": rule.ai_role_id,
                }
                interventions.append(intervention)

        return interventions

    @staticmethod
    async def execute_intervention(
        project_id: str,
        user_id: str,
        intervention: dict,
    ) -> dict:
        """Execute an intervention action.

        Args:
            project_id: Project ID
            user_id: User ID
            intervention: Intervention dict from check_interventions

        Returns:
            Intervention result
        """
        # Use AI to generate personalized message if needed
        if intervention.get("ai_role_id"):
            # Generate AI response
            response = await ai_service.chat(
                project_id=project_id,
                user_id="system",  # System-initiated
                message=intervention["message"],
                role_id=intervention["ai_role_id"],
            )

            return {
                "type": intervention["action_type"],
                "message": response["message"],
                "conversation_id": response["conversation_id"],
            }
        else:
            return {
                "type": intervention["action_type"],
                "message": intervention["message"],
            }

    @staticmethod
    def _evaluate_custom_condition(condition: Optional[str], context: dict) -> bool:
        """Evaluate a custom condition expression.
        
        Supports simple expressions like:
        - "activity_count > 5"
        - "message_count < 3"
        - "idle_time >= 300"
        
        Args:
            condition: Condition expression string
            context: Context dictionary with variable values
            
        Returns:
            True if condition is met, False otherwise
        """
        if not condition:
            return False
            
        import re
        
        # Parse simple comparison expression: "variable operator value"
        pattern = r'^(\w+)\s*(>=|<=|>|<|==|!=)\s*(\d+(?:\.\d+)?)$'
        match = re.match(pattern, condition.strip())
        
        if not match:
            # Invalid condition format
            return False
        
        variable, operator, value = match.groups()
        value = float(value)
        
        # Get variable value from context
        var_value = context.get(variable)
        if var_value is None:
            return False
        
        try:
            var_value = float(var_value)
        except (TypeError, ValueError):
            return False
        
        # Evaluate comparison
        operators = {
            '>': lambda a, b: a > b,
            '<': lambda a, b: a < b,
            '>=': lambda a, b: a >= b,
            '<=': lambda a, b: a <= b,
            '==': lambda a, b: a == b,
            '!=': lambda a, b: a != b,
        }
        
        return operators[operator](var_value, value)


intervention_service = InterventionService()
