import { 
  users, customers, customerContainers, warehouseContainers, tasks, activityLogs, fillHistory, scanEvents,
  departments,
  type User, type InsertUser, 
  type Customer, type CustomerContainer, type WarehouseContainer, 
  type Task, type ActivityLog, type FillHistory, type ScanEvent,
  type Department, type InsertDepartment,
  isValidTaskTransition, getTimestampFieldForStatus
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql, or } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;

  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer>;
  updateCustomer(id: string, data: Partial<Customer>): Promise<Customer | undefined>;

  // Customer Containers
  getCustomerContainers(): Promise<CustomerContainer[]>;
  getCustomerContainer(id: string): Promise<CustomerContainer | undefined>;
  getCustomerContainerByQR(qrCode: string): Promise<CustomerContainer | undefined>;
  createCustomerContainer(data: Omit<CustomerContainer, 'createdAt' | 'updatedAt'>): Promise<CustomerContainer>;
  updateCustomerContainer(id: string, data: Partial<CustomerContainer>): Promise<CustomerContainer | undefined>;

  // Warehouse Containers
  getWarehouseContainers(): Promise<WarehouseContainer[]>;
  getWarehouseContainer(id: string): Promise<WarehouseContainer | undefined>;
  getWarehouseContainerByQR(qrCode: string): Promise<WarehouseContainer | undefined>;
  createWarehouseContainer(data: Omit<WarehouseContainer, 'createdAt' | 'updatedAt'>): Promise<WarehouseContainer>;
  updateWarehouseContainer(id: string, data: Partial<WarehouseContainer>): Promise<WarehouseContainer | undefined>;

  // Tasks
  getTasks(filters?: { assignedTo?: string; status?: string; date?: Date }): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task>;
  updateTask(id: string, data: Partial<Task>): Promise<Task | undefined>;
  updateTaskStatus(id: string, newStatus: string, userId?: string): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;

  // Scan Events
  getScanEvents(filters?: { containerId?: string; taskId?: string; userId?: string }): Promise<ScanEvent[]>;
  getScanEvent(id: string): Promise<ScanEvent | undefined>;
  createScanEvent(data: Omit<ScanEvent, 'id' | 'createdAt'>): Promise<ScanEvent>;

  // Activity Logs
  getActivityLogs(filters?: { userId?: string; containerId?: string; type?: string; taskId?: string }): Promise<ActivityLog[]>;
  createActivityLog(data: Omit<ActivityLog, 'id' | 'createdAt'>): Promise<ActivityLog>;

  // Fill History
  getFillHistory(warehouseContainerId: string): Promise<FillHistory[]>;
  createFillHistory(data: Omit<FillHistory, 'id' | 'createdAt'>): Promise<FillHistory>;

  // Departments
  getDepartments(): Promise<Department[]>;
  getDepartment(id: string): Promise<Department | undefined>;
  createDepartment(data: InsertDepartment): Promise<Department>;
  updateDepartment(id: string, data: Partial<InsertDepartment>): Promise<Department | undefined>;
  deleteDepartment(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // ============================================================================
  // USERS
  // ============================================================================
  
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users).where(eq(users.isActive, true));
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const updateData = { ...data, updatedAt: new Date() };
    const [user] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  // ============================================================================
  // CUSTOMERS
  // ============================================================================

  async getCustomers(): Promise<Customer[]> {
    return db.select().from(customers).where(eq(customers.isActive, true));
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async createCustomer(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const [customer] = await db.insert(customers).values(data).returning();
    return customer;
  }

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer | undefined> {
    const updateData = { ...data, updatedAt: new Date() };
    const [customer] = await db.update(customers).set(updateData).where(eq(customers.id, id)).returning();
    return customer || undefined;
  }

  // ============================================================================
  // CUSTOMER CONTAINERS
  // ============================================================================

  async getCustomerContainers(): Promise<CustomerContainer[]> {
    return db.select().from(customerContainers).where(eq(customerContainers.isActive, true));
  }

  async getCustomerContainer(id: string): Promise<CustomerContainer | undefined> {
    const [container] = await db.select().from(customerContainers).where(eq(customerContainers.id, id));
    return container || undefined;
  }

  async getCustomerContainerByQR(qrCode: string): Promise<CustomerContainer | undefined> {
    const [container] = await db.select().from(customerContainers).where(eq(customerContainers.qrCode, qrCode));
    return container || undefined;
  }

  async createCustomerContainer(data: Omit<CustomerContainer, 'createdAt' | 'updatedAt'>): Promise<CustomerContainer> {
    const [container] = await db.insert(customerContainers).values(data).returning();
    return container;
  }

  async updateCustomerContainer(id: string, data: Partial<CustomerContainer>): Promise<CustomerContainer | undefined> {
    const updateData = { ...data, updatedAt: new Date() };
    const [container] = await db.update(customerContainers).set(updateData).where(eq(customerContainers.id, id)).returning();
    return container || undefined;
  }

  // ============================================================================
  // WAREHOUSE CONTAINERS
  // ============================================================================

  async getWarehouseContainers(): Promise<WarehouseContainer[]> {
    return db.select().from(warehouseContainers).where(eq(warehouseContainers.isActive, true));
  }

  async getWarehouseContainer(id: string): Promise<WarehouseContainer | undefined> {
    const [container] = await db.select().from(warehouseContainers).where(eq(warehouseContainers.id, id));
    return container || undefined;
  }

  async getWarehouseContainerByQR(qrCode: string): Promise<WarehouseContainer | undefined> {
    const [container] = await db.select().from(warehouseContainers).where(eq(warehouseContainers.qrCode, qrCode));
    return container || undefined;
  }

  async createWarehouseContainer(data: Omit<WarehouseContainer, 'createdAt' | 'updatedAt'>): Promise<WarehouseContainer> {
    const [container] = await db.insert(warehouseContainers).values(data).returning();
    return container;
  }

  async updateWarehouseContainer(id: string, data: Partial<WarehouseContainer>): Promise<WarehouseContainer | undefined> {
    const updateData = { ...data, updatedAt: new Date() };
    const [container] = await db.update(warehouseContainers).set(updateData).where(eq(warehouseContainers.id, id)).returning();
    return container || undefined;
  }

  // ============================================================================
  // TASKS
  // ============================================================================

  async getTasks(filters?: { assignedTo?: string; status?: string; date?: Date }): Promise<Task[]> {
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

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async createTask(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const [task] = await db.insert(tasks).values(data).returning();
    return task;
  }

  async updateTask(id: string, data: Partial<Task>): Promise<Task | undefined> {
    const updateData = { ...data, updatedAt: new Date() };
    const [task] = await db.update(tasks).set(updateData).where(eq(tasks.id, id)).returning();
    return task || undefined;
  }

  /**
   * Update task status with validation and automatic timestamp setting
   * Returns undefined if transition is invalid
   */
  async updateTaskStatus(id: string, newStatus: string, userId?: string): Promise<Task | undefined> {
    const currentTask = await this.getTask(id);
    if (!currentTask) return undefined;

    // Validate status transition
    if (!isValidTaskTransition(currentTask.status, newStatus)) {
      console.warn(`Invalid task transition: ${currentTask.status} -> ${newStatus}`);
      return undefined;
    }

    // Build update data with appropriate timestamp
    const updateData: Partial<Task> = {
      status: newStatus,
      updatedAt: new Date(),
    };

    // Set the appropriate timestamp for this status
    const timestampField = getTimestampFieldForStatus(newStatus);
    if (timestampField) {
      (updateData as any)[timestampField] = new Date();
    }

    // If assigning, also set assignedTo if provided
    if (newStatus === 'ASSIGNED' && userId) {
      updateData.assignedTo = userId;
    }

    // Auto-assign driver when accepting from OFFEN or PLANNED state
    if (newStatus === 'ACCEPTED' && (currentTask.status === 'OFFEN' || currentTask.status === 'PLANNED') && userId) {
      updateData.assignedTo = userId;
      updateData.assignedAt = new Date();
    }

    // If accepting from ASSIGNED and driver info provided, ensure assignedTo is set
    if (newStatus === 'ACCEPTED' && userId && !currentTask.assignedTo) {
      updateData.assignedTo = userId;
      updateData.assignedAt = new Date();
    }

    const [task] = await db.update(tasks).set(updateData).where(eq(tasks.id, id)).returning();
    return task || undefined;
  }

  /**
   * Delete a task and handle related data (scan events, activity logs, fill history)
   * Returns true if the task was deleted, false if not found
   */
  async deleteTask(id: string): Promise<boolean> {
    const existingTask = await this.getTask(id);
    if (!existingTask) return false;

    // Set taskId to null for related scan events (don't delete them - preserve history)
    await db.update(scanEvents).set({ taskId: null }).where(eq(scanEvents.taskId, id));
    
    // Set taskId to null for related activity logs (keep logs but unlink from deleted task)
    await db.update(activityLogs).set({ taskId: null }).where(eq(activityLogs.taskId, id));
    
    // Set taskId to null for related fill history entries
    await db.update(fillHistory).set({ taskId: null }).where(eq(fillHistory.taskId, id));
    
    // Now delete the task
    const result = await db.delete(tasks).where(eq(tasks.id, id)).returning();
    return result.length > 0;
  }

  // ============================================================================
  // SCAN EVENTS
  // ============================================================================

  async getScanEvents(filters?: { containerId?: string; taskId?: string; userId?: string }): Promise<ScanEvent[]> {
    const conditions = [];
    
    if (filters?.containerId) {
      conditions.push(eq(scanEvents.containerId, filters.containerId));
    }
    if (filters?.taskId) {
      conditions.push(eq(scanEvents.taskId, filters.taskId));
    }
    if (filters?.userId) {
      conditions.push(eq(scanEvents.scannedByUserId, filters.userId));
    }

    if (conditions.length > 0) {
      return db.select().from(scanEvents).where(and(...conditions)).orderBy(desc(scanEvents.scannedAt));
    }
    return db.select().from(scanEvents).orderBy(desc(scanEvents.scannedAt));
  }

  async getScanEvent(id: string): Promise<ScanEvent | undefined> {
    const [event] = await db.select().from(scanEvents).where(eq(scanEvents.id, id));
    return event || undefined;
  }

  async createScanEvent(data: Omit<ScanEvent, 'id' | 'createdAt'>): Promise<ScanEvent> {
    const [event] = await db.insert(scanEvents).values(data).returning();
    return event;
  }

  // ============================================================================
  // ACTIVITY LOGS
  // ============================================================================

  async getActivityLogs(filters?: { userId?: string; containerId?: string; type?: string; taskId?: string }): Promise<ActivityLog[]> {
    const conditions = [];
    
    if (filters?.userId) {
      conditions.push(eq(activityLogs.userId, filters.userId));
    }
    if (filters?.containerId) {
      conditions.push(eq(activityLogs.containerId, filters.containerId));
    }
    if (filters?.type) {
      conditions.push(eq(activityLogs.type, filters.type));
    }
    if (filters?.taskId) {
      conditions.push(eq(activityLogs.taskId, filters.taskId));
    }

    if (conditions.length > 0) {
      return db.select().from(activityLogs).where(and(...conditions)).orderBy(desc(activityLogs.timestamp));
    }
    return db.select().from(activityLogs).orderBy(desc(activityLogs.timestamp));
  }

  async createActivityLog(data: Omit<ActivityLog, 'id' | 'createdAt'>): Promise<ActivityLog> {
    // Ensure action is set (legacy field, same as type for backward compatibility)
    const logData = {
      ...data,
      action: data.action || data.type,
    };
    const [log] = await db.insert(activityLogs).values(logData).returning();
    return log;
  }

  // ============================================================================
  // FILL HISTORY
  // ============================================================================

  async getFillHistory(warehouseContainerId: string): Promise<FillHistory[]> {
    return db.select().from(fillHistory)
      .where(eq(fillHistory.warehouseContainerId, warehouseContainerId))
      .orderBy(desc(fillHistory.createdAt));
  }

  async createFillHistory(data: Omit<FillHistory, 'id' | 'createdAt'>): Promise<FillHistory> {
    const [history] = await db.insert(fillHistory).values(data).returning();
    return history;
  }

  // ============================================================================
  // DEPARTMENTS
  // ============================================================================

  async getDepartments(): Promise<Department[]> {
    return db.select().from(departments).where(eq(departments.isActive, true));
  }

  async getDepartment(id: string): Promise<Department | undefined> {
    const [department] = await db.select().from(departments).where(eq(departments.id, id));
    return department || undefined;
  }

  async createDepartment(data: InsertDepartment): Promise<Department> {
    const [department] = await db.insert(departments).values(data).returning();
    return department;
  }

  async updateDepartment(id: string, data: Partial<InsertDepartment>): Promise<Department | undefined> {
    const updateData = { ...data, updatedAt: new Date() };
    const [department] = await db.update(departments).set(updateData).where(eq(departments.id, id)).returning();
    return department || undefined;
  }

  async deleteDepartment(id: string): Promise<boolean> {
    const [department] = await db.update(departments)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(departments.id, id))
      .returning();
    return !!department;
  }
}

export const storage = new DatabaseStorage();
