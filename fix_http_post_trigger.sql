-- ====================================================================
-- FIX FOR: function extensions.http_post(text, text, unknown, text[]) does not exist
-- Run these commands in your Supabase SQL Editor:
-- ====================================================================

-- OPTION 1: Enable the PG HTTP Extension (RECOMMENDED)
-- This creates the extensions.http_post function so the webhooks can run.
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;


-- OPTION 2: If the extension is not supported or you want to disable the webhook trigger:
-- A. Find the trigger name on the "leads" table by running:
-- SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'leads';
--
-- B. Drop the trigger that is failing (usually prefixed with "supabase_functions_trigger" or similar):
-- DROP TRIGGER <trigger_name> ON leads;
