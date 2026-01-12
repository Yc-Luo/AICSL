"""FastAPI application entry point."""

import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, WebSocket, Query
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

from app.api.v1 import (
    auth,
    users,
    projects,
    storage,
    courses,
    tasks,
    calendar,
    documents,
    comments,
    collaboration,
    chat,
    analytics,
    ai,
    web_annotations,
    admin,
    inquiry,
    rag,
    agents,
)
from app.core.cache import close_redis_client, get_redis_client
from app.core.config import settings
from app.core.error_handlers import setup_error_handlers
from app.core.logging_config import setup_logging
from app.core.monitoring import metrics_endpoint, track_request_metrics
from app.core.security import setup_rate_limiting, get_csp_header
from app.core.db.mongodb import mongodb
from app.websocket.socketio_server import socketio_app
from app.websocket.yjs_server import websocket_endpoint
from app.core.tasks import run_periodic_updates
import asyncio


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    setup_logging()  # Setup logging first
    await mongodb.connect()
    await get_redis_client()  # Initialize Redis connection
    
    # Initialize default agents
    from app.repositories.agent_config import initialize_default_agents
    await initialize_default_agents()
    
    # Start background tasks
    update_task = asyncio.create_task(run_periodic_updates())
    
    yield
    
    # Shutdown
    update_task.cancel()
    try:
        await update_task
    except asyncio.CancelledError:
        pass
        
    await close_redis_client()
    await mongodb.disconnect()


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="""
    AI-Enhanced Collaborative Learning System API

    ## Overview
    This API provides comprehensive backend services for a real-time collaborative learning platform
    that integrates AI-powered assistance with multi-modal collaboration tools.

    ## Key Features
    - **Real-time Collaboration**: Y.js and Socket.IO powered collaborative editing
    - **AI Integration**: OpenAI GPT models for intelligent assistance
    - **Multi-modal Content**: Whiteboards, documents, resources, and web annotations
    - **Role-based Access Control**: Student, Teacher, and Admin roles
    - **Analytics & Monitoring**: Comprehensive usage analytics and performance metrics

    ## Authentication
    All API endpoints (except health checks) require JWT authentication.
    Include the JWT token in the Authorization header: `Bearer <token>`

    ## Real-time Communication
    - **WebSocket**: `/ysocket/{room_name}` for collaborative editing
    - **Socket.IO**: `/socket.io/` for chat and real-time notifications

    ## Rate Limiting
    API requests are rate-limited. Check response headers for limit status.

    ## Error Handling
    - `400`: Bad Request - Invalid input parameters
    - `401`: Unauthorized - Missing or invalid authentication
    - `403`: Forbidden - Insufficient permissions
    - `404`: Not Found - Resource doesn't exist
    - `429`: Too Many Requests - Rate limit exceeded
    - `500`: Internal Server Error - Server-side error
    """,
    contact={
        "name": "AICSL Development Team",
        "email": "support@aicsl.com",
    },
    license_info={
        "name": "MIT",
    },
    lifespan=lifespan,
)

# Setup rate limiting
app = setup_rate_limiting(app)

# Setup global error handlers
setup_error_handlers(app)

# CORS middleware - more restrictive configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=86400,
)

# Prometheus metrics
Instrumentator().instrument(app).expose(app)

# Request monitoring middleware with slow request logging
@app.middleware("http")
async def monitor_requests(request: Request, call_next):
    """Monitor HTTP requests and log slow requests."""
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    duration_ms = duration * 1000

    await track_request_metrics(request, response, duration)
    
    # Log slow requests (threshold: 1 second)
    SLOW_REQUEST_THRESHOLD_MS = 1000
    if duration_ms > SLOW_REQUEST_THRESHOLD_MS:
        from app.core.logging_config import get_logger
        logger = get_logger("slow_requests")
        logger.warning(
            "Slow request detected | %s %s | %.2fms | status=%d",
            request.method,
            request.url.path,
            duration_ms,
            response.status_code,
        )
    
    # Add timing header for debugging
    response.headers["X-Request-Duration-Ms"] = f"{duration_ms:.2f}"
    
    return response

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers to responses."""
    response = await call_next(request)

    # Basic security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    # Content Security Policy
    response.headers["Content-Security-Policy"] = get_csp_header()

    # HTTPS Strict Transport Security (only for HTTPS)
    if request.url.scheme == "https":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"

    # Remove server header for security
    try:
        del response.headers["Server"]
    except KeyError:
        pass

    return response

# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(projects.router, prefix="/api/v1")
app.include_router(storage.router, prefix="/api/v1")
app.include_router(courses.router, prefix="/api/v1")
app.include_router(tasks.router, prefix="/api/v1")
app.include_router(calendar.router, prefix="/api/v1")
app.include_router(documents.router, prefix="/api/v1")
app.include_router(comments.router, prefix="/api/v1")
app.include_router(collaboration.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")
app.include_router(web_annotations.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(inquiry.router, prefix="/api/v1")
app.include_router(rag.router, prefix="/api/v1")
app.include_router(agents.router, prefix="/api/v1")

# Mount Socket.IO app
app.mount("/socket.io", socketio_app)

# Test WebSocket endpoint for debugging
@app.websocket("/ws/test")
async def test_ws(websocket: WebSocket):
    print("=== TEST WEBSOCKET HIT ===")
    await websocket.accept()
    await websocket.send_text("Hello from test endpoint!")
    await websocket.close()

# Y.js WebSocket endpoint - using decorator pattern
@app.websocket("/ysocket/{room_name:path}")
async def ysocket_route(websocket: WebSocket, room_name: str, token: str = Query(None)):
    print(f"=== YSOCKET ROUTE HIT: room_name={room_name}, token={token[:20] if token else None}...")
    await websocket_endpoint(websocket, room_name, token)


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "AICSL API", "version": "1.0.0"}


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.get("/metrics")
async def get_metrics():
    """Prometheus metrics endpoint."""
    return await metrics_endpoint()

