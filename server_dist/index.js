var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express from "express";

// server/routes.ts
import { createServer } from "node:http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  activityLogs: () => activityLogs,
  activityLogsRelations: () => activityLogsRelations,
  customerContainers: () => customerContainers,
  customerContainersRelations: () => customerContainersRelations,
  fillHistory: () => fillHistory,
  fillHistoryRelations: () => fillHistoryRelations,
  insertActivityLogSchema: () => insertActivityLogSchema,
  insertCustomerContainerSchema: () => insertCustomerContainerSchema,
  insertFillHistorySchema: () => insertFillHistorySchema,
  insertTaskSchema: () => insertTaskSchema,
  insertUserSchema: () => insertUserSchema,
  insertWarehouseContainerSchema: () => insertWarehouseContainerSchema,
  tasks: () => tasks,
  tasksRelations: () => tasksRelations,
  users: () => users,
  usersRelations: () => usersRelations,
  warehouseContainers: () => warehouseContainers,
  warehouseContainersRelations: () => warehouseContainersRelations
});
import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("driver"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks),
  activityLogs: many(activityLogs)
}));
var customerContainers = pgTable("customer_containers", {
  id: varchar("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  location: text("location").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  materialType: text("material_type").notNull(),
  lastEmptied: timestamp("last_emptied"),
  qrCode: text("qr_code").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var customerContainersRelations = relations(customerContainers, ({ many }) => ({
  tasks: many(tasks)
}));
var warehouseContainers = pgTable("warehouse_containers", {
  id: varchar("id").primaryKey(),
  location: text("location").notNull(),
  materialType: text("material_type").notNull(),
  currentAmount: real("current_amount").notNull().default(0),
  maxCapacity: real("max_capacity").notNull(),
  lastEmptied: timestamp("last_emptied"),
  qrCode: text("qr_code").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var warehouseContainersRelations = relations(warehouseContainers, ({ many }) => ({
  tasks: many(tasks),
  fillHistory: many(fillHistory)
}));
var fillHistory = pgTable("fill_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  warehouseContainerId: varchar("warehouse_container_id").notNull().references(() => warehouseContainers.id),
  amountAdded: real("amount_added").notNull(),
  taskId: varchar("task_id").references(() => tasks.id),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var fillHistoryRelations = relations(fillHistory, ({ one }) => ({
  warehouseContainer: one(warehouseContainers, {
    fields: [fillHistory.warehouseContainerId],
    references: [warehouseContainers.id]
  }),
  task: one(tasks, {
    fields: [fillHistory.taskId],
    references: [tasks.id]
  })
}));
var tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  containerID: varchar("container_id").notNull().references(() => customerContainers.id),
  assignedTo: varchar("assigned_to").references(() => users.id),
  status: text("status").notNull().default("open"),
  scheduledTime: timestamp("scheduled_time"),
  priority: text("priority").notNull().default("normal"),
  notes: text("notes"),
  materialType: text("material_type").notNull(),
  estimatedAmount: real("estimated_amount"),
  pickupTimestamp: timestamp("pickup_timestamp"),
  pickupLocation: jsonb("pickup_location"),
  deliveryTimestamp: timestamp("delivery_timestamp"),
  deliveryContainerID: varchar("delivery_container_id").references(() => warehouseContainers.id),
  cancellationReason: text("cancellation_reason"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var tasksRelations = relations(tasks, ({ one }) => ({
  container: one(customerContainers, {
    fields: [tasks.containerID],
    references: [customerContainers.id]
  }),
  assignee: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id]
  }),
  deliveryContainer: one(warehouseContainers, {
    fields: [tasks.deliveryContainerID],
    references: [warehouseContainers.id]
  }),
  creator: one(users, {
    fields: [tasks.createdBy],
    references: [users.id]
  })
}));
var activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  taskId: varchar("task_id").references(() => tasks.id),
  containerId: varchar("container_id"),
  location: jsonb("location"),
  details: text("details"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id]
  }),
  task: one(tasks, {
    fields: [activityLogs.taskId],
    references: [tasks.id]
  })
}));
var insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  name: true,
  role: true
});
var insertCustomerContainerSchema = createInsertSchema(customerContainers);
var insertWarehouseContainerSchema = createInsertSchema(warehouseContainers);
var insertTaskSchema = createInsertSchema(tasks);
var insertActivityLogSchema = createInsertSchema(activityLogs);
var insertFillHistorySchema = createInsertSchema(fillHistory);

