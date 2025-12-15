# ContainerFlow Statistics & Analytics Documentation

## Overview

This document describes the production-ready statistics, analytics, and audit logging features implemented for the automotive factory waste management extension.

---

## Data Model

### Core Entities

| Table | Description |
|-------|-------------|
| `departments` | Organizational units (id, name, code unique, description, isActive) |
| `users` | User accounts with `departmentId` for department assignment |
| `materials` | Material types (e.g., Aluminium, Stahl, Kunststoff) |
| `halls` | Factory halls/buildings (id, name, code, address, isActive) |
| `stations` | Production stations within halls (id, name, code, hallId) |
| `stands` | Material collection stands at stations (id, identifier, stationId, materialId, dailyFull, isActive) |
| `boxes` | Physical containers that hold materials |
| `tasks` | Work orders with lifecycle (includes `scheduledFor`, `dedupKey` unique, `taskType`) |
| `taskEvents` | Audit log of all task state transitions |

### Task Status Lifecycle (Automotive)

```
OPEN → PICKED_UP → IN_TRANSIT → DROPPED_OFF → TAKEN_OVER → WEIGHED → DISPOSED
                                    ↓
                               CANCELLED
```

### taskEvents Schema

Each task transition is logged with full context:

| Field | Type | Description |
|-------|------|-------------|
| `id` | varchar (UUID) | Primary key |
| `taskId` | varchar | Reference to task |
| `fromStatus` | text | Previous status (null for creation) |
| `toStatus` | text | New status |
| `actorUserId` | varchar | User who performed the action |
| `actorRole` | text | Role at time of action (ADMIN, PICKUP_DRIVER, etc.) |
| `actorDepartmentId` | varchar | Department at time of action |
| `metaJson` | jsonb | Additional context (material, station, hall, weight, etc.) |
| `timestamp` | timestamp | When the event occurred |

---

## Daily Task Scheduler

### AUTO_CANCEL_PREVIOUS Policy

When generating daily tasks, the scheduler:
1. Finds all OPEN tasks with `taskType = "DAILY_FULL"` that have a dedupKey NOT ending with today's date
2. Cancels these stale tasks with reason "Auto-cancelled: New daily task generated"
3. Finds all stands where `dailyFull = true` and `isActive = true`
4. For each stand, creates a new task with a unique `dedupKey`: `DAILY:{standId}:{YYYY-MM-DD}`
5. Duplicate key violations (code 23505) are silently skipped

### Scheduler Timing

- **Startup**: Runs 5 seconds after server starts
- **Hourly**: Runs every 60 minutes via `setInterval`
- **Manual Trigger**: `POST /api/admin/daily-tasks/run` (admin only)

### dedupKey Format

```
DAILY:{standId}:{YYYY-MM-DD}
```

Example: `DAILY:abc123:2025-12-12`

---

## API Endpoints

### Activity Feed

```
GET /api/activity
```

Query Parameters:
| Param | Type | Description |
|-------|------|-------------|
| `from` | ISO date | Start date filter |
| `to` | ISO date | End date filter |
| `materialId` | UUID | Filter by material (via metaJson) |
| `stationId` | UUID | Filter by station (via metaJson) |
| `hallId` | UUID | Filter by hall (via metaJson) |
| `userId` | UUID | Filter by actorUserId |
| `departmentId` | UUID | Filter by actorDepartmentId |
| `action` | string | Filter by toStatus |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 50) |

