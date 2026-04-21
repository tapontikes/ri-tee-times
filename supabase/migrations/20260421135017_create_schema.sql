CREATE TABLE IF NOT EXISTS golf_courses
(
    id
    SERIAL
    PRIMARY
    KEY,
    name
    VARCHAR
(
    255
) NOT NULL,
    provider VARCHAR
(
    50
) NOT NULL,
    booking_url TEXT,
    request_data JSONB,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP
                         WITH TIME ZONE DEFAULT NOW()
    );

CREATE TABLE IF NOT EXISTS tee_times
(
    id
    SERIAL
    PRIMARY
    KEY,
    course_id
    INTEGER
    REFERENCES
    golf_courses
(
    id
) ON DELETE CASCADE,
    tee_time TIMESTAMP
  WITH TIME ZONE NOT NULL,
      holes INTEGER [],
      spots INTEGER NOT NULL,
      start_position VARCHAR (50),
    created_at TIMESTAMP
  WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP
  WITH TIME ZONE DEFAULT NOW()
    );

CREATE
OR REPLACE FUNCTION update_modified_column()
    RETURNS TRIGGER AS
$$
BEGIN
    NEW.updated_at
= NOW();
RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE TRIGGER update_golf_courses_updated_at
    BEFORE UPDATE
    ON golf_courses
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_tee_times_updated_at
    BEFORE UPDATE
    ON tee_times
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE INDEX IF NOT EXISTS tee_times_course_tee_time_idx ON tee_times (course_id, tee_time);