// server/db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
var { Pool } = pg;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle(pool, { schema: schema_exports });

// server/storage.ts
import { eq, desc, and, gte, lte } from "drizzle-orm";
var DatabaseStorage = class {
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async getUsers() {
    return db.select().from(users).where(eq(users.isActive, true));
  }
  async updateUser(id, data) {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user || void 0;
  }
  async getCustomerContainers() {
    return db.select().from(customerContainers).where(eq(customerContainers.isActive, true));
  }
  async getCustomerContainer(id) {
    const [container] = await db.select().from(customerContainers).where(eq(customerContainers.id, id));
    return container || void 0;
  }
  async getCustomerContainerByQR(qrCode) {
    const [container] = await db.select().from(customerContainers).where(eq(customerContainers.qrCode, qrCode));
    return container || void 0;
  }
  async createCustomerContainer(data) {
    const [container] = await db.insert(customerContainers).values(data).returning();
    return container;
  }
  async updateCustomerContainer(id, data) {
    const [container] = await db.update(customerContainers).set(data).where(eq(customerContainers.id, id)).returning();
    return container || void 0;
  }
  async getWarehouseContainers() {
    return db.select().from(warehouseContainers).where(eq(warehouseContainers.isActive, true));
  }
  async getWarehouseContainer(id) {
    const [container] = await db.select().from(warehouseContainers).where(eq(warehouseContainers.id, id));
    return container || void 0;
  }
  async getWarehouseContainerByQR(qrCode) {
    const [container] = await db.select().from(warehouseContainers).where(eq(warehouseContainers.qrCode, qrCode));
    return container || void 0;
  }
  async createWarehouseContainer(data) {
    const [container] = await db.insert(warehouseContainers).values(data).returning();
    return container;
  }
  async updateWarehouseContainer(id, data) {
    const [container] = await db.update(warehouseContainers).set(data).where(eq(warehouseContainers.id, id)).returning();
    return container || void 0;
  }
  async getTasks(filters) {
    let query = db.select().from(tasks);
    const conditions = [];
    if (filters?.assignedTo) {
      conditions.push(eq(tasks.assignedTo, filters.assignedTo));
    }
    if (filters?.status) {
      conditions.push(eq(tasks.status, filters.status));
    }
    if (filters?.date) {
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);
      conditions.push(gte(tasks.scheduledTime, startOfDay));
      conditions.push(lte(tasks.scheduledTime, endOfDay));
    }
    if (conditions.length > 0) {
      return db.select().from(tasks).where(and(...conditions)).orderBy(desc(tasks.createdAt));
    }
    return db.select().from(tasks).orderBy(desc(tasks.createdAt));
  }
  async getTask(id) {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || void 0;
  }
  async createTask(data) {
    const [task] = await db.insert(tasks).values(data).returning();
    return task;
  }
  async updateTask(id, data) {
    const [task] = await db.update(tasks).set(data).where(eq(tasks.id, id)).returning();
    return task || void 0;
  }
  async getActivityLogs(filters) {
    const conditions = [];
    if (filters?.userId) {
      conditions.push(eq(activityLogs.userId, filters.userId));
    }
    if (filters?.containerId) {
      conditions.push(eq(activityLogs.containerId, filters.containerId));
    }
    if (filters?.action) {
      conditions.push(eq(activityLogs.action, filters.action));
    }
    if (conditions.length > 0) {
      return db.select().from(activityLogs).where(and(...conditions)).orderBy(desc(activityLogs.createdAt));
    }
    return db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt));
  }
  async createActivityLog(data) {
    const [log2] = await db.insert(activityLogs).values(data).returning();
    return log2;
  }
  async getFillHistory(warehouseContainerId) {
    return db.select().from(fillHistory).where(eq(fillHistory.warehouseContainerId, warehouseContainerId)).orderBy(desc(fillHistory.createdAt));
  }
  async createFillHistory(data) {
    const [history] = await db.insert(fillHistory).values(data).returning();
    return history;
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import { createHash } from "crypto";
function hashPassword(password) {
  return createHash("sha256").update(password).digest("hex");
}
async function registerRoutes(app2) {
  app2.head("/api/health", (req, res) => {
    res.status(200).end();
  });
  app2.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app2.get("/api/auth/replit", (req, res) => {
    const userId = req.headers["x-replit-user-id"];
    const userName = req.headers["x-replit-user-name"];
    const userRoles = req.headers["x-replit-user-roles"];
    if (!userId || !userName) {
      return res.status(401).json({
        error: "Not authenticated with Replit",
        authenticated: false
      });
    }
    res.json({
      authenticated: true,
      replitUser: {
        id: userId,
        name: userName,
        roles: userRoles ? userRoles.split(",") : []
      }
    });
  });
  app2.post("/api/auth/replit/login", async (req, res) => {
    try {
      const userId = req.headers["x-replit-user-id"];
      const userName = req.headers["x-replit-user-name"];
      if (!userId || !userName) {
        return res.status(401).json({ error: "Not authenticated with Replit" });
      }
      const replitId = `replit-${userId}`;
      const replitEmail = `${userName}@replit.user`;
      let user = await storage.getUserByEmail(replitEmail);
      if (!user) {
        const existingUsers = await storage.getUsers();
        const isFirstUser = existingUsers.length === 0;
        user = await storage.createUser({
          email: replitEmail,
          password: hashPassword(`replit-${userId}-${Date.now()}`),
          name: userName,
          role: isFirstUser ? "admin" : "driver"
        });
      }
      if (!user.isActive) {
        return res.status(403).json({ error: "Account is deactivated" });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Replit auth error:", error);
      res.status(500).json({ error: "Replit login failed" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const hashedPassword = hashPassword(password);
      if (user.password !== hashedPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      if (!user.isActive) {
        return res.status(403).json({ error: "Account is deactivated" });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });
  app2.get("/api/users", async (req, res) => {
    try {
      const users2 = await storage.getUsers();
      const usersWithoutPasswords = users2.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });
  app2.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });
  app2.post("/api/users", async (req, res) => {
    try {
      const { email, password, name, role } = req.body;
      if (!email || !password || !name) {
        return res.status(400).json({ error: "Email, password, and name are required" });
      }
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: "Email already exists" });
      }
      const hashedPassword = hashPassword(password);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        name,
        role: role || "driver"
      });
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to create user" });
    }
  });
  app2.patch("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });
  app2.get("/api/containers/customer", async (req, res) => {
    try {
      const containers = await storage.getCustomerContainers();
      res.json(containers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer containers" });
    }
  });
  app2.get("/api/containers/customer/:id", async (req, res) => {
    try {
      const container = await storage.getCustomerContainer(req.params.id);
      if (!container) {
        return res.status(404).json({ error: "Container not found" });
      }
      res.json(container);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch container" });
    }
  });
  app2.get("/api/containers/customer/qr/:qrCode", async (req, res) => {
    try {
      const container = await storage.getCustomerContainerByQR(req.params.qrCode);
      if (!container) {
        return res.status(404).json({ error: "Container not found" });
      }
      res.json(container);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch container" });
    }
  });
  app2.post("/api/containers/customer", async (req, res) => {
    try {
      const container = await storage.createCustomerContainer(req.body);
      res.status(201).json(container);
    } catch (error) {
      res.status(500).json({ error: "Failed to create container" });
    }
  });
  app2.patch("/api/containers/customer/:id", async (req, res) => {
    try {
      const container = await storage.updateCustomerContainer(req.params.id, req.body);
      if (!container) {
        return res.status(404).json({ error: "Container not found" });
      }
      res.json(container);
    } catch (error) {
      res.status(500).json({ error: "Failed to update container" });
    }
  });
  app2.get("/api/containers/warehouse", async (req, res) => {
    try {
      const containers = await storage.getWarehouseContainers();
      res.json(containers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch warehouse containers" });
    }
  });
  app2.get("/api/containers/warehouse/:id", async (req, res) => {
    try {
      const container = await storage.getWarehouseContainer(req.params.id);
      if (!container) {
        return res.status(404).json({ error: "Container not found" });
      }
      res.json(container);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch container" });
    }
  });
  app2.get("/api/containers/warehouse/qr/:qrCode", async (req, res) => {
    try {
      const container = await storage.getWarehouseContainerByQR(req.params.qrCode);
      if (!container) {
        return res.status(404).json({ error: "Container not found" });
      }
      res.json(container);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch container" });
    }
  });
  app2.post("/api/containers/warehouse", async (req, res) => {
    try {
      const container = await storage.createWarehouseContainer(req.body);
      res.status(201).json(container);
    } catch (error) {
      res.status(500).json({ error: "Failed to create container" });
    }
  });
  app2.patch("/api/containers/warehouse/:id", async (req, res) => {
    try {
      const container = await storage.updateWarehouseContainer(req.params.id, req.body);
      if (!container) {
        return res.status(404).json({ error: "Container not found" });
      }
      res.json(container);
    } catch (error) {
      res.status(500).json({ error: "Failed to update container" });
    }
  });
  app2.get("/api/containers/warehouse/:id/history", async (req, res) => {
    try {
      const history = await storage.getFillHistory(req.params.id);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch fill history" });
    }
  });
  app2.get("/api/tasks", async (req, res) => {
    try {
      const { assignedTo, status, date } = req.query;
      const filters = {};
      if (assignedTo) filters.assignedTo = assignedTo;
      if (status) filters.status = status;
      if (date) filters.date = new Date(date);
      const taskList = await storage.getTasks(Object.keys(filters).length > 0 ? filters : void 0);
      res.json(taskList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });
  app2.get("/api/tasks/:id", async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch task" });
    }
  });
  app2.post("/api/tasks", async (req, res) => {
    try {
      const task = await storage.createTask(req.body);
      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to create task" });
    }
  });
  app2.patch("/api/tasks/:id", async (req, res) => {
    try {
      const task = await storage.updateTask(req.params.id, req.body);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to update task" });
    }
  });
  app2.post("/api/tasks/:id/pickup", async (req, res) => {
    try {
      const { userId, location } = req.body;
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      const updatedTask = await storage.updateTask(req.params.id, {
        status: "in_progress",
        pickupTimestamp: /* @__PURE__ */ new Date(),
        pickupLocation: location
      });
      await storage.createActivityLog({
        userId,
        action: "pickup",
        taskId: task.id,
        containerId: task.containerID,
        location,
        details: `Picked up container ${task.containerID}`
      });
      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ error: "Failed to record pickup" });
    }
  });
  app2.post("/api/tasks/:id/delivery", async (req, res) => {
    try {
      const { userId, warehouseContainerId, amount, location } = req.body;
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      const warehouseContainer = await storage.getWarehouseContainer(warehouseContainerId);
      if (!warehouseContainer) {
        return res.status(404).json({ error: "Warehouse container not found" });
      }
      if (warehouseContainer.materialType !== task.materialType) {
        return res.status(400).json({ error: "Material type mismatch" });
      }
      const availableSpace = warehouseContainer.maxCapacity - warehouseContainer.currentAmount;
      if (amount > availableSpace) {
        return res.status(400).json({ error: "Insufficient capacity", availableSpace });
      }
      const updatedTask = await storage.updateTask(req.params.id, {
        status: "completed",
        deliveryTimestamp: /* @__PURE__ */ new Date(),
        deliveryContainerID: warehouseContainerId
      });
      await storage.updateWarehouseContainer(warehouseContainerId, {
        currentAmount: warehouseContainer.currentAmount + amount
      });
      await storage.createFillHistory({
        warehouseContainerId,
        amountAdded: amount,
        taskId: task.id
      });
      await storage.updateCustomerContainer(task.containerID, {
        lastEmptied: /* @__PURE__ */ new Date()
      });
      await storage.createActivityLog({
        userId,
        action: "delivery",
        taskId: task.id,
        containerId: warehouseContainerId,
        location,
        details: `Delivered ${amount}kg to container ${warehouseContainerId}`
      });
      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ error: "Failed to record delivery" });
    }
  });
  app2.post("/api/tasks/:id/cancel", async (req, res) => {
    try {
      const { userId, reason } = req.body;
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      const updatedTask = await storage.updateTask(req.params.id, {
        status: "cancelled",
        cancellationReason: reason
      });
      await storage.createActivityLog({
        userId,
        action: "cancelled",
        taskId: task.id,
        containerId: task.containerID,
        details: `Task cancelled: ${reason}`
      });
      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ error: "Failed to cancel task" });
    }
  });
  app2.get("/api/activity-logs", async (req, res) => {
    try {
      const { userId, containerId, action, startDate, endDate } = req.query;
      const filters = {};
      if (userId) filters.userId = userId;
      if (containerId) filters.containerId = containerId;
      if (action) filters.action = action;
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);
      const logs = await storage.getActivityLogs(Object.keys(filters).length > 0 ? filters : void 0);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activity logs" });
    }
  });
  app2.get("/api/activity-logs/export/csv", async (req, res) => {
    try {
      const { userId, containerId, action, startDate, endDate } = req.query;
      const filters = {};
      if (userId) filters.userId = userId;
      if (containerId) filters.containerId = containerId;
      if (action) filters.action = action;
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);
      const logs = await storage.getActivityLogs(Object.keys(filters).length > 0 ? filters : void 0);
      const users2 = await storage.getUsers();
      const getUserName = (id) => {
        const user = users2.find((u) => u.id === id);
        return user?.name || "Unknown";
      };
      const csvHeader = "ID,Date,Time,Driver,Action,Container ID,Task ID,Details\n";
      const csvRows = logs.map((log2) => {
        const date = new Date(log2.createdAt);
        const dateStr = date.toLocaleDateString("en-US");
        const timeStr = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
        const driverName = getUserName(log2.userId).replace(/,/g, ";");
        const action2 = log2.action.replace(/,/g, ";");
        const containerId2 = log2.containerId?.replace(/,/g, ";") || "";
        const taskId = log2.taskId?.replace(/,/g, ";") || "";
        const details = log2.details?.replace(/,/g, ";").replace(/\n/g, " ") || "";
        return `${log2.id},${dateStr},${timeStr},${driverName},${action2},${containerId2},${taskId},${details}`;
      }).join("\n");
      const csv = csvHeader + csvRows;
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=activity-log-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`);
      res.send(csv);
    } catch (error) {
      res.status(500).json({ error: "Failed to export activity logs" });
    }
  });
  app2.get("/api/analytics/driver-performance", async (req, res) => {
    try {
      const allTasks = await storage.getTasks();
      const users2 = await storage.getUsers();
      const drivers = users2.filter((u) => u.role === "driver");
      const now = /* @__PURE__ */ new Date();
      const today = now.toDateString();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - 7);
      const driverStats = drivers.map((driver) => {
        const driverTasks = allTasks.filter((t) => t.assignedTo === driver.id);
        const completedTasks = driverTasks.filter((t) => t.status === "completed");
        const completedToday = completedTasks.filter((t) => {
          if (!t.deliveryTimestamp) return false;
          return new Date(t.deliveryTimestamp).toDateString() === today;
        });
        const completedThisWeek = completedTasks.filter((t) => {
          if (!t.deliveryTimestamp) return false;
          const deliveryDate = new Date(t.deliveryTimestamp);
          return deliveryDate >= startOfWeek;
        });
        const avgDeliveryTime = completedTasks.length > 0 ? completedTasks.reduce((sum, t) => {
          if (t.pickupTimestamp && t.deliveryTimestamp) {
            return sum + (new Date(t.deliveryTimestamp).getTime() - new Date(t.pickupTimestamp).getTime());
          }
          return sum;
        }, 0) / completedTasks.length / (1e3 * 60) : 0;
        const completionRate = driverTasks.length > 0 ? Math.round(completedTasks.length / driverTasks.length * 100) : 0;
        return {
          id: driver.id,
          name: driver.name,
          email: driver.email,
          totalAssigned: driverTasks.length,
          totalCompleted: completedTasks.length,
          completedToday: completedToday.length,
          completedThisWeek: completedThisWeek.length,
          inProgress: driverTasks.filter((t) => t.status === "in_progress").length,
          completionRate,
          avgDeliveryTimeMinutes: Math.round(avgDeliveryTime)
        };
      });
      const overallStats = {
        totalDrivers: drivers.length,
        activeDrivers: driverStats.filter((d) => d.inProgress > 0 || d.completedToday > 0).length,
        totalCompletedToday: driverStats.reduce((sum, d) => sum + d.completedToday, 0),
        totalCompletedThisWeek: driverStats.reduce((sum, d) => sum + d.completedThisWeek, 0),
        avgCompletionRate: driverStats.length > 0 ? Math.round(driverStats.reduce((sum, d) => sum + d.completionRate, 0) / driverStats.length) : 0
      };
      res.json({
        drivers: driverStats,
        overall: overallStats
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch driver performance" });
    }
  });
  app2.get("/api/analytics/fill-trends", async (req, res) => {
    try {
      const warehouseContainers2 = await storage.getWarehouseContainers();
      const allTasks = await storage.getTasks();
      const now = /* @__PURE__ */ new Date();
      const daysAgo = (days) => {
        const date = new Date(now);
        date.setDate(date.getDate() - days);
        return date;
      };
      const dailyData = [];
      for (let i = 6; i >= 0; i--) {
        const date = daysAgo(i);
        const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const dayTasks = allTasks.filter((t) => {
          if (!t.deliveryTimestamp) return false;
          const taskDate = new Date(t.deliveryTimestamp);
          return taskDate.toDateString() === date.toDateString();
        });
        const totalDelivered = dayTasks.reduce((sum, t) => {
          const container = warehouseContainers2.find((c) => c.id === t.deliveryContainerID);
          return sum + (container ? 50 : 0);
        }, 0);
        dailyData.push({
          date: dateStr,
          deliveries: dayTasks.length,
          volumeKg: totalDelivered
        });
      }
      const currentFillLevels = warehouseContainers2.map((c) => ({
        id: c.id,
        location: c.location,
        materialType: c.materialType,
        currentAmount: c.currentAmount,
        maxCapacity: c.maxCapacity,
        fillPercentage: Math.round(c.currentAmount / c.maxCapacity * 100)
      }));
      const materialBreakdown = warehouseContainers2.reduce((acc, c) => {
        const existing = acc.find((m) => m.material === c.materialType);
        if (existing) {
          existing.currentAmount += c.currentAmount;
          existing.maxCapacity += c.maxCapacity;
        } else {
          acc.push({
            material: c.materialType,
            currentAmount: c.currentAmount,
            maxCapacity: c.maxCapacity
          });
        }
        return acc;
      }, []);
      res.json({
        dailyTrends: dailyData,
        containerLevels: currentFillLevels,
        materialBreakdown
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });
  app2.get("/api/dashboard/stats", async (req, res) => {
    try {
      const allTasks = await storage.getTasks();
      const warehouseContainers2 = await storage.getWarehouseContainers();
      const users2 = await storage.getUsers();
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = /* @__PURE__ */ new Date();
      todayEnd.setHours(23, 59, 59, 999);
      const todayTasks = allTasks.filter((t) => {
        const created = new Date(t.createdAt);
        return created >= today && created <= todayEnd;
      });
      const openTasks = allTasks.filter((t) => t.status === "open").length;
      const inProgressTasks = allTasks.filter((t) => t.status === "in_progress").length;
      const completedToday = todayTasks.filter((t) => t.status === "completed").length;
      const activeDrivers = users2.filter((u) => u.role === "driver" && u.isActive).length;
      const criticalContainers = warehouseContainers2.filter((c) => {
        const fillPercentage = c.currentAmount / c.maxCapacity * 100;
        return fillPercentage >= 80;
      }).length;
      const totalCapacity = warehouseContainers2.reduce((acc, c) => acc + c.maxCapacity, 0);
      const usedCapacity = warehouseContainers2.reduce((acc, c) => acc + c.currentAmount, 0);
      const availableCapacity = totalCapacity - usedCapacity;
      res.json({
        openTasks,
        inProgressTasks,
        completedToday,
        activeDrivers,
        criticalContainers,
        totalCapacity,
        availableCapacity
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/index.ts
import * as fs from "fs";
import * as path from "path";
var app = express();
var log = console.log;
function setupCors(app2) {
  app2.use((req, res, next) => {
    const origins = /* @__PURE__ */ new Set();
    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }
    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").forEach((d) => {
        origins.add(`https://${d.trim()}`);
      });
    }
    const origin = req.header("origin");
    if (origin && origins.has(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.header("Access-Control-Allow-Headers", "Content-Type");
      res.header("Access-Control-Allow-Credentials", "true");
    }
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
}
function setupBodyParsing(app2) {
  app2.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app2.use(express.urlencoded({ extended: false }));
}
function setupRequestLogging(app2) {
  app2.use((req, res, next) => {
    const start = Date.now();
    const path2 = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      if (!path2.startsWith("/api")) return;
      const duration = Date.now() - start;
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    });
    next();
  });
}
function getAppName() {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}
function serveExpoManifest(platform, res) {
  const manifestPath = path.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json"
  );
  if (!fs.existsSync(manifestPath)) {
    return res.status(404).json({ error: `Manifest not found for platform: ${platform}` });
  }
  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");
  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}
