-- AddColumn: eventHash to webhook_events
-- For existing rows, generate a unique placeholder hash using the row id.
-- The application will always provide a real hash for new rows.

ALTER TABLE "webhook_events" ADD COLUMN "eventHash" TEXT;

-- Backfill existing rows with a deterministic unique value based on id
UPDATE "webhook_events" SET "eventHash" = 'legacy-' || id WHERE "eventHash" IS NULL;

-- Now make it NOT NULL and add the unique constraint
ALTER TABLE "webhook_events" ALTER COLUMN "eventHash" SET NOT NULL;
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_eventHash_key" UNIQUE ("eventHash");
