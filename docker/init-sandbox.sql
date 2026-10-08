-- Initialization script for Dedicated Execution PostgreSQL DB
-- Creates restricted roles for sandboxing arbitrary user queries

-- Revoke default public schema create privilege
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

-- Create sandbox_readonly role: SELECT only on allowed dataset schemas
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'sandbox_readonly') THEN
    CREATE ROLE sandbox_readonly WITH LOGIN PASSWORD 'sandbox_ro_password_dev' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
END
$$;

-- Create sandbox_writable role: DDL/DML only in ephemeral or user-owned schemas
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'sandbox_writable') THEN
    CREATE ROLE sandbox_writable WITH LOGIN PASSWORD 'sandbox_wr_password_dev' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
END
$$;

-- Global parameter overrides for sandbox safety
ALTER ROLE sandbox_readonly SET statement_timeout = '5000';
ALTER ROLE sandbox_readonly SET lock_timeout = '1000';
ALTER ROLE sandbox_readonly SET idle_in_transaction_session_timeout = '5000';

ALTER ROLE sandbox_writable SET statement_timeout = '10000';
ALTER ROLE sandbox_writable SET lock_timeout = '1000';
ALTER ROLE sandbox_writable SET idle_in_transaction_session_timeout = '5000';