function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;
  log(`baseUrl`, baseUrl);
  log(`expsUrl`, expsUrl);
  const html = landingPageTemplate.replace(/BASE_URL_PLACEHOLDER/g, baseUrl).replace(/EXPS_URL_PLACEHOLDER/g, expsUrl).replace(/APP_NAME_PLACEHOLDER/g, appName);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}
function configureExpoAndLanding(app2) {
  const templatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html"
  );
  const landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
  const appName = getAppName();
  log("Serving static Expo files with dynamic manifest routing");
  app2.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    if (req.path !== "/" && req.path !== "/manifest") {
      return next();
    }
    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      return serveExpoManifest(platform, res);
    }
    if (req.path === "/") {
      return serveLandingPage({
        req,
        res,
        landingPageTemplate,
        appName
      });
    }
    next();
  });
  app2.use("/assets", express.static(path.resolve(process.cwd(), "assets")));
  app2.use(express.static(path.resolve(process.cwd(), "static-build")));
  log("Expo routing: Checking expo-platform header on / and /manifest");
}
function setupErrorHandler(app2) {
  app2.use((err, _req, res, _next) => {
    const error = err;
    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
}
(async () => {
  setupCors(app);
  setupBodyParsing(app);
  setupRequestLogging(app);
  configureExpoAndLanding(app);
  const server = await registerRoutes(app);
  setupErrorHandler(app);
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true
    },
    () => {
      log(`express server serving on port ${port}`);
    }
  );
})();
