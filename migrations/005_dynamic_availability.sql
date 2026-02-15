-- Create Availability Ranges table
CREATE TABLE IF NOT EXISTS availability_ranges (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER REFERENCES users(id),
    channel_id INTEGER REFERENCES channels(id),
    day_of_week INTEGER,
    specific_date TIMESTAMP WITHOUT TIME ZONE,
    start_time VARCHAR,
    end_time VARCHAR,
    is_recurring BOOLEAN DEFAULT TRUE
);

-- Create Call Bookings table (New system)
CREATE TABLE IF NOT EXISTS call_bookings (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES call_services(id),
    booker_id INTEGER REFERENCES users(id),
    start_time TIMESTAMP WITHOUT TIME ZONE,
    end_time TIMESTAMP WITHOUT TIME ZONE,
    status VARCHAR DEFAULT 'confirmed',
    meeting_link VARCHAR,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Index for fast overlap checks
CREATE INDEX IF NOT EXISTS idx_call_bookings_time ON call_bookings (service_id, start_time, end_time);
