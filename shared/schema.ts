import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, real, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// ENUMS - Status and Type Definitions
// ============================================================================

/**
 * User Role Enum
 * - ADMIN: Full access to create tasks, manage users, view all data
 * - DRIVER: Field operations, scan containers, complete tasks
 */
export const userRoleEnum = pgEnum("user_role", ["ADMIN", "DRIVER"]);

/**
 * Container Status Enum
 * Tracks the current location/state of a container
 */
export const containerStatusEnum = pgEnum("container_status", [
  "AT_WAREHOUSE",    // Container is at the warehouse
  "AT_CUSTOMER",     // Container is at customer location
  "IN_TRANSIT",      // Container is being transported
  "OUT_OF_SERVICE",  // Container is not available (maintenance, etc.)
]);

/**
 * Task Status Enum - Lifecycle States
 * Defines the complete lifecycle of a task/job
 * 
 * Valid transitions:
 * OFFEN -> ASSIGNED -> ACCEPTED -> PICKED_UP -> IN_TRANSIT -> DELIVERED -> COMPLETED
 * Any state except COMPLETED can transition to CANCELLED
 * 
 * OFFEN = "Open" - Initial state for all newly created tasks
 */
export const taskStatusEnum = pgEnum("task_status", [
  "OFFEN",        // Task created, open and not yet assigned (initial state)
  "PLANNED",      // Legacy: same as OFFEN (kept for backward compatibility)
  "ASSIGNED",     // Task assigned to a driver
  "ACCEPTED",     // Driver has accepted the task (scanned at customer)
  "PICKED_UP",    // Container picked up from customer
  "IN_TRANSIT",   // Container being transported to warehouse
  "DELIVERED",    // Container delivered to warehouse (scanned)
  "COMPLETED",    // Task fully completed (weight recorded, etc.)
  "CANCELLED",    // Task was cancelled
]);

/**
 * Scan Context Enum
 * Defines the context in which a scan occurred
 */
export const scanContextEnum = pgEnum("scan_context", [
  "WAREHOUSE_INFO",           // General info scan in warehouse (no task)
  "CUSTOMER_INFO",            // General info scan at customer (no task)
  "TASK_ACCEPT_AT_CUSTOMER",  // Driver scans to accept task at customer
  "TASK_PICKUP",              // Driver scans to confirm pickup
  "TASK_COMPLETE_AT_WAREHOUSE", // Driver scans at warehouse to complete delivery
  "INVENTORY_CHECK",          // Inventory/audit scan
  "MAINTENANCE",              // Maintenance-related scan
]);

/**
 * Location Type Enum
 * Where the scan took place
 */
export const locationTypeEnum = pgEnum("location_type", [
  "WAREHOUSE",
  "CUSTOMER",
  "OTHER",
]);

/**
 * Activity Log Type Enum
 * Categorizes activity log entries for filtering and display
 */
export const activityLogTypeEnum = pgEnum("activity_log_type", [
  "TASK_CREATED",
  "TASK_ASSIGNED",
  "TASK_ACCEPTED",
  "TASK_PICKED_UP",
  "TASK_IN_TRANSIT",
  "TASK_DELIVERED",
  "TASK_COMPLETED",
  "TASK_CANCELLED",
  "TASK_DELETED",
  "CONTAINER_SCANNED_AT_CUSTOMER",
  "CONTAINER_SCANNED_AT_WAREHOUSE",
  "CONTAINER_STATUS_CHANGED",
  "WEIGHT_RECORDED",
  "MANUAL_EDIT",
  "SYSTEM_EVENT",
]);

/**
 * Priority Enum
 */
export const priorityEnum = pgEnum("priority", ["normal", "high", "urgent"]);

/**
 * Quantity Unit Enum
 */
export const quantityUnitEnum = pgEnum("quantity_unit", ["kg", "t", "m3", "pcs"]);

// ============================================================================
// AUTOMOTIVE FACTORY ENUMS
// ============================================================================

/**
 * Automotive User Role Enum
 * Roles specific to automotive factory operations
 */
export const automotiveUserRoleEnum = pgEnum("automotive_user_role", [
  "ADMIN",          // Full administrative access
  "PICKUP_DRIVER",  // Picks up boxes from stands
  "WAREHOUSE",      // Manages warehouse operations
  "DISPOSAL",       // Handles disposal/weighing
]);

/**
 * Automotive Task Status Enum
 * Lifecycle states for automotive factory tasks
 */
