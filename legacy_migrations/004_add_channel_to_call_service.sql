-- Add channel_id to call_services
ALTER TABLE call_services ADD COLUMN channel_id INTEGER REFERENCES channels(id);

-- Optional: ensure one active service per channel per user? 
-- For now, just adding the column.
