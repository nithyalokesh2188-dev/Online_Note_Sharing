-- PostgreSQL schema for the notes sharing backend.
-- Applied automatically on server start; every statement is safe to re-run.

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'student',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    department VARCHAR(100) NULL,
    semester VARCHAR(50) NULL,
    academic_year VARCHAR(20) NULL,
    description TEXT NULL,
    tags TEXT NULL,
    file_name VARCHAR(255) NULL,
    file_path VARCHAR(500) NULL,
    file_hash CHAR(64) NULL,
    uploaded_by INT NULL REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notes_file_hash ON notes (file_hash);
ALTER TABLE notes ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CONSTRAINT check_note_status CHECK (status IN ('pending', 'approved', 'rejected'));
ALTER TABLE notes ADD COLUMN IF NOT EXISTS reviewed_by INT NULL REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ NULL;

CREATE TABLE IF NOT EXISTS note_reviews (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note_id INT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    rating SMALLINT NOT NULL CONSTRAINT check_note_review_rating CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_note_review UNIQUE (user_id, note_id)
);

CREATE TABLE IF NOT EXISTS bookmarks (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note_id INT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_bookmark UNIQUE (user_id, note_id)
);

CREATE TABLE IF NOT EXISTS note_versions (
    id SERIAL PRIMARY KEY,
    note_id INT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    version_number INT NOT NULL CHECK (version_number > 0),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_hash CHAR(64) NULL,
    updated_by INT NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_note_version UNIQUE (note_id, version_number)
);
CREATE INDEX IF NOT EXISTS idx_note_versions_note_created ON note_versions (note_id, created_at);

CREATE TABLE IF NOT EXISTS ai_note_summaries (
    id SERIAL PRIMARY KEY,
    note_id INT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    content_hash CHAR(64) NOT NULL,
    summary TEXT NOT NULL,
    generated_by INT NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_note_summary_hash UNIQUE (note_id, content_hash)
);

CREATE TABLE IF NOT EXISTS ai_note_question_sets (
    id SERIAL PRIMARY KEY,
    note_id INT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    content_hash CHAR(64) NOT NULL,
    questions JSONB NOT NULL,
    generated_by INT NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_note_question_history ON ai_note_question_sets (note_id, content_hash, created_at);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_id INT NULL REFERENCES users(id) ON DELETE SET NULL,
    note_id INT NULL REFERENCES notes(id) ON DELETE SET NULL,
    type VARCHAR(40) NOT NULL,
    title VARCHAR(160) NOT NULL,
    message VARCHAR(500) NOT NULL,
    is_read SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON notifications (user_id, is_read, created_at);
