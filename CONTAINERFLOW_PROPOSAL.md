# ContainerFlow - Complete System Proposal

## Executive Summary

ContainerFlow is a professional waste container management application for iOS, Android, and web platforms. It enables waste management companies to track containers, manage inventory, assign tasks, and monitor operations with QR scanning.

---

## Database Schema (6 Core Entities)

### 1. Users
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| email | Text | Unique email address |
| password | Text | SHA-256 hashed password |
| name | Text | Full name |
| role | Text | "driver" or "admin" |
| isActive | Boolean | Account status |
| createdAt | Timestamp | Creation date |

### 2. Customer Containers
| Field | Type | Description |
|-------|------|-------------|
| id | VARCHAR | Primary key (e.g., "CC-001") |
| customerName | Text | Customer/company name |
| location | Text | Address |
| latitude | Real | GPS latitude |
| longitude | Real | GPS longitude |
| materialType | Text | "plastic", "paper", "metal", "glass", "organic" |
| lastEmptied | Timestamp | Last pickup date |
| qrCode | Text | Unique QR code |
| isActive | Boolean | Container status |
| createdAt | Timestamp | Creation date |

### 3. Warehouse Containers
| Field | Type | Description |
|-------|------|-------------|
| id | VARCHAR | Primary key (e.g., "WH-001") |
| location | Text | Warehouse location |
| materialType | Text | Material type |
| currentAmount | Real | Current fill amount (kg) |
| maxCapacity | Real | Maximum capacity (kg) |
| lastEmptied | Timestamp | Last emptied date |
| qrCode | Text | Unique QR code |
| isActive | Boolean | Container status |
| createdAt | Timestamp | Creation date |

### 4. Tasks
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| containerID | VARCHAR | Reference to customer container |
| assignedTo | UUID | Reference to driver user |
| status | Text | "open", "in_progress", "completed", "cancelled" |
| scheduledTime | Timestamp | Scheduled pickup time |
| priority | Text | "low", "normal", "high", "urgent" |
| notes | Text | Additional notes |
| materialType | Text | Material type |
| estimatedAmount | Real | Estimated amount (kg) |
| pickupTimestamp | Timestamp | Actual pickup time |
| pickupLocation | JSONB | GPS coordinates at pickup |
| deliveryTimestamp | Timestamp | Delivery completion time |
| deliveryContainerID | VARCHAR | Reference to warehouse container |
| cancellationReason | Text | Reason if cancelled |
| createdBy | UUID | Admin who created task |
| createdAt | Timestamp | Creation date |

### 5. Activity Logs
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | Reference to user |
| action | Text | "pickup", "delivery", "cancelled" |
| taskId | UUID | Reference to task |
| containerId | VARCHAR | Container ID |
| location | JSONB | GPS coordinates |
| details | Text | Action description |
| createdAt | Timestamp | Timestamp |

### 6. Fill History
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| warehouseContainerId | VARCHAR | Reference to warehouse container |
| amountAdded | Real | Amount added (kg) |
| taskId | UUID | Reference to task |
| createdAt | Timestamp | Timestamp |

---

## Backend API Endpoints (All Functions)

### Authentication Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| HEAD/GET | `/api/health` | Health check endpoint |
| GET | `/api/auth/replit` | Check Replit authentication status |
| POST | `/api/auth/replit/login` | Login via Replit Auth (auto-creates user) |
| POST | `/api/auth/login` | Email/password login |

### User Management Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users (without passwords) |
| GET | `/api/users/:id` | Get single user by ID |
| POST | `/api/users` | Create new user (admin only) |
| PATCH | `/api/users/:id` | Update user (role, status, etc.) |

### Customer Container Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/containers/customer` | List all customer containers |
| GET | `/api/containers/customer/:id` | Get container by ID |
| GET | `/api/containers/customer/qr/:qrCode` | Get container by QR code |
| POST | `/api/containers/customer` | Create new customer container |
| PATCH | `/api/containers/customer/:id` | Update customer container |