export const automotiveTaskStatusEnum = pgEnum("automotive_task_status", [
  "OPEN",        // Task created, awaiting pickup
  "PICKED_UP",   // Box picked up from stand
  "IN_TRANSIT",  // Box being transported
  "DROPPED_OFF", // Box dropped at warehouse
  "TAKEN_OVER",  // Warehouse has taken over the box
  "WEIGHED",     // Box has been weighed
  "DISPOSED",    // Material disposed/processed
  "CANCELLED",   // Task cancelled
]);

/**
 * Box Status Enum
 * Tracks the current location/state of a box
 */
export const boxStatusEnum = pgEnum("box_status", [
  "AT_STAND",      // Box is at production stand
  "IN_TRANSIT",    // Box is being transported
  "AT_WAREHOUSE",  // Box is at warehouse
  "AT_DISPOSAL",   // Box is at disposal area
  "RETIRED",       // Box is no longer in use
]);

/**
 * Task Type Enum
 * Categorizes how tasks are created
 */
export const taskTypeEnum = pgEnum("task_type", [
  "DAILY_FULL",  // Auto-generated daily task for full stands
  "MANUAL",      // Manually created task
  "LEGACY",      // Legacy task (backward compatibility)
]);

/**
 * Task Source Enum
 * Indicates how the task was created
 */
export const taskSourceEnum = pgEnum("task_source", [
  "SCHEDULED",  // Created by flexible scheduler from TaskSchedule
  "MANUAL",     // Manually created by admin
  "ADHOC",      // Created on-the-fly (e.g., driver scan)
  "LEGACY",     // Legacy task or migration
]);

/**
 * Task Schedule Rule Type Enum
 * Defines the recurrence pattern for scheduled tasks
 */
export const taskScheduleRuleTypeEnum = pgEnum("task_schedule_rule_type", [
  "DAILY",     // Every day
  "WEEKLY",    // Specific weekdays
  "INTERVAL",  // Every N days from start date
]);

// ============================================================================
// TABLES
// ============================================================================

/**
 * Departments Table
 * Organizational units for grouping users and tracking context
 */
export const departments = pgTable("departments", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const departmentsRelations = relations(departments, ({ many }) => ({
  users: many(users),
  taskEvents: many(taskEvents),
}));

/**
 * Users Table
 * Stores admin and driver accounts
 */
export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  role: text("role").notNull().default("DRIVER"), // ADMIN or DRIVER
  departmentId: varchar("department_id").references(() => departments.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
  }),
  createdTasks: many(tasks, { relationName: "taskCreator" }),
  assignedTasks: many(tasks, { relationName: "taskAssignee" }),
  claimedTasks: many(tasks, { relationName: "taskClaimer" }),
  weighedTasks: many(tasks, { relationName: "taskWeigher" }),
  scanEvents: many(scanEvents),
  activityLogs: many(activityLogs),
  taskEvents: many(taskEvents),
}));

/**
 * Customers Table
 * Stores customer information
 */