Response:
```json
{
  "events": [
    {
      "id": "uuid",
      "taskId": "uuid",
      "fromStatus": "OPEN",
      "toStatus": "PICKED_UP",
      "actorUserId": "uuid",
      "actorRole": "PICKUP_DRIVER",
      "actorDepartmentId": "uuid",
      "metaJson": { "standId": "...", "materialId": "..." },
      "timestamp": "2025-12-12T08:30:00Z",
      "actorUserName": "Max Mustermann"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

### Analytics - Materials

```
GET /api/analytics/materials?from=2025-12-01&to=2025-12-12&groupBy=material
```

Query Parameters:
- `from`, `to`: Date range (filters by disposedAt)
- `groupBy`: `material` | `day` | `week` | `month`

Response (groupBy=material):
```json
{
  "data": [
    { "materialId": "uuid", "materialName": "Aluminium", "totalWeightKg": "5000", "taskCount": 25 }
  ],
  "groupBy": "material"
}
```

Response (groupBy=day/week/month):
```json
{
  "data": [
    { "period": "2025-12-01", "totalWeightKg": "1500", "taskCount": 8 }
  ],
  "groupBy": "day"
}
```

### Analytics - Stations

```
GET /api/analytics/stations?from=2025-12-01&to=2025-12-12
```

Response:
```json
{
  "data": [
    { 
      "stationId": "uuid", 
      "stationName": "Presswerk A1", 
      "stationCode": "PA1",
      "materialId": "uuid",
      "materialName": "Aluminium",
      "totalWeightKg": "3500", 
      "taskCount": 18 
    }
  ]
}
```

### Analytics - Halls

```
GET /api/analytics/halls?from=2025-12-01&to=2025-12-12
```

Response:
```json
{
  "data": [
    { 
      "hallId": "uuid", 
      "hallName": "Halle 1", 
      "hallCode": "H1",
      "materialId": "uuid",
      "materialName": "Stahl",
      "totalWeightKg": "8000", 
      "taskCount": 35 
    }
  ]
}
```

### Analytics - Users

```
GET /api/analytics/users?from=2025-12-01&to=2025-12-12
```

Response:
```json
{
  "data": {
    "byWeigher": [
      { "userId": "uuid", "userName": "Max", "userEmail": "max@example.com", "role": "weigher", "totalWeightKg": "5000", "taskCount": 20 }
    ],
    "byDriver": [
      { "userId": "uuid", "userName": "Hans", "userEmail": "hans@example.com", "role": "driver", "totalWeightKg": "4500", "taskCount": 18 }
    ]
  }
}
```

### Analytics - Departments

```
GET /api/analytics/departments?from=2025-12-01&to=2025-12-12
```

Response:
```json
{
  "data": [
    { 
      "departmentId": "uuid", 
      "departmentName": "Logistik", 
      "departmentCode": "LOG",
      "totalWeightKg": "12000", 
      "taskCount": 50 
    }
  ]
}
```

### Analytics - Lead Times

```
GET /api/analytics/lead-times?from=2025-12-01&to=2025-12-12&by=material
```

Query Parameters:
- `by`: `material` | `station` | (omit for overall)

Response (by=material):
```json
{
  "data": [
    { 
      "materialId": "uuid",
      "materialName": "Aluminium", 
      "avgOpenToPickedUpHours": "2.5",
      "avgPickedUpToDroppedOffHours": "1.2",
      "avgDroppedOffToDisposedHours": "4.0",
      "taskCount": 25 
    }
  ],
  "by": "material"
}
```

Response (overall):
```json
{
  "data": {
    "avgOpenToPickedUpHours": "2.8",
    "avgPickedUpToDroppedOffHours": "1.5",
    "avgDroppedOffToDisposedHours": "3.5",
    "taskCount": 100
  },
  "by": "overall"
}
```

### Analytics - Backlog

```
GET /api/analytics/backlog?olderThanHours=24
```

Response:
```json
{
  "olderThanHours": 24,
  "cutoffTime": "2025-12-11T10:00:00.000Z",
  "summary": [
    { "status": "OPEN", "count": 5 },
    { "status": "PICKED_UP", "count": 2 }
  ],
  "data": {
    "OPEN": [
      { 
        "id": "uuid", 
        "title": "Tägliche Abholung - Stand 01",
        "status": "OPEN",
        "createdAt": "2025-12-10T08:00:00Z",
        "pickedUpAt": null,
        "droppedOffAt": null,
        "standId": "uuid",
        "standIdentifier": "Stand 01",
        "stationName": "Presswerk A1",
        "materialName": "Stahl",
        "claimedByUserName": null
      }
    ],
    "PICKED_UP": []
  }
}
```

### Daily Tasks

```
GET /api/daily-tasks/today
POST /api/admin/daily-tasks/run  (admin only)
```

### Departments CRUD

```
GET    /api/departments
POST   /api/departments
GET    /api/departments/:id
PATCH  /api/departments/:id
DELETE /api/departments/:id
```

---

## Database Index Recommendations

For optimal query performance, add these indexes:

```sql
-- taskEvents indexes for activity feed queries
CREATE INDEX idx_task_events_task_id ON task_events(task_id);
CREATE INDEX idx_task_events_actor_user_id ON task_events(actor_user_id);
CREATE INDEX idx_task_events_actor_department_id ON task_events(actor_department_id);
CREATE INDEX idx_task_events_timestamp ON task_events(timestamp DESC);

