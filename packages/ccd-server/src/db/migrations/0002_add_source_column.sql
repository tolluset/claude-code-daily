-- Migration: Add source column to sessions table
-- Version: 0002
-- Date: 2026-01-19

-- Add source column to track session origin (claude vs opencode)
ALTER TABLE sessions 
ADD COLUMN source TEXT DEFAULT 'claude' 
CHECK (source IN ('claude', 'opencode'));
