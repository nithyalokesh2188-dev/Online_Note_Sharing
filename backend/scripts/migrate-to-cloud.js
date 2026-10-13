// Copies the local PostgreSQL data and uploaded files into a hosted database (e.g. Neon).
//
// Usage (from the backend folder):
//   TARGET_DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require" npm run migrate:cloud
//
// Reads the source database from the DB_* settings in backend/.env. Safe to re-run:
// existing rows (same id) and files (same name) in the target are left unchanged.
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
require("dotenv").config({ path: path.join(__dirname, "..", ".env"), quiet: true });

const TABLES = [
    "users",
    "notes",
    "note_versions",
    "note_reviews",
    "bookmarks",
    "ai_note_summaries",
    "ai_note_question_sets",
    "notifications",
];
const JSON_COLUMNS = { ai_note_question_sets: ["questions"] };

async function main() {
    const targetUrl = process.env.TARGET_DATABASE_URL;
    if (!targetUrl) throw new Error("Set TARGET_DATABASE_URL to the hosted database connection string.");

    const source = new Client({
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "notesharing",
    });
    const target = new Client({ connectionString: targetUrl, ssl: { rejectUnauthorized: false } });
    await source.connect();
    await target.connect();

    try {
        const schema = fs.readFileSync(path.join(__dirname, "..", "migrations", "postgres_schema.sql"), "utf8");
        await target.query(schema);
        console.log("Schema applied to target.");

        for (const table of TABLES) {
            const { rows } = await source.query(`SELECT * FROM ${table} ORDER BY id`);
            let inserted = 0;
            for (const row of rows) {
                const columns = Object.keys(row);
                const values = columns.map((column) => (JSON_COLUMNS[table]?.includes(column) && row[column] !== null
                    ? JSON.stringify(row[column])
                    : row[column]));
                const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
                const result = await target.query(
                    `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
                    values
                );
                inserted += result.rowCount;
            }
            await target.query(
                `SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 0) + 1, false)`
            );
            console.log(`${table}: ${inserted} of ${rows.length} rows copied`);
        }

        const uploadDirectory = path.join(__dirname, "..", "uploads");
        const { rows: fileRows } = await source.query(
            "SELECT file_path FROM notes WHERE file_path IS NOT NULL UNION SELECT file_path FROM note_versions"
        );
        let stored = 0;
        let missing = 0;
        for (const { file_path: filePath } of fileRows) {
            const fileName = path.basename(String(filePath));
            const absolutePath = path.join(uploadDirectory, fileName);
            if (!fs.existsSync(absolutePath)) {
                missing += 1;
                console.warn(`  missing on disk, skipped: ${fileName}`);
                continue;
            }
            const content = fs.readFileSync(absolutePath);
            const result = await target.query(
                "INSERT INTO stored_files (file_name, content, size) VALUES ($1, $2, $3) ON CONFLICT (file_name) DO NOTHING",
                [fileName, content, content.length]
            );
            stored += result.rowCount;
        }
        console.log(`uploaded files: ${stored} stored, ${missing} missing on disk`);
        console.log("Migration complete.");
    } finally {
        await source.end();
        await target.end();
    }
}

main().catch((error) => {
    console.error("Migration failed:", error.message);
    process.exit(1);
});
