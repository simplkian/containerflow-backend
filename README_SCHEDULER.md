# Flexible Task Scheduler System

## Overview

The ContainerFlow scheduler system provides flexible, rule-based automatic task generation for automotive factory waste management. It supports three scheduling rule types and allows administrators to configure how far in advance tasks are created.

## Features

- **Multiple Schedule Types**: Daily, Weekly, and Interval-based scheduling
- **Advance Planning**: Configure tasks to be created days ahead (createDaysAhead)
- **Preview Capability**: See upcoming scheduled dates before tasks are created
- **Manual Task Creation**: Create one-off tasks without schedules
- **Warehouse Container Management**: Track and empty warehouse containers

## Schedule Rule Types

### DAILY
Tasks are created for every day at the specified time.

**Example**: Create a pickup task every day at 06:00

### WEEKLY
Tasks are created only on specified weekdays at the scheduled time.

**Parameters**:
- `weekdays`: Array of weekday numbers (1=Monday, 7=Sunday)
- `timeLocal`: Time in HH:MM format

**Example**: Create tasks on Monday, Wednesday, Friday at 08:00

### INTERVAL
Tasks are created every N days, starting from a specified start date.

**Parameters**:
- `everyNDays`: Number of days between tasks
- `startDate`: Initial date for interval calculation
- `timeLocal`: Time in HH:MM format

**Example**: Create a task every 3 days starting from 2024-01-01

## createDaysAhead Configuration

The `createDaysAhead` parameter controls how many days in advance tasks are generated:

- **Value of 1**: Tasks created same day
- **Value of 7**: Tasks created up to 7 days in advance (default)
- **Value of 14**: Tasks created up to 14 days in advance

When the scheduler runs, it calculates all dates within the createDaysAhead window and creates tasks for any scheduled dates that don't already have tasks.

## API Endpoints

### Schedule Management (Admin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/schedules` | List all active schedules |
| POST | `/api/admin/schedules` | Create a new schedule |
| PATCH | `/api/admin/schedules/:id` | Update a schedule |
| DELETE | `/api/admin/schedules/:id` | Soft delete a schedule |
| GET | `/api/admin/schedules/:id/preview?days=14` | Preview next N days of scheduled dates |
| POST | `/api/admin/schedules/:id/run` | Manually trigger task creation |

### Manual Task Creation (Admin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/tasks` | Create a manual task |

**Request Body**:
```json
{
  "title": "Task title",
  "standId": "uuid-of-stand",
  "description": "Optional description",
  "priority": "LOW|NORMAL|HIGH|URGENT",
  "scheduledFor": "2024-12-15"
}
```

### Warehouse Container Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/warehouse-containers/:id/empty` | Reset container amount to 0 |

## Database Schema

### TaskSchedules Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR | Display name |
| standId | UUID | Associated stand |
| stationId | UUID | Optional station reference |
| ruleType | ENUM | DAILY, WEEKLY, or INTERVAL |
| timeLocal | VARCHAR | Time in HH:MM format |
| weekdays | INTEGER[] | For WEEKLY: day numbers 1-7 |
| everyNDays | INTEGER | For INTERVAL: days between tasks |
| startDate | DATE | For INTERVAL: start date |
| timezone | VARCHAR | Timezone for scheduling |
| createDaysAhead | INTEGER | Days to look ahead |
| isActive | BOOLEAN | Soft delete flag |
| createdAt | TIMESTAMP | Creation timestamp |

### Task Source Field

Tasks created by the scheduler include a `source` field:
- `MANUAL`: Created manually by admin
- `SCHEDULER`: Created by automatic scheduler
- `DAILY_FLAG`: Created by legacy dailyFull flag

## User Interface

### Schedule Management Screen

Access via: Admin Dashboard → Zeitpläne (Schedules)

Features:
- View all active schedules with status indicators
- Create new schedules with rule type selection
- Edit existing schedules
- Preview upcoming 14 days of scheduled dates
- Manually run schedules to create tasks immediately
- Delete schedules (soft delete)

### Manual Task Creation

From the Schedule Management screen:
- Tap the file-plus icon (secondary FAB)
- Fill in task details (title, stand, description, priority)
- Optionally set a scheduled date

### Warehouse Screen

Features:
- View all warehouse containers with fill levels
- Capacity bar visualization (green/yellow/red)
- "Leeren" (Empty) button to reset container amount

## Best Practices

1. **Set appropriate createDaysAhead**: For daily operations, 7 days is usually sufficient
2. **Use WEEKLY for regular patterns**: More efficient than multiple DAILY schedules
3. **Review previews before running**: Verify scheduled dates are correct
4. **Use priorities wisely**: URGENT tasks appear prominently to drivers