### Warehouse Container Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/containers/warehouse` | List all warehouse containers |
| GET | `/api/containers/warehouse/:id` | Get container by ID |
| GET | `/api/containers/warehouse/qr/:qrCode` | Get container by QR code |
| POST | `/api/containers/warehouse` | Create new warehouse container |
| PATCH | `/api/containers/warehouse/:id` | Update warehouse container |
| GET | `/api/containers/warehouse/:id/history` | Get fill history for container |

### Task Management Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List tasks (with filters: assignedTo, status, date) |
| GET | `/api/tasks/:id` | Get single task |
| POST | `/api/tasks` | Create new task |
| PATCH | `/api/tasks/:id` | Update task |
| POST | `/api/tasks/:id/pickup` | Record pickup (sets status to in_progress) |
| POST | `/api/tasks/:id/delivery` | Record delivery (sets status to completed) |
| POST | `/api/tasks/:id/cancel` | Cancel task with reason |

### Activity Log Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/activity-logs` | List activity logs (with filters) |
| GET | `/api/activity-logs/export/csv` | Export logs as CSV file |

### Analytics Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/driver-performance` | Driver performance statistics |
| GET | `/api/analytics/fill-trends` | Warehouse fill trends and material breakdown |
| GET | `/api/dashboard/stats` | Dashboard overview statistics |

---

## Frontend Screens (16 Total)

### Driver Screens
| Screen | File | Description |
|--------|------|-------------|
| Login | `LoginScreen.tsx` | Email/password + Replit Auth login |
| Tasks | `TasksScreen.tsx` | Driver's assigned tasks list |
| Task Detail | `TaskDetailScreen.tsx` | Task details with pickup/delivery actions |
| Scanner | `ScannerScreen.tsx` | QR code scanner for containers |
| Containers | `ContainersScreen.tsx` | View all containers |
| Container Detail | `ContainerDetailScreen.tsx` | Single container details |
| Profile | `ProfileScreen.tsx` | User profile and settings |

### Admin-Only Screens
| Screen | File | Description |
|--------|------|-------------|
| Admin Dashboard | `AdminDashboardScreen.tsx` | Overview with stats and quick actions |
| Manage Tasks | `ManageTasksScreen.tsx` | Create, assign, edit tasks |
| Create Task | `CreateTaskScreen.tsx` | New task creation form |
| Manage Drivers | `ManageDriversScreen.tsx` | Add/edit drivers |
| Manage Containers | `ManageContainersScreen.tsx` | Add/edit containers |
| Activity Log | `ActivityLogScreen.tsx` | View all activity logs |
| Analytics | `AnalyticsScreen.tsx` | Charts and analytics dashboard |
| Driver Performance | `DriverPerformanceScreen.tsx` | Driver statistics |
| QR Generator | `QRGeneratorScreen.tsx` | Generate QR codes for containers |

---

## Admin Dashboard Features

### 1. Dashboard Overview (`AdminDashboardScreen.tsx`)
- **Stats Cards:**
  - Open tasks count
  - In-progress tasks count
  - Completed today count
  - Active drivers count
- **Quick Actions:**
  - Create new task
  - Manage drivers
  - Manage containers
  - View analytics
  - View activity logs
- **Recent Activity Feed**
- **Warehouse capacity overview**

### 2. Task Management (`ManageTasksScreen.tsx`)
- View all tasks with status filters
- Assign tasks to drivers
- Edit task priority
- Reschedule tasks
- Cancel tasks with reason
- Bulk task operations

### 3. Driver Management (`ManageDriversScreen.tsx`)
- Add new driver accounts
- Edit driver information
- Activate/deactivate drivers
- Reset driver passwords
- View driver task history

### 4. Container Management (`ManageContainersScreen.tsx`)
- **Customer Containers:**
  - Add new customer containers
  - Edit customer/location info
  - Activate/deactivate containers
  - View pickup history
