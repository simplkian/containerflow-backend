-- ContainerFlow Supabase Bootstrap Script
-- Run this in the Supabase SQL Editor before running Drizzle migrations
-- ============================================================================

-- Enable required extensions for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUM TYPES (matching Drizzle schema)
-- ============================================================================

-- Drop existing enums if they exist (for clean setup)
DO $$ BEGIN
  DROP TYPE IF EXISTS user_role CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP TYPE IF EXISTS container_status CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP TYPE IF EXISTS task_status CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP TYPE IF EXISTS scan_context CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP TYPE IF EXISTS location_type CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP TYPE IF EXISTS activity_log_type CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP TYPE IF EXISTS priority CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP TYPE IF EXISTS quantity_unit CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Create enums
CREATE TYPE user_role AS ENUM ('ADMIN', 'DRIVER');

CREATE TYPE container_status AS ENUM (
  'AT_WAREHOUSE',
  'AT_CUSTOMER',
  'IN_TRANSIT',
  'OUT_OF_SERVICE'
);

CREATE TYPE task_status AS ENUM (
  'PLANNED',
  'ASSIGNED',
  'ACCEPTED',
  'PICKED_UP',
  'IN_TRANSIT',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED'
);

CREATE TYPE scan_context AS ENUM (
  'WAREHOUSE_INFO',
  'CUSTOMER_INFO',
  'TASK_ACCEPT_AT_CUSTOMER',
  'TASK_PICKUP',
  'TASK_COMPLETE_AT_WAREHOUSE',
  'INVENTORY_CHECK',
  'MAINTENANCE'
);

CREATE TYPE location_type AS ENUM (
  'WAREHOUSE',
  'CUSTOMER',
  'OTHER'
);

CREATE TYPE activity_log_type AS ENUM (
  'TASK_CREATED',
  'TASK_ASSIGNED',
  'TASK_ACCEPTED',
  'TASK_PICKED_UP',
  'TASK_IN_TRANSIT',
  'TASK_DELIVERED',
  'TASK_COMPLETED',
  'TASK_CANCELLED',
  'CONTAINER_SCANNED_AT_CUSTOMER',
  'CONTAINER_SCANNED_AT_WAREHOUSE',
  'CONTAINER_STATUS_CHANGED',
  'WEIGHT_RECORDED',
  'MANUAL_EDIT',
  'SYSTEM_EVENT'
);

CREATE TYPE priority AS ENUM ('normal', 'high', 'urgent');

CREATE TYPE quantity_unit AS ENUM ('kg', 't', 'm3', 'pcs');

-- ============================================================================
-- NOTE: Tables will be created by Drizzle migrations (npm run db:push)
-- After running migrations, disable RLS on tables if not using Supabase Auth:
-- ============================================================================

-- Run these AFTER Drizzle migrations create the tables:
/*
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE customer_containers DISABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_containers DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE scan_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE fill_history DISABLE ROW LEVEL SECURITY;
*/

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT 'ContainerFlow Supabase bootstrap completed! Now run: npm run db:push' AS status;
