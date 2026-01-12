import sys
import os
from pathlib import Path

# Add backend directory to sys.path
sys.path.append(str(Path(__file__).parent.parent))

from app.core.config import settings
from app.core.llm_config import get_llm
from langchain_core.messages import HumanMessage

def test_llm():
    print(f"Testing LLM with Provider: {settings.AI_PROVIDER}")
    print(f"Model: {settings.DEEPSEEK_MODEL if settings.AI_PROVIDER == 'deepseek' else settings.OPENAI_MODEL}")
    print("-" * 30)
    
    try:
        llm = get_llm()
        messages = [HumanMessage(content="Hello, are you working? Please reply with 'Yes, I am functional.'")]
        response = llm.invoke(messages)
        
        print("\nResponse from LLM:")
        print(response.content)
        print("\n" + "-" * 30)
        print("✅ LLM Test Successful!")
        
    except Exception as e:
        print(f"\n❌ LLM Test Failed: {str(e)}")
        # Print some debug info (masking key)
        if settings.AI_PROVIDER == 'deepseek':
            key = settings.DEEPSEEK_API_KEY
            masked_key = f"{key[:4]}...{key[-4:]}" if key and len(key) > 8 else "Not Set or too short"
            print(f"Debug Info - API Key: {masked_key}")
            print(f"Debug Info - Base URL: {settings.DEEPSEEK_BASE_URL}")

if __name__ == "__main__":
    test_llm()
