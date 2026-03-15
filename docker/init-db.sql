-- ShopQA Database Init Script
-- This runs when the Docker PostgreSQL container first starts

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Grant all privileges to the app user
GRANT ALL PRIVILEGES ON DATABASE shopqa TO shopqa_user;
