ALTER TABLE notes
    ADD COLUMN file_hash CHAR(64) NULL,
    ADD COLUMN tags TEXT NULL;

CREATE INDEX idx_notes_file_hash ON notes (file_hash);

CREATE TABLE IF NOT EXISTS note_versions (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    note_id INT NOT NULL,
    version_number INT UNSIGNED NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_hash CHAR(64) NULL,
    updated_by INT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_note_version (note_id, version_number),
    KEY idx_note_versions_note_created (note_id, created_at),
    CONSTRAINT fk_note_versions_note FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    CONSTRAINT fk_note_versions_user FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO note_versions
    (note_id, version_number, file_name, file_path, file_hash, updated_by, created_at)
SELECT id, 1, file_name, file_path, file_hash, uploaded_by, COALESCE(uploaded_at, CURRENT_TIMESTAMP)
FROM notes
WHERE file_name IS NOT NULL AND file_path IS NOT NULL;

CREATE TABLE IF NOT EXISTS ai_note_summaries (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    note_id INT NOT NULL,
    content_hash CHAR(64) NOT NULL,
    summary LONGTEXT NOT NULL,
    generated_by INT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_note_summary_hash (note_id, content_hash),
    CONSTRAINT fk_ai_summary_note FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    CONSTRAINT fk_ai_summary_user FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ai_note_question_sets (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    note_id INT NOT NULL,
    content_hash CHAR(64) NOT NULL,
    questions JSON NOT NULL,
    generated_by INT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_note_question_history (note_id, content_hash, created_at),
    CONSTRAINT fk_ai_questions_note FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    CONSTRAINT fk_ai_questions_user FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    actor_id INT NULL,
    note_id INT NULL,
    type VARCHAR(40) NOT NULL,
    title VARCHAR(160) NOT NULL,
    message VARCHAR(500) NOT NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_notifications_user_read_created (user_id, is_read, created_at),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_notifications_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_notifications_note FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