-- Tasks indexes for analytics (filter by DISPOSED status and date range)
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_disposed_at ON tasks(disposed_at) WHERE disposed_at IS NOT NULL;
CREATE INDEX idx_tasks_updated_at ON tasks(updated_at);
CREATE INDEX idx_tasks_dedup_key ON tasks(dedup_key) WHERE dedup_key IS NOT NULL;

-- Stands index for daily task generation
CREATE INDEX idx_stands_daily_full ON stands(daily_full) WHERE daily_full = true AND is_active = true;

-- Users index for department queries
CREATE INDEX idx_users_department_id ON users(department_id) WHERE department_id IS NOT NULL;
```

---

## Example API Calls

### Get Activity Feed (Last 7 Days)

```bash
curl -H "Cookie: session_id=..." \
  "https://your-app.replit.app/api/activity?from=2025-12-05&to=2025-12-12&limit=20"
```

### Get Material Analytics (This Month)

```bash
curl -H "Cookie: session_id=..." \
  "https://your-app.replit.app/api/analytics/materials?from=2025-12-01&to=2025-12-31&groupBy=material"
```

### Get Lead Times by Station

```bash
curl -H "Cookie: session_id=..." \
  "https://your-app.replit.app/api/analytics/lead-times?from=2025-12-01&to=2025-12-12&by=station"
```

### Trigger Daily Task Generation (Admin)

```bash
curl -X POST -H "Cookie: session_id=..." \
  "https://your-app.replit.app/api/admin/daily-tasks/run"
```

### Create Department

```bash
curl -X POST -H "Content-Type: application/json" -H "Cookie: session_id=..." \
  -d '{"name":"Logistik","code":"LOG","description":"Logistics department"}' \
  "https://your-app.replit.app/api/departments"
```

### Get Backlog (Tasks Older Than 24 Hours)

```bash
curl -H "Cookie: session_id=..." \
  "https://your-app.replit.app/api/analytics/backlog?olderThanHours=24"
```

---

## Frontend Screens

### Activity Screen (`/screens/ActivityScreen.tsx`)
- Timeline view of all task events from taskEvents table
- Filter chips for date ranges (Today, Week, Month, Custom)
- Pull-to-refresh and infinite scroll pagination
- German labels for all actions

### Analytics Screen (`/screens/AnalyticsScreen.tsx`)
- Date range picker
- KPI cards based on aggregated task data
- Material breakdown table (sortable)
- Station performance table
- Lead time visualization
- Backlog section grouped by status

### Department Management (`/screens/DepartmentManagementScreen.tsx`)
- List all departments with code badges
- Create/Edit/Delete modals
- Toggle active/inactive status

---

## Audit Logging

All task state transitions are recorded in `taskEvents` with:
- `fromStatus` / `toStatus`: The transition
- `actorUserId`, `actorRole`, `actorDepartmentId`: Who performed the action
- `metaJson`: Hierarchical context (standId, stationId, hallId, materialId, boxId, weightKg)

Events are immutable (append-only) for audit trail integrity.
