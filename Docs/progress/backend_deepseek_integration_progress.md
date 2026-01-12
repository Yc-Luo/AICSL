# Backend DeepSeek Integration Progress

## Task Overview
Add support for DeepSeek Large Model API to the backend AI service. This allows the system to switch to DeepSeek as the underlying LLM provider.

## Implementation Details

### Configuration Updates
- **File**: `backend/app/core/config.py`
- **Changes**: Added new configuration variables regarding DeepSeek.
  - `DEEPSEEK_API_KEY`: API key for DeepSeek.
  - `DEEPSEEK_MODEL`: Model name (default: "deepseek-chat").
  - `DEEPSEEK_BASE_URL`: Base URL for API (default: "https://api.deepseek.com").

### LLM Service Updates
- **File**: `backend/app/core/llm_config.py`
- **Changes**: 
  - Updated `get_llm` and `get_llm_for_role` functions to support `AI_PROVIDER == "deepseek"`.
  - Uses `langchain_openai.ChatOpenAI` adapter with DeepSeek's base URL and API key.

## Status
- [x] Configuration added.
- [x] Logic implementation added.
- [x] Testing/Verification (Completed).

## Usage
To use DeepSeek:
1. Set `AI_PROVIDER=deepseek` in `.env`.
2. Set `DEEPSEEK_API_KEY=<your_api_key>` in `.env`.
