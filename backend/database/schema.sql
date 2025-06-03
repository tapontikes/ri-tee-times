-- ========================================
-- DROP & RECREATE GOLF_COURSES TABLE ONLY
-- ENSURE TEE_TIMES TABLE EXISTS
-- SET UP TRIGGERS AND INDEXES
-- ========================================

-- Drop triggers
DROP TRIGGER IF EXISTS update_golf_courses_updated_at ON golf_courses;
DROP TRIGGER IF EXISTS update_tee_times_updated_at ON tee_times;

-- Drop the golf_courses table
DROP TABLE IF EXISTS golf_courses CASCADE;

-- Recreate the golf_courses table
CREATE TABLE IF NOT EXISTS golf_courses
(
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(255) NOT NULL,
    provider     VARCHAR(50)  NOT NULL,
    booking_url  TEXT,
    request_data JSONB,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    address      TEXT
);

-- Create tee_times table only if it doesn't exist
CREATE TABLE IF NOT EXISTS tee_times
(
    id             SERIAL PRIMARY KEY,
    course_id      INTEGER REFERENCES golf_courses (id),
    tee_time       TIMESTAMP WITH TIME ZONE NOT NULL,
    players        INTEGER,
    holes          JSONB,
    spots          INTEGER NOT NULL,
    start_position VARCHAR(50),
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create or replace the function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
    RETURNS TRIGGER AS
$$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers
CREATE TRIGGER update_golf_courses_updated_at
    BEFORE UPDATE ON golf_courses
    FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_tee_times_updated_at
    BEFORE UPDATE ON tee_times
    FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Create indexes for tee_times
CREATE INDEX IF NOT EXISTS tee_times_tee_time_idx ON tee_times (tee_time);
CREATE INDEX IF NOT EXISTS tee_times_course_id_idx ON tee_times (course_id);
