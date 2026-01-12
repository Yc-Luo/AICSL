
## 2026-01-09: Whiteboard Module Removal and Collaboration Refactoring
- **Objective**: Removed unused Whiteboard functionality while preserving underlying collaboration infrastructure for Documents and Inquiry.
- **Actions**:
  - Removed  API, Service, Repository, and Handler files.
  - Cleaned up references in  and .
  - Refactored collaboration persistence into new  (backend/app/services/snapshot_service.py).
  - Created  (backend/app/websocket/handlers/collaboration_handler.py) for generic socket ops.
  - Updated  API to support saving/loading Yjs snapshots via  field.
  - Updated Frontend  to use Document API directly.
- **Outcome**: The codebase is cleaner with Whiteboard removed, but Document and Inquiry collaboration remains fully functional via the refactored shared services.

## 2026-01-09: Whiteboard Module Removal and Collaboration Refactoring
- **Objective**: Removed unused Whiteboard functionality while preserving underlying collaboration infrastructure for Documents and Inquiry.
- **Actions**:
  - Removed `whiteboard` API, Service, Repository, and Handler files.
  - Cleaned up references in `main.py` and `mongodb.py`.
  - Refactored collaboration persistence into new `SnapshotService` (backend/app/services/snapshot_service.py).
  - Created `CollaborationHandler` (backend/app/websocket/handlers/collaboration_handler.py) for generic socket ops.
  - Updated `Document` API to support saving/loading Yjs snapshots via `content_state` field.
  - Updated Frontend `documentService` to use Document API directly.
- **Outcome**: The codebase is cleaner with Whiteboard removed, but Document and Inquiry collaboration remains fully functional via the refactored shared services.

### Troubleshooting (2026-01-09)
- **Issue**: Frontend build failed with `Failed to resolve import "../../services/api/whiteboard"` from `src/hooks/document/useDocumentSync.ts`.
- **Cause**: `useDocumentSync` contained a dynamic import of the removed `whiteboardService` for snapshot loading.
- **Fix**: Updated `useDocumentSync.ts` to use `documentService.getSnapshot()` (which was refactored to be self-sufficient) and removed the dependency on `whiteboardService`. 

### Troubleshooting (2026-01-09)
- **Issue**: Backend failed to start with .
- **Cause**: The  file still contained an import for the deleted  module.
- **Fix**: Removed the import and reference to  from .

### Troubleshooting (2026-01-09)
- **Issue**: Backend failed to start with `ModuleNotFoundError: No module named 'app.repositories.whiteboard_snapshot'`.
- **Cause**: The `app/repositories/__init__.py` file still contained an import for the deleted `whiteboard_snapshot` module.
- **Fix**: Removed the import and reference to `WhiteboardSnapshot` from `app/repositories/__init__.py`.

### Troubleshooting (2026-01-09)
- **Issue**: Backend failed to start with .
- **Cause**: The  file still contained an import for the deleted  module.
- **Fix**: Removed the import and reference to  from .

### Troubleshooting (2026-01-09)
- **Issue**: Backend failed to start with `ModuleNotFoundError: No module named 'app.services.whiteboard_service'`.
- **Cause**: The `app/services/__init__.py` file still contained an import for the deleted `whiteboard_service` module.
- **Fix**: Removed the import and reference to `whiteboard_service` from `app/services/__init__.py`.

### Troubleshooting (2026-01-09)
- **Issue**: User reported inability to login (401 Unauthorized).
- **Diagnosis**: 
  - Verified  (email: ) exists with password .
  - Backend login logic checks strictly for case-sensitive match.
- **Fix**: Updated  to use case-insensitive login (regex) for email and username.

### Troubleshooting (2026-01-09)
- **Issue**: User reported inability to login (401 Unauthorized).
- **Diagnosis**: 
  - Verified `LuoYuchen` (email: `student@test.com`) exists with password `password123`.
  - Backend login logic checks strictly for case-sensitive match.
- **Fix**: Updated `app/services/auth_service.py` to use case-insensitive login (regex) for email and username.

### Troubleshooting (2026-01-09)
- **Issue**: User reported inability to login (401 Unauthorized) when using a username.
- **Diagnosis**: 
  - Frontend was consistently sending credentials in the  field (e.g., ).
  - Backend strictly tried to match  against "LuoYuchen", which failed.
- **Fix**: 
  - Updated  label to "Email / Username".
  - Updated  to detect if input is an email (contains '@'). If not, it sends it as  in the API payload.
  - Implemented backend robustness improvements (case-insensitive login, whitespace stripping).

### Troubleshooting (2026-01-09)
- **Issue**: User reported inability to login (401 Unauthorized) when using a username.
- **Diagnosis**: 
  - Frontend was consistently sending credentials in the `email` field (e.g., `{ email: "LuoYuchen" }`).
  - Backend strictly tried to match `User.email` against "LuoYuchen", which failed.
- **Fix**: 
  - Updated `frontend/src/pages/auth/Login.tsx` label to "Email / Username".
  - Updated `frontend/src/stores/authStore.ts` to detect if input is an email (contains '@'). If not, it sends it as `username` in the API payload.
  - Implemented backend robustness improvements (case-insensitive login, whitespace stripping).

### Troubleshooting (2026-01-09)
- **Issue**: User received a warning when running docker-compose: `WARN[0000] .../docker-compose.yml: the attribute version is obsolete`.
- **Cause**: The `version` attribute is deprecated in newer Docker Compose versions (V2+).
- **Fix**: Removed the `version: '3.8'` line from `docker-compose.yml`.