export const customers = pgTable("customers", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address"),
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const customersRelations = relations(customers, ({ many }) => ({
  containers: many(customerContainers),
}));

/**
 * Customer Containers Table
 * Containers placed at customer locations
 */
export const customerContainers = pgTable("customer_containers", {
  id: varchar("id").primaryKey(),
  customerId: varchar("customer_id").references(() => customers.id),
  customerName: text("customer_name").notNull(), // Denormalized for convenience
  location: text("location").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  qrCode: text("qr_code").notNull().unique(),
  materialType: text("material_type").notNull(),
  contentDescription: text("content_description"),
  status: text("status").notNull().default("AT_CUSTOMER"), // AT_CUSTOMER, IN_TRANSIT, etc.
  lastEmptied: timestamp("last_emptied"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const customerContainersRelations = relations(customerContainers, ({ one, many }) => ({
  customer: one(customers, {
    fields: [customerContainers.customerId],
    references: [customers.id],
  }),
  tasks: many(tasks),
  scanEvents: many(scanEvents),
}));

// ============================================================================
// AUTOMOTIVE FACTORY TABLES
// ============================================================================

/**
 * Materials Table
 * Master data for materials handled in the factory
 */
export const materials = pgTable("materials", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  hazardClass: text("hazard_class"),
  disposalStream: text("disposal_stream"),
  densityHint: real("density_hint"),
  defaultUnit: text("default_unit").notNull().default("kg"),
  qrCode: text("qr_code").unique(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const materialsRelations = relations(materials, ({ many }) => ({
  stands: many(stands),
  warehouseContainers: many(warehouseContainers),
}));

/**
 * Halls Table
 * Production halls in the factory
 */
export const halls = pgTable("halls", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  locationMeta: jsonb("location_meta"),
  positionMeta: jsonb("position_meta"),
  qrCode: text("qr_code").unique(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const hallsRelations = relations(halls, ({ many }) => ({
  stations: many(stations),
}));

/**
 * Stations Table
 * Production stations within halls
 */
export const stations = pgTable("stations", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  hallId: varchar("hall_id").notNull().references(() => halls.id),
  name: text("name").notNull(),
  code: text("code").notNull(),
  sequence: integer("sequence"),
  locationMeta: jsonb("location_meta"),
  positionMeta: jsonb("position_meta"),
  qrCode: text("qr_code").unique(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  hallCodeUnique: sql`UNIQUE(hall_id, code)`,
}));

export const stationsRelations = relations(stations, ({ one, many }) => ({
  hall: one(halls, {
    fields: [stations.hallId],
    references: [halls.id],
  }),
  stands: many(stands),
}));

/**
 * Stands Table
 * Individual stands at stations where boxes are placed
 */
export const stands = pgTable("stands", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  stationId: varchar("station_id").notNull().references(() => stations.id),
  identifier: text("identifier").notNull(),
  materialId: varchar("material_id").references(() => materials.id),
  qrCode: text("qr_code").notNull().unique(),
  sequence: integer("sequence"),
  positionMeta: jsonb("position_meta"),
  dailyFull: boolean("daily_full").notNull().default(false),
  dailyTaskTimeLocal: text("daily_task_time_local"), // e.g., "06:00"
  lastDailyTaskGeneratedAt: timestamp("last_daily_task_generated_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const standsRelations = relations(stands, ({ one, many }) => ({
  station: one(stations, {
    fields: [stands.stationId],
    references: [stations.id],
  }),
  material: one(materials, {
    fields: [stands.materialId],
    references: [materials.id],
  }),
  boxes: many(boxes),
  tasks: many(tasks),
  taskSchedules: many(taskSchedules),
}));

/**
 * Task Schedules Table
 * Flexible scheduling rules for automated task generation
 */
export const taskSchedules = pgTable("task_schedules", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  standId: varchar("stand_id").notNull().references(() => stands.id),
  stationId: varchar("station_id").references(() => stations.id),
  ruleType: text("rule_type").notNull(), // DAILY, WEEKLY, INTERVAL
  timeLocal: text("time_local").notNull(), // e.g., "06:00"
  weekdays: integer("weekdays").array(), // For WEEKLY: [1,2,3,4,5] = Mon-Fri (1=Monday, 7=Sunday)
  everyNDays: integer("every_n_days"), // For INTERVAL: every N days
  startDate: timestamp("start_date"), // For INTERVAL: start date for counting
  timezone: text("timezone").notNull().default("Europe/Berlin"),
  createDaysAhead: integer("create_days_ahead").notNull().default(7),
  createdById: varchar("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const taskSchedulesRelations = relations(taskSchedules, ({ one, many }) => ({
  stand: one(stands, {
    fields: [taskSchedules.standId],
    references: [stands.id],
  }),
  station: one(stations, {
    fields: [taskSchedules.stationId],
    references: [stations.id],
  }),
  createdBy: one(users, {
    fields: [taskSchedules.createdById],
    references: [users.id],
  }),
  tasks: many(tasks),
}));

/**
 * Boxes Table
 * Transportable boxes that move between stands and warehouse
 */
export const boxes = pgTable("boxes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  standId: varchar("stand_id").references(() => stands.id),
  qrCode: text("qr_code").notNull().unique(),
  serial: text("serial").notNull().unique(),
  status: text("status").notNull().default("AT_STAND"),
  currentTaskId: varchar("current_task_id"),
  lastSeenAt: timestamp("last_seen_at"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const boxesRelations = relations(boxes, ({ one, many }) => ({
  stand: one(stands, {
    fields: [boxes.standId],
    references: [stands.id],
  }),
  currentTask: one(tasks, {
    fields: [boxes.currentTaskId],
    references: [tasks.id],
    relationName: "boxCurrentTask",
  }),
  tasks: many(tasks, { relationName: "boxTasks" }),
}));

/**
 * Warehouse Containers Table
 * Containers in the warehouse for collecting materials
 */
export const warehouseContainers = pgTable("warehouse_containers", {
  id: varchar("id").primaryKey(),
  location: text("location").notNull(),
  warehouseZone: text("warehouse_zone"), // e.g., "A-17", "Tor 3"
  qrCode: text("qr_code").notNull().unique(),
  materialType: text("material_type").notNull(),
  contentDescription: text("content_description"),
  currentAmount: real("current_amount").notNull().default(0),
  maxCapacity: real("max_capacity").notNull(),
  quantityUnit: text("quantity_unit").notNull().default("kg"), // kg, t, m3
  status: text("status").notNull().default("AT_WAREHOUSE"), // AT_WAREHOUSE, OUT_OF_SERVICE
  lastEmptied: timestamp("last_emptied"),
  materialId: varchar("material_id").references(() => materials.id),
  isFull: boolean("is_full").notNull().default(false),
  isBlocked: boolean("is_blocked").notNull().default(false),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const warehouseContainersRelations = relations(warehouseContainers, ({ one, many }) => ({
  material: one(materials, {
    fields: [warehouseContainers.materialId],
    references: [materials.id],
  }),
  tasks: many(tasks),
  targetTasks: many(tasks, { relationName: "targetWarehouseContainer" }),
  fillHistory: many(fillHistory),
  scanEvents: many(scanEvents),
}));

/**
 * Fill History Table
 * Tracks additions to warehouse containers
 */
export const fillHistory = pgTable("fill_history", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  warehouseContainerId: varchar("warehouse_container_id").notNull().references(() => warehouseContainers.id),
  amountAdded: real("amount_added").notNull(),
  quantityUnit: text("quantity_unit").notNull().default("kg"),
  taskId: varchar("task_id").references(() => tasks.id),
  recordedByUserId: varchar("recorded_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const fillHistoryRelations = relations(fillHistory, ({ one }) => ({
  warehouseContainer: one(warehouseContainers, {
    fields: [fillHistory.warehouseContainerId],
    references: [warehouseContainers.id],
  }),
  task: one(tasks, {
    fields: [fillHistory.taskId],
    references: [tasks.id],
  }),
  recordedBy: one(users, {
    fields: [fillHistory.recordedByUserId],
    references: [users.id],
  }),
}));

/**
 * Tasks Table (Jobs/Aufträge)
 * Represents pickup/delivery jobs with full lifecycle tracking
 * 
 * Status Transitions:
 * OFFEN -> ACCEPTED (driver claims task)
 * ACCEPTED -> PICKED_UP (when container loaded)
 * PICKED_UP -> IN_TRANSIT (when leaving customer)
 * IN_TRANSIT -> DELIVERED (when scanned at warehouse)
 * DELIVERED -> COMPLETED (when weight recorded and finalized)
 * Any -> CANCELLED (except COMPLETED)
 * 
 * Pull-based model: Tasks start OFFEN, drivers claim them
 */
export const tasks = pgTable("tasks", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  
  // Task Details
  title: text("title"), // Short description, e.g., "Abholung bei ABC GmbH"
  description: text("description"), // Detailed description
  
  // Container References (nullable for stand-based automotive tasks)
  containerID: varchar("container_id").references(() => customerContainers.id),
  deliveryContainerID: varchar("delivery_container_id").references(() => warehouseContainers.id),
  
  // User References
  createdBy: varchar("created_by").references(() => users.id),
  assignedTo: varchar("assigned_to").references(() => users.id),
  
  // Pull-based task claiming
  claimedByUserId: varchar("claimed_by_user_id").references(() => users.id), // User who claimed the task
  claimedAt: timestamp("claimed_at"), // When task was claimed
  handoverAt: timestamp("handover_at"), // When task was transferred to another user
  
  // Planning
  scheduledTime: timestamp("scheduled_time"), // Planned execution time
  plannedQuantity: real("planned_quantity"), // Expected amount
  plannedQuantityUnit: text("planned_quantity_unit").default("kg"),
  priority: text("priority").notNull().default("normal"), // normal, high, urgent
  materialType: text("material_type"), // Optional - material type for the task
  
  // Status and Lifecycle
  status: text("status").notNull().default("OFFEN"), // Changed default from PLANNED to OFFEN
  
  // Lifecycle Timestamps - Set when status changes
  createdAt: timestamp("created_at").notNull().defaultNow(),
  assignedAt: timestamp("assigned_at"),
  acceptedAt: timestamp("accepted_at"),
  pickedUpAt: timestamp("picked_up_at"),
  inTransitAt: timestamp("in_transit_at"),
  deliveredAt: timestamp("delivered_at"),
  completedAt: timestamp("completed_at"),
  cancelledAt: timestamp("cancelled_at"),
  
  // Legacy fields for backward compatibility
  pickupTimestamp: timestamp("pickup_timestamp"),
  pickupLocation: jsonb("pickup_location"),
  deliveryTimestamp: timestamp("delivery_timestamp"),
  
  // Actual recorded values
  actualQuantity: real("actual_quantity"), // Actually measured amount
  actualQuantityUnit: text("actual_quantity_unit").default("kg"),
  measuredWeight: real("measured_weight"), // Actual weight measured at completion
  
  // Additional info
  notes: text("notes"),
  cancellationReason: text("cancellation_reason"),
  estimatedAmount: real("estimated_amount"), // Legacy, use plannedQuantity
  
  // ============================================================================
  // AUTOMOTIVE FACTORY TASK FIELDS
  // ============================================================================
  
  // Automotive references
  boxId: varchar("box_id").references(() => boxes.id),
  standId: varchar("stand_id").references(() => stands.id),
  targetWarehouseContainerId: varchar("target_warehouse_container_id").references(() => warehouseContainers.id),
  
  // Automotive lifecycle timestamps
  droppedOffAt: timestamp("dropped_off_at"),
  takenOverAt: timestamp("taken_over_at"),
  weighedAt: timestamp("weighed_at"),
  disposedAt: timestamp("disposed_at"),
  
  // Automotive measurements
  weightKg: real("weight_kg"),
  weighedByUserId: varchar("weighed_by_user_id").references(() => users.id),
  
  // Task categorization
  taskType: text("task_type").notNull().default("LEGACY"), // DAILY_FULL, MANUAL, LEGACY
  source: text("source").notNull().default("LEGACY"), // SCHEDULED, MANUAL, ADHOC, LEGACY
  scheduleId: varchar("schedule_id").references(() => taskSchedules.id), // Link to the schedule that created this task
  
  // Daily task scheduling
  scheduledFor: timestamp("scheduled_for"), // Date for which daily task is scheduled
  dedupKey: text("dedup_key").unique(), // Format: SCHED:${scheduleId}:${YYYY-MM-DD} or DAILY:${standId}:${YYYY-MM-DD}
  
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  container: one(customerContainers, {
    fields: [tasks.containerID],
    references: [customerContainers.id],
  }),
  deliveryContainer: one(warehouseContainers, {
    fields: [tasks.deliveryContainerID],
    references: [warehouseContainers.id],
  }),
  targetWarehouseContainer: one(warehouseContainers, {
    fields: [tasks.targetWarehouseContainerId],
    references: [warehouseContainers.id],
    relationName: "targetWarehouseContainer",
  }),
  creator: one(users, {
    fields: [tasks.createdBy],
    references: [users.id],
    relationName: "taskCreator",
  }),
  assignee: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
    relationName: "taskAssignee",
  }),
  claimedBy: one(users, {
    fields: [tasks.claimedByUserId],
    references: [users.id],
    relationName: "taskClaimer",
  }),
  weighedBy: one(users, {
    fields: [tasks.weighedByUserId],
    references: [users.id],
    relationName: "taskWeigher",
  }),
  box: one(boxes, {
    fields: [tasks.boxId],
    references: [boxes.id],
    relationName: "boxTasks",
  }),
  stand: one(stands, {
    fields: [tasks.standId],
    references: [stands.id],
  }),
  schedule: one(taskSchedules, {
    fields: [tasks.scheduleId],
    references: [taskSchedules.id],
  }),
  scanEvents: many(scanEvents),
  activityLogs: many(activityLogs),
  fillHistory: many(fillHistory),
  taskEvents: many(taskEvents),
}));

/**
 * Task Events Table
 * Audit trail for task state changes and actions
 */
export const taskEvents = pgTable("task_events", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id),
  actorUserId: varchar("actor_user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: varchar("entity_id"),
  beforeData: jsonb("before_data"),
  afterData: jsonb("after_data"),
  actorRole: text("actor_role"),
  actorDepartmentId: varchar("actor_department_id").references(() => departments.id),
  metaJson: jsonb("meta_json"), // Contains stationId, hallId, standId, boxId, materialId, containerId, qrType
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const taskEventsRelations = relations(taskEvents, ({ one }) => ({
  task: one(tasks, {
    fields: [taskEvents.taskId],
    references: [tasks.id],
  }),
  actorUser: one(users, {
    fields: [taskEvents.actorUserId],
    references: [users.id],
  }),
  actorDepartment: one(departments, {
    fields: [taskEvents.actorDepartmentId],
    references: [departments.id],
  }),
}));

/**
 * Scan Events Table
 * Records every QR code scan with context and location
 * 
 * This is the source of truth for scan history and is used to:
 * - Track container movements
 * - Validate task state transitions
 * - Build activity timeline
 */
export const scanEvents = pgTable("scan_events", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  
  // What was scanned
  containerId: varchar("container_id").notNull(), // Can be customer or warehouse container
  containerType: text("container_type").notNull(), // "customer" or "warehouse"
  
  // Task context (optional - null for info-only scans)
  taskId: varchar("task_id").references(() => tasks.id),
  
  // Who scanned
  scannedByUserId: varchar("scanned_by_user_id").notNull().references(() => users.id),
  
  // When and where
  scannedAt: timestamp("scanned_at").notNull().defaultNow(),
  
  // Scan context - what was the purpose of this scan
  scanContext: text("scan_context").notNull(), // WAREHOUSE_INFO, TASK_ACCEPT_AT_CUSTOMER, etc.
  
  // Location information
  locationType: text("location_type").notNull(), // WAREHOUSE, CUSTOMER, OTHER
  locationDetails: text("location_details"), // Free text, e.g., "Tor 3", "Regal A-17"
  geoLocation: jsonb("geo_location"), // { latitude, longitude, accuracy }
  
  // Scan result
  scanResult: text("scan_result").notNull().default("SUCCESS"), // SUCCESS, INVALID_CONTAINER, ERROR
  resultMessage: text("result_message"), // Human-readable result description
  
  // Additional data for debugging/audit
  extraData: jsonb("extra_data"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const scanEventsRelations = relations(scanEvents, ({ one }) => ({
  scannedBy: one(users, {
    fields: [scanEvents.scannedByUserId],
    references: [users.id],
  }),
  task: one(tasks, {
    fields: [scanEvents.taskId],
    references: [tasks.id],
  }),
}));

/**
 * Activity Logs Table
 * Human-readable activity timeline for admins
 * 
 * Each entry represents a significant event that should be displayed
 * in the activity history. Generated from task state changes and scan events.
 */
export const activityLogs = pgTable("activity_logs", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  
  // Event classification
  type: text("type").notNull(), // TASK_CREATED, TASK_ACCEPTED, CONTAINER_SCANNED_AT_WAREHOUSE, etc.
  action: text("action").notNull(), // Legacy field, same as type for backward compatibility
  
  // Human-readable message for UI display
  message: text("message").notNull(), // e.g., "Fahrer Müller hat Container XYZ beim Kunden gescannt"
  
  // References
  userId: varchar("user_id").references(() => users.id), // Who triggered this event
  taskId: varchar("task_id").references(() => tasks.id),
  containerId: varchar("container_id"), // Can be customer or warehouse container ID
  scanEventId: varchar("scan_event_id").references(() => scanEvents.id), // Link to scan if applicable
  
  // Location at time of event
  location: jsonb("location"),
  
  // Additional structured details
  details: text("details"), // Legacy field
  metadata: jsonb("metadata"), // Additional structured data
  
  // Timestamp
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
  task: one(tasks, {
    fields: [activityLogs.taskId],
    references: [tasks.id],
  }),
  scanEvent: one(scanEvents, {
    fields: [activityLogs.scanEventId],
    references: [scanEvents.id],
  }),
}));

// ============================================================================
// SCHEMAS AND TYPES
// ============================================================================

export const insertDepartmentSchema = createInsertSchema(departments);

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  name: true,
  phone: true,
  role: true,
  departmentId: true,
});

export const insertCustomerSchema = createInsertSchema(customers);
export const insertCustomerContainerSchema = createInsertSchema(customerContainers);
export const insertWarehouseContainerSchema = createInsertSchema(warehouseContainers);
export const insertTaskSchema = createInsertSchema(tasks);
export const insertScanEventSchema = createInsertSchema(scanEvents);
export const insertActivityLogSchema = createInsertSchema(activityLogs);
export const insertFillHistorySchema = createInsertSchema(fillHistory);

// Automotive factory insert schemas
export const insertMaterialSchema = createInsertSchema(materials);
export const insertHallSchema = createInsertSchema(halls);
export const insertStationSchema = createInsertSchema(stations);
export const insertStandSchema = createInsertSchema(stands);
export const insertBoxSchema = createInsertSchema(boxes);
export const insertTaskEventSchema = createInsertSchema(taskEvents);
export const insertTaskScheduleSchema = createInsertSchema(taskSchedules);

export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departments.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type CustomerContainer = typeof customerContainers.$inferSelect;
export type WarehouseContainer = typeof warehouseContainers.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type ScanEvent = typeof scanEvents.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type FillHistory = typeof fillHistory.$inferSelect;

// Automotive factory types
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type InsertHall = z.infer<typeof insertHallSchema>;
export type InsertStation = z.infer<typeof insertStationSchema>;
export type InsertStand = z.infer<typeof insertStandSchema>;
export type InsertBox = z.infer<typeof insertBoxSchema>;
export type InsertTaskEvent = z.infer<typeof insertTaskEventSchema>;

export type Material = typeof materials.$inferSelect;
export type Hall = typeof halls.$inferSelect;
export type Station = typeof stations.$inferSelect;
export type Stand = typeof stands.$inferSelect;
export type Box = typeof boxes.$inferSelect;
export type TaskEvent = typeof taskEvents.$inferSelect;
export type InsertTaskSchedule = z.infer<typeof insertTaskScheduleSchema>;
export type TaskSchedule = typeof taskSchedules.$inferSelect;

// ============================================================================
// STATUS TRANSITION VALIDATION
// ============================================================================

/**
 * Valid task status transitions
 * Maps current status to array of valid next statuses
 */
export const VALID_TASK_TRANSITIONS: Record<string, string[]> = {
  OFFEN: ["ASSIGNED", "ACCEPTED", "CANCELLED"], // New task - can be assigned or directly accepted
  PLANNED: ["ASSIGNED", "ACCEPTED", "CANCELLED"], // Legacy: same as OFFEN
  ASSIGNED: ["ACCEPTED", "OFFEN", "PLANNED", "CANCELLED"],
  ACCEPTED: ["PICKED_UP", "CANCELLED"],
  PICKED_UP: ["IN_TRANSIT", "DELIVERED", "CANCELLED"], // Allow skipping IN_TRANSIT for simpler flow
  IN_TRANSIT: ["DELIVERED", "CANCELLED"],
  DELIVERED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [], // Terminal state
  CANCELLED: [], // Terminal state
};

/**
 * Check if a status transition is valid
 */
export function isValidTaskTransition(currentStatus: string, newStatus: string): boolean {
  const validTransitions = VALID_TASK_TRANSITIONS[currentStatus];
  if (!validTransitions) return false;
  return validTransitions.includes(newStatus);
}

/**
 * Get the timestamp field name for a given status
 */
export function getTimestampFieldForStatus(status: string): string | null {
  const mapping: Record<string, string> = {
    ASSIGNED: "assignedAt",
    ACCEPTED: "acceptedAt",
    PICKED_UP: "pickedUpAt",
    IN_TRANSIT: "inTransitAt",
    DELIVERED: "deliveredAt",
    COMPLETED: "completedAt",
    CANCELLED: "cancelledAt",
  };
  return mapping[status] || null;
}

// ============================================================================
// AUTOMOTIVE TASK TRANSITION VALIDATION
// ============================================================================

/**
 * Valid automotive task status transitions
 * Maps current status to array of valid next statuses
 * CANCELLED is allowed from any state except DISPOSED
 */
export const AUTOMOTIVE_TASK_TRANSITIONS: Record<string, string[]> = {
  OPEN: ["PICKED_UP", "CANCELLED"],
  PICKED_UP: ["IN_TRANSIT", "CANCELLED"],
  IN_TRANSIT: ["DROPPED_OFF", "CANCELLED"],
  DROPPED_OFF: ["TAKEN_OVER", "CANCELLED"],
  TAKEN_OVER: ["WEIGHED", "CANCELLED"],
  WEIGHED: ["DISPOSED", "CANCELLED"],
  DISPOSED: [], // Terminal state - no transitions allowed
  CANCELLED: [], // Terminal state - no transitions allowed
};

/**
 * Check if an automotive task status transition is valid
 */
export function isValidAutomotiveTransition(currentStatus: string, newStatus: string): boolean {
  const validTransitions = AUTOMOTIVE_TASK_TRANSITIONS[currentStatus];
  if (!validTransitions) return false;
  return validTransitions.includes(newStatus);
}

/**
 * Assert that an automotive task transition is valid
 * Throws an Error if the transition is invalid
 */
export function assertAutomotiveTransition(from: string, to: string): void {
  if (!isValidAutomotiveTransition(from, to)) {
    throw new Error(
      `Ungültiger Statusübergang: ${from} → ${to}. ` +
      `Erlaubte Übergänge von ${from}: ${AUTOMOTIVE_TASK_TRANSITIONS[from]?.join(", ") || "keine"}`
    );
  }
}

/**
 * Get the timestamp field name for an automotive task status
 */
export function getAutomotiveTimestampFieldForStatus(status: string): string | null {
  const mapping: Record<string, string> = {
    PICKED_UP: "pickedUpAt",
    IN_TRANSIT: "inTransitAt",
    DROPPED_OFF: "droppedOffAt",
    TAKEN_OVER: "takenOverAt",
    WEIGHED: "weighedAt",
    DISPOSED: "disposedAt",
    CANCELLED: "cancelledAt",
  };
  return mapping[status] || null;
}

// ============================================================================
// GERMAN TRANSLATIONS FOR UI
// ============================================================================

export const TASK_STATUS_LABELS: Record<string, string> = {
  OFFEN: "Offen",
  PLANNED: "Geplant", // Legacy, same as OFFEN
  ASSIGNED: "Zugewiesen",
  ACCEPTED: "Angenommen",
  PICKED_UP: "Abgeholt",
  IN_TRANSIT: "Unterwegs",
  DELIVERED: "Geliefert",
  COMPLETED: "Abgeschlossen",
  CANCELLED: "Storniert",
};

export const SCAN_CONTEXT_LABELS: Record<string, string> = {
  WAREHOUSE_INFO: "Info-Scan im Lager",
  CUSTOMER_INFO: "Info-Scan beim Kunden",
  TASK_ACCEPT_AT_CUSTOMER: "Auftragsannahme beim Kunden",
  TASK_PICKUP: "Abholung bestätigt",
  TASK_COMPLETE_AT_WAREHOUSE: "Lieferung im Lager",
  INVENTORY_CHECK: "Inventurprüfung",
  MAINTENANCE: "Wartungsscan",
};

export const ACTIVITY_LOG_TYPE_LABELS: Record<string, string> = {
  TASK_CREATED: "Auftrag erstellt",
  TASK_ASSIGNED: "Auftrag zugewiesen",
  TASK_ACCEPTED: "Auftrag angenommen",
  TASK_PICKED_UP: "Container abgeholt",
  TASK_IN_TRANSIT: "Transport gestartet",
  TASK_DELIVERED: "Container geliefert",
  TASK_COMPLETED: "Auftrag abgeschlossen",
  TASK_CANCELLED: "Auftrag storniert",
  TASK_DELETED: "Auftrag gelöscht",
  CONTAINER_SCANNED_AT_CUSTOMER: "Container beim Kunden gescannt",
  CONTAINER_SCANNED_AT_WAREHOUSE: "Container im Lager gescannt",
  CONTAINER_STATUS_CHANGED: "Container-Status geändert",
  WEIGHT_RECORDED: "Gewicht erfasst",
  MANUAL_EDIT: "Manuelle Bearbeitung",
  SYSTEM_EVENT: "Systemereignis",
};

// ============================================================================
// AUTOMOTIVE GERMAN TRANSLATIONS
// ============================================================================

export const AUTOMOTIVE_USER_ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrator",
  PICKUP_DRIVER: "Abholfahrer",
  WAREHOUSE: "Lager",
  DISPOSAL: "Entsorgung",
};

export const AUTOMOTIVE_TASK_STATUS_LABELS: Record<string, string> = {
  OPEN: "Offen",
  PICKED_UP: "Abgeholt",
  IN_TRANSIT: "Unterwegs",
  DROPPED_OFF: "Abgestellt",
  TAKEN_OVER: "Übernommen",
  WEIGHED: "Gewogen",
  DISPOSED: "Entsorgt",
  CANCELLED: "Storniert",
};

export const BOX_STATUS_LABELS: Record<string, string> = {
  AT_STAND: "Am Stellplatz",
  IN_TRANSIT: "Unterwegs",
  AT_WAREHOUSE: "Im Lager",
  AT_DISPOSAL: "Bei Entsorgung",
  RETIRED: "Ausgemustert",
};

export const TASK_TYPE_LABELS: Record<string, string> = {
  DAILY_FULL: "Tägliche Abholung",
  MANUAL: "Manueller Auftrag",
  LEGACY: "Legacy-Auftrag",
};