- **Warehouse Containers:**
  - Add new warehouse containers
  - Edit capacity settings
  - View fill levels
  - View fill history

### 5. Analytics Dashboard (`AnalyticsScreen.tsx`)
- **Daily Trends:**
  - Deliveries per day (7-day chart)
  - Volume collected (kg)
- **Container Levels:**
  - Current fill percentages
  - Capacity by material type
- **Material Breakdown:**
  - Collection by material (plastic, paper, etc.)

### 6. Driver Performance (`DriverPerformanceScreen.tsx`)
- Per-driver statistics:
  - Total assigned tasks
  - Completed tasks
  - Completed today/this week
  - Tasks in progress
  - Completion rate (%)
  - Average delivery time (minutes)
- Overall fleet statistics:
  - Total drivers
  - Active drivers
  - Total completed today
  - Average completion rate

### 7. Activity Logs (`ActivityLogScreen.tsx`)
- Filterable log viewer:
  - Filter by driver
  - Filter by action type
  - Filter by date range
  - Filter by container
- CSV export functionality
- Real-time activity tracking

### 8. QR Code Generator (`QRGeneratorScreen.tsx`)
- Generate QR codes for containers
- Print-ready format
- Batch generation
- Link QR to container records

---

## Mobile-Specific Features

### QR Code Scanning
- Scan customer containers at pickup
- Scan warehouse containers at delivery
- Auto-lookup container details

### GPS Location Tracking
- Record pickup location with GPS
- Record delivery location with GPS
- Navigation to container addresses

### Maps Integration
- Open in Google Maps (Android)
- Open in Apple Maps (iOS)
- Show route to container

### Haptic Feedback
- Feedback on successful scan
- Feedback on task completion
- Error vibration patterns

---

## Role-Based Access Control

### Driver Role
- View assigned tasks
- Complete pickup/delivery workflow
- Scan QR codes
- View container details
- View own profile

### Admin Role (All Driver permissions PLUS)
- Create/manage tasks
- Create/manage drivers
- Create/manage containers
- View all analytics
- View all activity logs
- Export data
- Generate QR codes

---

## Technology Stack

### Frontend
- React Native + Expo SDK 54
- React Navigation 7+
- TanStack React Query
- React Native Reanimated
- expo-camera, expo-location
- react-native-maps

### Backend
- Node.js + Express.js
- Drizzle ORM + PostgreSQL
- TypeScript
- RESTful JSON API

### Authentication
- Email/password (SHA-256 hashed)
- Replit Auth integration
- AsyncStorage session management

---

## Color Theme

### Light Mode
| Element | Color |
|---------|-------|
| Background Root | `#FFFFFF` |
| Background Default | `#F9FAFB` |
| Text Primary | `#111827` |
| Text Secondary | `#6B7280` |
| Primary | `#1F3650` |
| Accent | `#FF6B2C` |
| Success | `#10B981` |
| Warning | `#F59E0B` |
| Error | `#EF4444` |

### Dark Mode
| Element | Color |
|---------|-------|
| Background Root | `#111827` |
| Background Default | `#1F2937` |
| Text Primary | `#F9FAFB` |
| Text Secondary | `#9CA3AF` |
| Primary | `#3B82F6` |
| Accent | `#FF6B2C` |
| Success | `#34D399` |
| Warning | `#FBBF24` |
| Error | `#F87171` |

---

## Implementation Status

- [x] Database schema defined
- [x] All API endpoints implemented
- [x] Authentication (email + Replit Auth)
- [x] Driver screens
- [x] Admin dashboard
- [x] Task management
- [x] Container management
- [x] QR scanning
- [x] GPS tracking
- [x] Activity logging
- [x] Analytics
- [x] CSV export
- [x] Light/Dark mode theming

---

*Document generated for ContainerFlow v1.0*
