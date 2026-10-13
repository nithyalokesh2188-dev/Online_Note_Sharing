const express = require("express");
const cors = require("cors");
const session = require("express-session");
const PgStoreFactory = require("connect-pg-simple");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env"), override: true });
const crypto = require("crypto");
const fs = require("fs");
const multer = require("multer");
const { extractNoteText } = require("./services/documentText");
const { createDatabase } = require("./services/db");
const { answerQuestion } = require("./services/webAnswer");
const {
    assertConfigured,
    generateSummary,
    generateQuestions,
    getConfigStatus: getAiConfigStatus,
} = require("./services/aiProvider");
const app = express();

const aiConfigStatus = getAiConfigStatus();
console.info(`AI_API_KEY present: ${aiConfigStatus.apiKeyPresent ? "true" : "false"}`);
console.info(`AI_MODEL present: ${aiConfigStatus.modelPresent ? "true" : "false"}`);

const configuredOrigins = (process.env.FRONTEND_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);
const allowedOrigins = new Set([
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    ...configuredOrigins,
]);
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret || sessionSecret.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters in backend/.env.");
}

app.use(express.json({ limit: "1mb" }));
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) return callback(null, true);
        callback(new Error("Origin is not allowed."));
    },
    credentials: true,
}));
// Hosted databases (Neon, Render, etc.) provide one DATABASE_URL and require SSL;
// local development uses the separate DB_* settings.
const databaseConfig = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "notesharing",
    };
// In production the frontend (e.g. *.vercel.app) and API (e.g. *.onrender.com) are different
// sites, so the session cookie must be SameSite=None and Secure to be sent with API requests.
const isProduction = process.env.NODE_ENV === "production";
const sessionCookieOptions = {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
};
if (isProduction) app.set("trust proxy", 1);
const PgStore = PgStoreFactory(session);
const sessionStore = new PgStore({
    conObject: databaseConfig,
    tableName: "user_sessions",
    createTableIfMissing: true,
});
app.use(session({
    name: "notes.sid",
    secret: sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        ...sessionCookieOptions,
        maxAge: 12 * 60 * 60 * 1000,
    },
}));
const uploadDirectory = path.join(__dirname, "uploads");
fs.mkdirSync(uploadDirectory, { recursive: true });
app.use("/uploads", (req, res, next) => {
    let fileName;
    try {
        fileName = decodeURIComponent(req.path.replace(/^\/+/, ""));
    } catch {
        return next();
    }
    restoreUploads([fileName], next);
});
app.use("/uploads", express.static(uploadDirectory));

const publicRequests = new Set([
    "GET /",
    "POST /login",
    "GET /auth/me",
    "POST /auth/logout",
]);
app.use((req, res, next) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
        const origin = req.get("origin");
        if (origin && !allowedOrigins.has(origin)) {
            return res.status(403).json({ message: "Request origin is not allowed." });
        }
    }
    if (publicRequests.has(`${req.method} ${req.path}`) || req.path.startsWith("/uploads/")) {
        return next();
    }
    const userId = req.session?.userId;
    if (!isPositiveInteger(userId)) {
        return res.status(401).json({ message: "Sign in to continue." });
    }
    req.userId = Number(userId);
    next();
});

const allowedFileExtensions = new Set([
    ".pdf", ".csv", ".xls", ".xlsx", ".doc", ".docx",
    ".ppt", ".pptx", ".jpg", ".jpeg", ".png"
]);
const noteFileUpload = multer({
    storage: multer.diskStorage({
        destination: uploadDirectory,
        filename: (req, file, callback) => {
            callback(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
        }
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
        if (!allowedFileExtensions.has(path.extname(file.originalname).toLowerCase())) {
            return callback(new Error("Unsupported file type."));
        }
        callback(null, true);
    }
});

let uploadSchemaReady = false;
let advancedSchemaReady = false;

// PostgreSQL Connection
const db = createDatabase(databaseConfig);

db.connect((err) => {
    if (err) {
        console.log("PostgreSQL connection failed:", err.message);
        return;
    }

    console.log("PostgreSQL connected successfully!");

    const schemaSql = fs.readFileSync(path.join(__dirname, "migrations", "postgres_schema.sql"), "utf8");
    db.exec(schemaSql).then(() => {
        advancedSchemaReady = true;
        uploadSchemaReady = true;
        console.log("Notes database schema is ready.");
    }, (schemaError) => {
        console.error("Could not apply the notes database schema:", schemaError.message);
    });
});

// Test route
app.get("/", (req, res) => {
    res.send("Notes Sharing Backend is running!");
});

const PORT = Number(process.env.PORT) || 5000;
const isPositiveInteger = (value) => /^[1-9]\d*$/.test(String(value))
    && Number.isSafeInteger(Number(value));

app.get("/notes", (req, res) => {
    const sql = `
        SELECT
            notes.id,
            notes.title,
            notes.subject,
            notes.department,
            notes.semester,
            notes.academic_year,
            notes.description,
            notes.tags,
            notes.file_name,
            notes.file_path,
            notes.uploaded_by,
            notes.uploaded_at,
            notes.status,
            uploader.name AS uploader_name,
            COALESCE(review_summary.average_rating, 0) AS average_rating,
            COALESCE(review_summary.total_reviews, 0) AS total_reviews
        FROM notes
        LEFT JOIN users AS uploader ON uploader.id = notes.uploaded_by
        LEFT JOIN (
            SELECT note_id, AVG(rating)::float8 AS average_rating, COUNT(*)::int AS total_reviews
            FROM note_reviews
            GROUP BY note_id
        ) AS review_summary ON review_summary.note_id = notes.id
        ORDER BY notes.id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Could not load notes",
                error: err.message
            });
        }

        res.json(results);
    });
});

function findNoteDuplicates({ title, subject, fileName, fileHash }, callback) {
    const predicates = [];
    const values = [];

    if (fileHash) {
        predicates.push("file_hash = ?");
        values.push(fileHash);
    }
    if (title && subject) {
        predicates.push("(LOWER(TRIM(title)) = LOWER(TRIM(?)) AND LOWER(TRIM(subject)) = LOWER(TRIM(?)))");
        values.push(title, subject);
    }
    if (fileName) {
        predicates.push("LOWER(TRIM(file_name)) = LOWER(TRIM(?))");
        values.push(fileName);
    }

    if (!predicates.length) {
        callback(null, []);
        return;
    }

    const sql = `
        SELECT id, title, subject, file_name, file_hash
        FROM notes
        WHERE ${predicates.join(" OR ")}
        ORDER BY id DESC
        LIMIT 10
    `;

    db.query(sql, values, (err, rows) => {
        if (err) {
            callback(err);
            return;
        }
        const normalized = (value) => String(value || "").trim().toLocaleLowerCase();
        const matches = rows.map((row) => {
            const reasons = [];
            if (fileHash && row.file_hash === fileHash) reasons.push("same file content");
            if (normalized(row.title) === normalized(title)
                && normalized(row.subject) === normalized(subject)) reasons.push("same title and subject");
            if (fileName && normalized(row.file_name) === normalized(fileName)) reasons.push("same file name");
            return { id: row.id, title: row.title, subject: row.subject, file_name: row.file_name, reasons };
        });
        callback(null, matches);
    });
}

// Hosts such as Render wipe the local disk on every restart, so each upload is also kept in
// PostgreSQL (stored_files) and written back to the uploads folder whenever a request needs it.
function storeUploadedFile(file, callback) {
    fs.readFile(file.path, (readError, content) => {
        if (readError) return callback(readError);
        db.query(
            "INSERT INTO stored_files (file_name, content, size) VALUES (?, ?, ?) ON CONFLICT (file_name) DO NOTHING",
            [path.basename(file.filename), content, content.length],
            (storeError) => callback(storeError || null)
        );
    });
}

function restoreUploads(storedPaths, callback) {
    const missing = [...new Set(storedPaths.filter(Boolean).map((storedPath) => path.basename(String(storedPath))))]
        .filter((fileName) => !fs.existsSync(path.join(uploadDirectory, fileName)));
    if (!missing.length) return callback();
    db.query("SELECT file_name, content FROM stored_files WHERE file_name = ANY(?)", [missing], (err, rows) => {
        if (err) {
            console.error("Could not restore uploaded files from the database:", err.message);
            return callback();
        }
        for (const row of rows) {
            try {
                fs.writeFileSync(path.join(uploadDirectory, path.basename(row.file_name)), row.content);
            } catch (writeError) {
                console.error("Could not write restored upload:", writeError.message);
            }
        }
        callback();
    });
}

const isSha256 = (value) => typeof value === "string" && /^[a-f0-9]{64}$/i.test(value);
const removeUploadedFile = (filePath) => {
    if (!filePath) return;
    fs.unlink(filePath, (err) => {
        if (err && err.code !== "ENOENT") {
            console.error("Could not remove rejected upload:", err.message);
        }
    });
};

function verifyUploadedFile(file) {
    const filePath = path.resolve(file.path);
    const extension = path.extname(file.originalname).toLowerCase();
    let fileSize = null;
    let pdfSignatureValid = null;

    try {
        const stats = fs.statSync(filePath);
        fileSize = stats.size;
        if (extension === ".pdf" && stats.isFile() && stats.size > 0) {
            const descriptor = fs.openSync(filePath, "r");
            const signature = Buffer.alloc(5);
            try {
                pdfSignatureValid = fs.readSync(descriptor, signature, 0, signature.length, 0) === signature.length
                    && signature.toString("ascii") === "%PDF-";
            } finally {
                fs.closeSync(descriptor);
            }
        } else if (extension === ".pdf") {
            pdfSignatureValid = false;
        }

        const valid = stats.isFile()
            && stats.size > 0
            && file.size === stats.size
            && (extension !== ".pdf" || pdfSignatureValid);
        console.info("Uploaded note file verification:", JSON.stringify({
            fileName: file.originalname,
            filePath: path.relative(__dirname, filePath).replace(/\\/g, "/"),
            exists: true,
            uploadedFileSize: file.size,
            fileSize,
            ...(extension === ".pdf" ? { pdfSignatureValid } : {}),
            valid,
        }));
        return {
            valid,
            message: !stats.isFile()
                ? "The uploaded file was not saved as a regular file."
                : stats.size === 0
                    ? "The uploaded file is empty after being saved."
                    : file.size !== stats.size
                        ? "The uploaded file size changed while being saved."
                        : extension === ".pdf" && !pdfSignatureValid
                            ? "The uploaded file does not have a valid PDF signature."
                            : null,
        };
    } catch (error) {
        console.error("Uploaded note file verification failed:", JSON.stringify({
            fileName: file.originalname,
            filePath: path.relative(__dirname, filePath).replace(/\\/g, "/"),
            exists: false,
            uploadedFileSize: file.size,
            fileSize,
            ...(extension === ".pdf" ? { pdfSignatureValid: false } : {}),
        }));
        return { valid: false, message: "The uploaded file could not be verified after saving." };
    }
}

app.post("/notes/check-duplicates", (req, res) => {
    if (!uploadSchemaReady) {
        return res.status(503).json({ message: "Note upload storage is still initializing. Try again shortly." });
    }

    const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
    const subject = typeof req.body.subject === "string" ? req.body.subject.trim() : "";
    const fileName = typeof req.body.file_name === "string" ? path.basename(req.body.file_name).trim() : "";
    const fileHash = req.body.file_hash;

    if (!title || title.length > 200 || !subject || subject.length > 100
        || !fileName || fileName.length > 255 || !isSha256(fileHash)) {
        return res.status(400).json({ message: "Valid title, subject, file name, and SHA-256 file hash are required." });
    }

    findNoteDuplicates({ title, subject, fileName, fileHash }, (err, matches) => {
        if (err) {
            console.error("Could not check for duplicate notes:", err.message);
            return res.status(500).json({ message: "Could not check for duplicate notes." });
        }
        res.json({ duplicates: matches });
    });
});

app.post("/notes", noteFileUpload.single("file"), (req, res) => {
    if (!uploadSchemaReady) {
        removeUploadedFile(req.file?.path);
        return res.status(503).json({ message: "Note upload storage is still initializing. Try again shortly." });
    }

    const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
    const subject = typeof req.body.subject === "string" ? req.body.subject.trim() : "";
    const department = typeof req.body.department === "string" ? req.body.department.trim() : "";
    const semester = typeof req.body.semester === "string" ? req.body.semester.trim() : "";
    const description = typeof req.body.description === "string" ? req.body.description.trim() : "";
    const tags = typeof req.body.tags === "string" ? req.body.tags.trim() : "";
    const academicYear = typeof req.body.academic_year === "string" ? req.body.academic_year.trim() : "";
    const userId = req.userId;
    const allowDuplicate = req.body.allow_duplicate === "true";

    if (!req.file) {
        return res.status(400).json({ message: "A note file is required." });
    }
    const uploadVerification = verifyUploadedFile(req.file);
    if (!uploadVerification.valid) {
        removeUploadedFile(req.file.path);
        return res.status(422).json({ message: uploadVerification.message });
    }
    if (!title || title.length > 200 || !subject || subject.length > 100
        || department.length > 100 || semester.length > 50 || academicYear.length > 20
        || description.length > 2000) {
        removeUploadedFile(req.file.path);
        return res.status(400).json({ message: "Valid note details are required." });
    }

    const fileHashStream = crypto.createHash("sha256");
    const fileStream = fs.createReadStream(req.file.path);
    fileStream.on("data", (chunk) => fileHashStream.update(chunk));
    fileStream.on("error", (streamError) => {
        console.error("Could not hash uploaded note:", streamError.message);
        removeUploadedFile(req.file.path);
        if (!res.headersSent) res.status(500).json({ message: "Could not verify the uploaded file." });
    });
    fileStream.on("end", () => {
        const fileHash = fileHashStream.digest("hex");
        findNoteDuplicates({
            title,
            subject,
            fileName: req.file.originalname,
            fileHash
        }, (duplicateError, matches) => {
            if (duplicateError) {
                console.error("Could not check uploaded note for duplicates:", duplicateError.message);
                removeUploadedFile(req.file.path);
                return res.status(500).json({ message: "Could not check for duplicate notes." });
            }
            if (matches.length && !allowDuplicate) {
                removeUploadedFile(req.file.path);
                return res.status(409).json({
                    message: "A similar note already exists.",
                    duplicates: matches
                });
            }

            const filePath = `/uploads/${path.basename(req.file.filename)}`;
            const sql = `
                INSERT INTO notes
                    (title, subject, department, semester, academic_year, description, tags,
                     file_name, file_path, uploaded_by, file_hash)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const values = [
                title, subject, department || null, semester || null, academicYear || null,
                description || null, tags || null, req.file.originalname, filePath, userId, fileHash
            ];

            storeUploadedFile(req.file, (storeError) => {
            if (storeError) {
                console.error("Could not store the uploaded file:", storeError.message);
                removeUploadedFile(req.file.path);
                return res.status(500).json({ message: "Could not store the uploaded file." });
            }
            db.beginTransaction((transactionError, tx) => {
                if (transactionError) {
                    removeUploadedFile(req.file.path);
                    return res.status(500).json({ message: "Could not start saving the uploaded note." });
                }

                const rollbackUpload = (message, error) => {
                    if (error) console.error(message, error.message);
                    tx.rollback(() => {
                        removeUploadedFile(req.file.path);
                        if (!res.headersSent) res.status(500).json({ message });
                    });
                };

                tx.query(sql, values, (insertError, result) => {
                    if (insertError) return rollbackUpload("Could not save uploaded note.", insertError);

                    tx.query(
                        `INSERT INTO note_versions
                            (note_id, version_number, file_name, file_path, file_hash, updated_by)
                         VALUES (?, 1, ?, ?, ?, ?)`,
                        [result.insertId, req.file.originalname, filePath, fileHash, userId],
                        (versionError) => {
                            if (versionError) return rollbackUpload("Could not create initial note version.", versionError);

                            tx.commit((commitError) => {
                                if (commitError) return rollbackUpload("Could not complete uploaded note transaction.", commitError);
                                res.status(201).json({
                                    message: "Note uploaded successfully.",
                                    note: {
                                        id: result.insertId,
                                        title,
                                        subject,
                                        department: department || null,
                                        semester: semester || null,
                                        academic_year: academicYear || null,
                                        description: description || null,
                                        tags: tags || null,
                                        file_name: req.file.originalname,
                                        file_path: filePath,
                                        uploaded_by: Number(userId),
                                        uploaded_at: new Date().toISOString(),
                                        status: "pending",
                                        average_rating: 0,
                                        total_reviews: 0
                                    }
                                });
                            });
                        }
                    );
                });
            });
            });
        });
    });
});

function createNotification(userId, type, title, message, noteId = null, actorId = null, callback = () => {}) {
    if (!isPositiveInteger(userId)) {
        const error = new Error("A valid notification recipient is required.");
        callback(error);
        return;
    }
    db.query(
        `INSERT INTO notifications (user_id, actor_id, note_id, type, title, message)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, isPositiveInteger(actorId) ? actorId : null, isPositiveInteger(noteId) ? noteId : null, type, title, message],
        (err, result) => callback(err || null, result || null)
    );
}

function notifyNoteOwner(noteId, actorId, type, title, message, callback = () => {}) {
    db.query("SELECT uploaded_by FROM notes WHERE id = ?", [noteId], (err, rows) => {
        if (err) {
            callback(err);
            return;
        }
        const ownerId = rows[0]?.uploaded_by;
        if (!isPositiveInteger(ownerId)) {
            callback(new Error("The note owner could not be identified."));
            return;
        }
        if (String(ownerId) === String(actorId)) {
            callback(null, { notified: false });
            return;
        }
        createNotification(ownerId, type, title, message, noteId, actorId, (notificationError, result) => {
            if (notificationError) {
                console.error("Could not create note-owner notification:", notificationError.message);
                callback(notificationError);
                return;
            }
            callback(null, { notified: true, notificationId: result.insertId });
        });
    });
}

function resolveStoredUploadPath(storedPath) {
    const uploadRoot = path.resolve(uploadDirectory);
    const normalized = String(storedPath || "").trim().replace(/\\/g, "/");
    const webUploadMatch = normalized.match(/^\/?uploads\/([^/]+)$/i);
    let absolutePath;
    let fileName;

    if (webUploadMatch) {
        fileName = webUploadMatch[1];
        absolutePath = path.resolve(uploadRoot, fileName);
    } else if (path.isAbsolute(normalized)) {
        absolutePath = path.resolve(normalized);
        const relativePath = path.relative(uploadRoot, absolutePath);
        if (!relativePath || relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
            return null;
        }
        fileName = path.basename(absolutePath);
    } else {
        return null;
    }

    if (!fileName || fileName === "." || fileName !== path.basename(fileName)) {
        return null;
    }

    return {
        fileName,
        absolutePath,
        displayPath: `uploads/${fileName}`,
    };
}

function hashStoredFile(note, callback) {
    const resolved = resolveStoredUploadPath(note.file_path);
    if (!resolved) {
        callback(Object.assign(new Error("The stored note file path is invalid."), { status: 400 }));
        return;
    }

    const { fileName, absolutePath, displayPath } = resolved;
    fs.readFile(absolutePath, (err, contents) => {
        if (err) {
            callback(Object.assign(
                new Error(err.code === "ENOENT"
                    ? `The uploaded note file is missing from backend storage (${displayPath}). Upload the file again or restore it to the uploads folder.`
                    : `The uploaded note file could not be read from backend storage (${displayPath}).`),
                { status: err.code === "ENOENT" ? 404 : 500 }
            ));
            return;
        }
        const isPdf = path.extname(String(note.file_name || fileName)).toLowerCase() === ".pdf";
        const pdfSignatureValid = isPdf
            ? contents.subarray(0, 5).toString("ascii") === "%PDF-"
            : undefined;
        console.info("AI source file verification:", JSON.stringify({
            noteId: note.id,
            fileName: note.file_name || fileName,
            filePath: displayPath,
            fileSize: contents.length,
            exists: true,
            ...(isPdf ? { pdfSignatureValid } : {}),
        }));
        if (contents.length === 0) {
            callback(Object.assign(
                new Error(`The uploaded note file is empty in backend storage (${displayPath}). Upload a valid document again.`),
                { status: 422 }
            ));
            return;
        }
        if (isPdf && !pdfSignatureValid) {
            callback(Object.assign(
                new Error(`The uploaded PDF is invalid in backend storage (${displayPath}).`),
                { status: 422 }
            ));
            return;
        }
        callback(null, crypto.createHash("sha256").update(contents).digest("hex"), absolutePath);
    });
}

function loadNoteText(note, callback) {
    hashStoredFile(note, (hashError, contentHash, absolutePath) => {
        if (hashError) {
            callback(hashError);
            return;
        }
        if (note.file_hash !== contentHash) {
            db.query("UPDATE notes SET file_hash = ? WHERE id = ?", [contentHash, note.id], (updateError) => {
                if (updateError) {
                    callback(Object.assign(new Error("The note content hash could not be saved."), { status: 500 }));
                    return;
                }
                note.file_hash = contentHash;
                extractNoteText(absolutePath, note.file_name).then(
                    (text) => {
                        console.info("AI source text extracted:", JSON.stringify({ noteId: note.id, textLength: text.length }));
                        callback(null, { text, contentHash });
                    },
                    (error) => { callback(error); }
                );
            });
            return;
        }
        extractNoteText(absolutePath, note.file_name).then(
            (text) => {
                console.info("AI source text extracted:", JSON.stringify({ noteId: note.id, textLength: text.length }));
                callback(null, { text, contentHash });
            },
            (error) => { callback(error); }
        );
    });
}

app.get("/notes/:noteId/versions", (req, res) => {
    if (!advancedSchemaReady) {
        return res.status(503).json({ message: "Version history is still initializing. Try again shortly." });
    }
    const { noteId } = req.params;
    const userId = req.userId;
    if (!isPositiveInteger(noteId)) {
        return res.status(400).json({ message: "A valid note ID is required." });
    }
    db.query(
        `SELECT version.id, version.note_id, version.version_number, version.file_name,
                version.file_path, version.updated_by, version.created_at,
                updated_user.email AS updated_by_email,
                (version.id = latest.id) AS is_current
         FROM note_versions AS version
         LEFT JOIN users AS updated_user ON updated_user.id = version.updated_by
         INNER JOIN (
             SELECT note_id, MAX(version_number) AS latest_version
             FROM note_versions GROUP BY note_id
         ) AS latest_version ON latest_version.note_id = version.note_id
         INNER JOIN note_versions AS latest
            ON latest.note_id = latest_version.note_id
           AND latest.version_number = latest_version.latest_version
         WHERE version.note_id = ?
         ORDER BY version.version_number DESC`,
        [noteId],
        (err, versions) => {
            if (err) {
                console.error("Could not load note versions:", err.message);
                return res.status(500).json({ message: "Could not load version history." });
            }
            res.json({ versions });
        }
    );
});

app.post("/notes/:noteId/versions", noteFileUpload.single("file"), (req, res) => {
    if (!advancedSchemaReady) {
        removeUploadedFile(req.file?.path);
        return res.status(503).json({ message: "Version history is still initializing. Try again shortly." });
    }
    const { noteId } = req.params;
    const userId = req.userId;
    if (!isPositiveInteger(noteId)) {
        removeUploadedFile(req.file?.path);
        return res.status(400).json({ message: "A valid note ID is required." });
    }
    if (!req.file) return res.status(400).json({ message: "A new note file is required." });
    const uploadVerification = verifyUploadedFile(req.file);
    if (!uploadVerification.valid) {
        removeUploadedFile(req.file.path);
        return res.status(422).json({ message: uploadVerification.message });
    }

    db.query("SELECT id, title, uploaded_by FROM notes WHERE id = ?", [noteId], (noteError, rows) => {
        if (noteError) {
            removeUploadedFile(req.file.path);
            return res.status(500).json({ message: "Could not verify note ownership." });
        }
        if (!rows.length || String(rows[0].uploaded_by) !== String(userId)) {
            removeUploadedFile(req.file.path);
            return res.status(403).json({ message: "Only the note owner can upload a new version." });
        }

        const hash = crypto.createHash("sha256");
        const stream = fs.createReadStream(req.file.path);
        stream.on("error", (err) => {
            console.error("Could not hash note version:", err.message);
            removeUploadedFile(req.file.path);
            if (!res.headersSent) res.status(500).json({ message: "Could not verify the new version file." });
        });
        stream.on("data", (chunk) => hash.update(chunk));
        stream.on("end", () => {
            const fileHash = hash.digest("hex");
            storeUploadedFile(req.file, (storeError) => {
            if (storeError) {
                console.error("Could not store the uploaded file:", storeError.message);
                removeUploadedFile(req.file.path);
                return res.status(500).json({ message: "Could not store the uploaded file." });
            }
            db.beginTransaction((transactionError, tx) => {
                if (transactionError) {
                    removeUploadedFile(req.file.path);
                    return res.status(500).json({ message: "Could not start the version update." });
                }

                tx.query("SELECT COALESCE(MAX(version_number), 0) + 1 AS next_version FROM note_versions WHERE note_id = ?", [noteId], (versionError, versionRows) => {
                    if (versionError) return tx.rollback(() => {
                        removeUploadedFile(req.file.path);
                        res.status(500).json({ message: "Could not determine the next version number." });
                    });

                    const versionNumber = Number(versionRows[0].next_version);
                    const filePath = `/uploads/${path.basename(req.file.filename)}`;
                    tx.query(
                        `INSERT INTO note_versions
                            (note_id, version_number, file_name, file_path, file_hash, updated_by)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [noteId, versionNumber, req.file.originalname, filePath, fileHash, userId],
                        (insertError, result) => {
                            if (insertError) return tx.rollback(() => {
                                removeUploadedFile(req.file.path);
                                res.status(500).json({ message: "Could not save note version history." });
                            });

                            tx.query(
                                "UPDATE notes SET file_name = ?, file_path = ?, file_hash = ?, uploaded_at = CURRENT_TIMESTAMP WHERE id = ? AND uploaded_by = ?",
                                [req.file.originalname, filePath, fileHash, noteId, userId],
                                (updateError) => {
                                    if (updateError) return tx.rollback(() => {
                                        removeUploadedFile(req.file.path);
                                        res.status(500).json({ message: "Could not set the latest note version." });
                                    });
                                    tx.commit((commitError) => {
                                        if (commitError) return tx.rollback(() => {
                                            removeUploadedFile(req.file.path);
                                            res.status(500).json({ message: "Could not complete the version update." });
                                        });

                                        res.status(201).json({
                                            message: "Note version uploaded successfully.",
                                            version: {
                                                id: result.insertId,
                                                note_id: Number(noteId),
                                                version_number: versionNumber,
                                                file_name: req.file.originalname,
                                                file_path: filePath,
                                                updated_by: Number(userId),
                                                created_at: new Date().toISOString(),
                                                is_current: true
                                            }
                                        });
                                    });
                                }
                            );
                        }
                    );
                });
            });
            });
        });
    });
});

app.get("/note-versions/:versionId/download", (req, res) => {
    const { versionId } = req.params;
    if (!isPositiveInteger(versionId)) {
        return res.status(400).json({ message: "A valid version ID is required." });
    }
    db.query(
        "SELECT file_name, file_path FROM note_versions WHERE id = ?",
        [versionId],
        (err, versions) => {
            if (err) return res.status(500).json({ message: "Could not load this note version." });
            if (!versions.length) return res.status(404).json({ message: "Note version not found." });
            const absolutePath = path.join(uploadDirectory, path.basename(versions[0].file_path));
            restoreUploads([versions[0].file_path], () => res.download(absolutePath, path.basename(versions[0].file_name), (downloadError) => {
                if (downloadError && !res.headersSent) {
                    res.status(downloadError.code === "ENOENT" ? 404 : 500).json({ message: "The note version file is unavailable." });
                }
            }));
        }
    );
});

app.get("/notes/:noteId/download", (req, res) => {
    const { noteId } = req.params;
    if (!isPositiveInteger(noteId)) {
        return res.status(400).json({ message: "A valid note ID is required." });
    }
    db.query("SELECT file_name, file_path FROM notes WHERE id = ?", [noteId], (err, notes) => {
        if (err) return res.status(500).json({ message: "Could not load this note." });
        if (!notes.length) return res.status(404).json({ message: "Note not found." });
        const resolved = resolveStoredUploadPath(notes[0].file_path);
        if (!resolved) return res.status(400).json({ message: "The stored note file path is invalid." });
        restoreUploads([notes[0].file_path], () => res.download(resolved.absolutePath, path.basename(notes[0].file_name || resolved.fileName), (downloadError) => {
            if (downloadError && !res.headersSent) {
                res.status(downloadError.code === "ENOENT" ? 404 : 500).json({ message: "The note file is unavailable." });
            }
        }));
    });
});

const noteStatuses = new Set(["pending", "approved", "rejected"]);

app.patch("/notes/:noteId/status", (req, res) => {
    if (!uploadSchemaReady) {
        return res.status(503).json({ message: "Note storage is still initializing. Try again shortly." });
    }
    const { noteId } = req.params;
    const status = typeof req.body.status === "string" ? req.body.status.trim().toLowerCase() : "";
    if (!isPositiveInteger(noteId)) {
        return res.status(400).json({ message: "A valid note ID is required." });
    }
    if (!noteStatuses.has(status)) {
        return res.status(400).json({ message: "Status must be pending, approved, or rejected." });
    }

    db.query("SELECT role FROM users WHERE id = ?", [req.userId], (roleError, users) => {
        if (roleError) return res.status(500).json({ message: "Could not verify your permissions." });
        if (users[0]?.role !== "admin") {
            return res.status(403).json({ message: "Only administrators can approve or reject notes." });
        }

        db.query(
            `UPDATE notes SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
             WHERE id = ? RETURNING id, title, status, reviewed_at`,
            [status, req.userId, noteId],
            (updateError, result) => {
                if (updateError) return res.status(500).json({ message: "Could not update the note status." });
                const note = result.rows[0];
                if (!note) return res.status(404).json({ message: "Note not found." });

                if (status !== "pending") {
                    notifyNoteOwner(
                        note.id,
                        req.userId,
                        status === "approved" ? "note_approved" : "note_rejected",
                        status === "approved" ? "Note approved" : "Note rejected",
                        `Your note “${note.title}” was ${status} by an administrator.`,
                        (notifyError) => {
                            if (notifyError) console.error("Could not notify note owner about review:", notifyError.message);
                        }
                    );
                }
                res.json({ message: `Note ${status}.`, note });
            }
        );
    });
});

function inspectAiFileCandidate(noteId, candidate) {
    const resolved = resolveStoredUploadPath(candidate.file_path);
    if (!resolved) {
        return { valid: false, status: 400, message: "The stored note file path is invalid." };
    }

    const { fileName, absolutePath, displayPath } = resolved;

    let stats;
    try {
        stats = fs.statSync(absolutePath);
    } catch (error) {
        console.info("AI source file verification:", JSON.stringify({
            noteId,
            fileName: candidate.file_name || fileName,
            filePath: displayPath,
            exists: false,
            fileSize: null,
            ...(path.extname(String(candidate.file_name || fileName)).toLowerCase() === ".pdf"
                ? { pdfSignatureValid: false }
                : {}),
        }));
        return {
            valid: false,
            status: error.code === "ENOENT" ? 404 : 500,
            message: error.code === "ENOENT"
                ? `The uploaded note file is missing from backend storage (${displayPath}).`
                : `The uploaded note file could not be read from backend storage (${displayPath}).`,
        };
    }

    const isPdf = path.extname(String(candidate.file_name || fileName)).toLowerCase() === ".pdf";
    let pdfSignatureValid;
    if (isPdf && stats.isFile() && stats.size > 0) {
        const descriptor = fs.openSync(absolutePath, "r");
        const signature = Buffer.alloc(5);
        try {
            pdfSignatureValid = fs.readSync(descriptor, signature, 0, signature.length, 0) === signature.length
                && signature.toString("ascii") === "%PDF-";
        } finally {
            fs.closeSync(descriptor);
        }
    } else if (isPdf) {
        pdfSignatureValid = false;
    }

    const valid = stats.isFile() && stats.size > 0 && (!isPdf || pdfSignatureValid);
    console.info("AI source file verification:", JSON.stringify({
        noteId,
        fileName: candidate.file_name || fileName,
        filePath: displayPath,
        exists: stats.isFile(),
        fileSize: stats.size,
        ...(isPdf ? { pdfSignatureValid } : {}),
        valid,
    }));

    return valid
        ? { valid: true, absolutePath, filePath: `/${displayPath}` }
        : {
            valid: false,
            status: 422,
            message: stats.size === 0
                ? `The uploaded note file is empty in backend storage (${displayPath}).`
                : isPdf
                    ? `The uploaded PDF is invalid in backend storage (${displayPath}).`
                    : `The uploaded note file is not a readable file (${displayPath}).`,
        };
}

function loadNoteForAi(noteId, callback) {
    db.query(
        "SELECT id, title, subject, file_name, file_path, uploaded_by FROM notes WHERE id = ?",
        [noteId],
        (noteError, notes) => {
            if (noteError) return callback(Object.assign(new Error("Could not load the note."), { status: 500 }));
            if (!notes.length) return callback(Object.assign(new Error("Note not found."), { status: 404 }));

            const note = notes[0];
            db.query(
                `SELECT file_name, file_path, version_number
                 FROM note_versions
                 WHERE note_id = ?
                 ORDER BY version_number DESC, id DESC`,
                [noteId],
                (versionError, versions) => {
                    if (versionError) {
                        return callback(Object.assign(new Error("Could not load note version paths."), { status: 500 }));
                    }

                    const candidates = [...versions, { file_name: note.file_name, file_path: note.file_path }];
                    restoreUploads(candidates.map((candidate) => candidate.file_path), () => {
                        const seenPaths = new Set();
                        let lastFailure = null;
                        for (const candidate of candidates) {
                            const key = String(candidate.file_path || "").replace(/\\/g, "/");
                            if (!key || seenPaths.has(key)) continue;
                            seenPaths.add(key);

                            const checked = inspectAiFileCandidate(noteId, candidate);
                            if (checked.valid) {
                                note.file_name = candidate.file_name;
                                note.file_path = checked.filePath;
                                note.file_hash = null;
                                return callback(null, note);
                            }
                            lastFailure = checked;
                        }

                        callback(Object.assign(
                            new Error(lastFailure?.message || "No valid stored file is available for this note."),
                            { status: lastFailure?.status || 404 }
                        ));
                    });
                }
            );
        }
    );
}

function aiEndpoint(kind, request, response) {
    if (!advancedSchemaReady) {
        return response.status(503).json({ message: "AI note storage is still initializing. Try again shortly." });
    }
    const { noteId } = request.params;
    const userId = request.userId;
    if (!isPositiveInteger(noteId)) {
        return response.status(400).json({ message: "A valid note ID is required." });
    }
    try {
        assertConfigured();
    } catch (error) {
        return response.status(error.status || 503).json({ message: error.message });
    }

    loadNoteForAi(noteId, (noteError, note) => {
        if (noteError) return response.status(noteError.status).json({ message: noteError.message });

        loadNoteText(note, (textError, extracted) => {
            if (textError) return response.status(textError.status || 500).json({ message: textError.message || "Could not extract note text." });
            const table = kind === "summary" ? "ai_note_summaries" : "ai_note_question_sets";
            const field = kind === "summary" ? "summary" : "questions";

            if (kind === "questions" && request.method === "GET") {
                return db.query(
                    `SELECT id, content_hash, questions AS content, generated_by, created_at
                     FROM ai_note_question_sets
                     WHERE note_id = ?
                     ORDER BY created_at DESC, id DESC
                     LIMIT 50`,
                    [noteId],
                    (cacheError, savedSets) => {
                        if (cacheError) return response.status(500).json({ message: "Could not load saved AI questions." });
                        const questionSets = savedSets.map((set) => ({
                            id: set.id,
                            contentHash: set.content_hash,
                            questions: set.content,
                            generatedBy: set.generated_by,
                            createdAt: set.created_at,
                            isCurrentContent: set.content_hash === extracted.contentHash,
                        }));
                        const currentSet = questionSets.find((set) => set.isCurrentContent);
                        response.json({
                            cached: Boolean(currentSet),
                            questions: currentSet ? currentSet.questions : null,
                            questionSets,
                        });
                    }
                );
            }

            if (request.method === "GET" || request.body.regenerate !== true) {
                return db.query(
                    `SELECT ${field} AS content, generated_by, created_at
                     FROM ${table} WHERE note_id = ? AND content_hash = ?`,
                    [noteId, extracted.contentHash],
                    (cacheError, cached) => {
                        if (cacheError) return response.status(500).json({ message: `Could not load the saved AI ${kind}.` });
                        if (cached.length) return response.json({ cached: true, [kind]: cached[0].content, createdAt: cached[0].created_at });
                        if (request.method === "GET") return response.json({ cached: false, [kind]: null });
                        generateAiContent(kind, note, extracted, userId, response);
                    }
                );
            }

            generateAiContent(kind, note, extracted, userId, response);
        });
    });
}

function generateAiContent(kind, note, extracted, userId, response) {
    try {
        assertConfigured();
    } catch (err) {
        return response.status(err.status || 503).json({ message: err.message });
    }

    const generate = kind === "summary" ? generateSummary : generateQuestions;
    generate(note, extracted.text).then((content) => {
        const table = kind === "summary" ? "ai_note_summaries" : "ai_note_question_sets";
        const serialized = kind === "summary" ? content : JSON.stringify(content);
        const saveSql = kind === "summary"
            ? `INSERT INTO ${table} (note_id, content_hash, summary, generated_by)
               VALUES (?, ?, ?, ?)
               ON CONFLICT (note_id, content_hash) DO UPDATE SET summary = EXCLUDED.summary,
                   generated_by = EXCLUDED.generated_by, created_at = CURRENT_TIMESTAMP`
            : `INSERT INTO ${table} (note_id, content_hash, questions, generated_by) VALUES (?, ?, ?, ?)`;
        db.query(saveSql, [note.id, extracted.contentHash, serialized, userId], (saveError, savedResult) => {
                if (saveError) {
                    console.error(`Could not store AI ${kind}:`, saveError.message);
                    return response.status(500).json({ message: `The AI ${kind} was generated but could not be saved.` });
                }
                notifyNoteOwner(
                    note.id,
                    userId,
                    kind === "summary" ? "ai_summary" : "ai_questions",
                    kind === "summary" ? "AI summary ready" : "AI questions ready",
                    `The ${kind === "summary" ? "summary" : "question set"} for “${note.title}” is ready.`,
                    (notificationError) => {
                        if (notificationError) {
                            console.error(`AI ${kind} was saved but the note-owner notification failed:`, notificationError.message);
                        }
                    }
                );
                response.json({
                    cached: false,
                    [kind]: content,
                    createdAt: new Date().toISOString(),
                    ...(kind === "questions" ? { questionSetId: savedResult.insertId } : {}),
                });
            });
    }).catch((err) => {
        console.error(`AI ${kind} generation failed:`, err.message);
        response.status(err.status || 502).json({ message: err.message || `Could not generate AI ${kind}.` });
    });
}

app.get("/notes/:noteId/ai-summary", (req, res) => aiEndpoint("summary", req, res));
app.post("/notes/:noteId/ai-summary", (req, res) => aiEndpoint("summary", req, res));
app.get("/notes/:noteId/ai-questions", (req, res) => aiEndpoint("questions", req, res));
app.post("/notes/:noteId/ai-questions", (req, res) => aiEndpoint("questions", req, res));

app.post("/ai/ask", (req, res) => {
    const question = typeof req.body.question === "string" ? req.body.question.trim() : "";
    if (!question || question.length > 500) {
        return res.status(400).json({ message: "Enter a question of up to 500 characters." });
    }
    answerQuestion(question).then(
        (result) => res.json(result),
        (err) => {
            console.error("AI web answer failed:", err.message);
            res.status(err.status || 502).json({ message: err.message || "Could not answer the question." });
        }
    );
});

app.get("/notifications/:userId", (req, res) => {
    if (!advancedSchemaReady) {
        return res.status(503).json({ message: "Notifications are still initializing. Try again shortly." });
    }
    const { userId } = req.params;
    if (!isPositiveInteger(userId)) return res.status(400).json({ message: "A valid user ID is required." });
    if (Number(userId) !== req.userId) return res.status(403).json({ message: "You cannot access another user's notifications." });
    const unreadOnly = req.query.unread_only === "true";
    db.query(
        `SELECT id, type, title, message, note_id, is_read, created_at
         FROM notifications WHERE user_id = ? ${unreadOnly ? "AND is_read = 0" : ""}
         ORDER BY created_at DESC, id DESC LIMIT 100`,
        [userId],
        (err, results) => {
            if (err) return res.status(500).json({ message: "Could not load notifications." });
            res.json(results);
        }
    );
});

app.post("/notifications/:notificationId/read", (req, res) => {
    if (!advancedSchemaReady) {
        return res.status(503).json({ message: "Notifications are still initializing. Try again shortly." });
    }
    const { notificationId } = req.params;
    const userId = req.userId;
    if (!isPositiveInteger(notificationId)) {
        return res.status(400).json({ message: "A valid notification ID is required." });
    }
    db.query(
        "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
        [notificationId, userId],
        (err, result) => {
            if (err) return res.status(500).json({ message: "Could not mark notification as read." });
            if (!result.affectedRows) return res.status(404).json({ message: "Notification not found." });
            res.json({ message: "Notification marked as read." });
        }
    );
});

app.get("/reviews/:noteId", (req, res) => {
    const { noteId } = req.params;
    const userId = req.userId;

    if (!isPositiveInteger(noteId)) {
        return res.status(400).json({ message: "A valid note ID is required." });
    }

    const sql = `
        SELECT review.id, review.user_id, review.rating, review.comment, review.created_at,
               review_user.email AS reviewer_email
        FROM note_reviews AS review
        INNER JOIN users AS review_user ON review_user.id = review.user_id
        WHERE review.note_id = ?
        ORDER BY review.created_at DESC, review.id DESC
    `;

    db.query(sql, [noteId], (err, reviews) => {
        if (err) {
            console.error("Could not load reviews:", err.message);
            return res.status(500).json({ message: "Could not load reviews." });
        }

        const totalReviews = reviews.length;
        const averageRating = totalReviews
            ? reviews.reduce((total, review) => total + Number(review.rating), 0) / totalReviews
            : 0;
        const ownReview = reviews.find((review) => String(review.user_id) === String(userId)) || null;

        res.json({
            averageRating: Number(averageRating.toFixed(2)),
            totalReviews,
            ownReview,
            reviews
        });
    });
});

app.post("/reviews", (req, res) => {
    const { note_id: noteId, rating, comment } = req.body;
    const userId = req.userId;
    const normalizedRating = Number(rating);
    const normalizedComment = typeof comment === "string" ? comment.trim() : "";

    if (!isPositiveInteger(noteId)) {
        return res.status(400).json({ message: "A valid note ID is required." });
    }
    if (!Number.isInteger(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
        return res.status(400).json({ message: "Rating must be a whole number from 1 to 5." });
    }
    if (!normalizedComment || normalizedComment.length > 2000) {
        return res.status(400).json({ message: "Comment is required and must be no longer than 2,000 characters." });
    }

    db.query(
        "SELECT id FROM note_reviews WHERE user_id = ? AND note_id = ?",
        [userId, noteId],
        (lookupError, existingReviews) => {
            if (lookupError) {
                return res.status(500).json({ message: "Could not verify whether you already reviewed this note." });
            }
            if (existingReviews.length) {
                return res.status(409).json({ message: "You have already reviewed this note. Update your existing review." });
            }

            db.query(
                "INSERT INTO note_reviews (user_id, note_id, rating, comment) VALUES (?, ?, ?, ?)",
                [userId, noteId, normalizedRating, normalizedComment],
                (err, result) => {
                    if (err) {
                        if (err.code === "ER_DUP_ENTRY") {
                            return res.status(409).json({ message: "You have already reviewed this note. Update your existing review." });
                        }
                        return res.status(500).json({ message: "Could not save your review." });
                    }

                    notifyNoteOwner(
                        noteId,
                        userId,
                        "note_review",
                        "New rating and comment",
                        "A student rated and commented on your note.",
                        (notifyError, notification) => {
                            if (notifyError) {
                                console.error("Review was saved but note-owner notification failed:", notifyError.message);
                            }
                            res.status(201).json({
                                message: notifyError
                                    ? "Review submitted, but the note-owner notification could not be created."
                                    : "Review submitted successfully.",
                                notification: { created: Boolean(notification?.notified) },
                                review: {
                                    id: result.insertId,
                                    user_id: Number(userId),
                                    note_id: Number(noteId),
                                    rating: normalizedRating,
                                    comment: normalizedComment
                                }
                            });
                        }
                    );
                }
            );
        }
    );
});

app.put("/reviews/:reviewId", (req, res) => {
    const { reviewId } = req.params;
    const { note_id: noteId } = req.body;
    const { rating, comment } = req.body;
    const userId = req.userId;
    const normalizedRating = Number(rating);
    const normalizedComment = typeof comment === "string" ? comment.trim() : "";

    if (!isPositiveInteger(noteId) || !isPositiveInteger(reviewId)) {
        return res.status(400).json({ message: "Valid note and review IDs are required." });
    }
    if (!Number.isInteger(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
        return res.status(400).json({ message: "Rating must be a whole number from 1 to 5." });
    }
    if (!normalizedComment || normalizedComment.length > 2000) {
        return res.status(400).json({ message: "Comment is required and must be no longer than 2,000 characters." });
    }

    db.query(
        "UPDATE note_reviews SET rating = ?, comment = ? WHERE id = ? AND note_id = ? AND user_id = ?",
        [normalizedRating, normalizedComment, reviewId, noteId, userId],
        (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Could not update your review." });
            }
            if (result.affectedRows === 0) {
                return db.query(
                    "SELECT id FROM note_reviews WHERE id = ? AND note_id = ? AND user_id = ?",
                    [reviewId, noteId, userId],
                    (lookupError, reviews) => {
                        if (lookupError) {
                            return res.status(500).json({ message: "Could not verify your review." });
                        }
                        if (!reviews.length) {
                            return res.status(404).json({ message: "Review not found or you do not have permission to update it." });
                        }

                        res.json({
                            message: "Review updated successfully.",
                            review: {
                                id: Number(reviewId),
                                user_id: Number(userId),
                                note_id: Number(noteId),
                                rating: normalizedRating,
                                comment: normalizedComment
                            }
                        });
                    }
                );
            }

            res.json({
                message: "Review updated successfully.",
                review: {
                    id: Number(reviewId),
                    user_id: Number(userId),
                    note_id: Number(noteId),
                    rating: normalizedRating,
                    comment: normalizedComment
                }
            });
        }
    );
});

app.delete("/reviews/:reviewId", (req, res) => {
    const { reviewId } = req.params;
    const { note_id: noteId } = req.body;
    const userId = req.userId;

    if (!isPositiveInteger(noteId) || !isPositiveInteger(reviewId)) {
        return res.status(400).json({ message: "Valid note and review IDs are required." });
    }

    db.query(
        "DELETE FROM note_reviews WHERE id = ? AND note_id = ? AND user_id = ?",
        [reviewId, noteId, userId],
        (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Could not delete your review." });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Review not found or you do not have permission to delete it." });
            }

            res.json({ message: "Review deleted successfully." });
        }
    );
});
app.get("/auth/me", (req, res) => {
    if (!isPositiveInteger(req.session?.userId)) return res.status(401).json({ message: "Not signed in." });
    db.query(
        "SELECT id, name, email, role, created_at FROM users WHERE id = ?",
        [req.session.userId],
        (err, rows) => {
            if (err) return res.status(500).json({ message: "Could not restore your session." });
            if (!rows.length) {
                return req.session.destroy(() => res.status(401).json({ message: "Not signed in." }));
            }
            res.json({ user: rows[0] });
        }
    );
});

app.post("/auth/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ message: "Could not end your session." });
        res.clearCookie("notes.sid", sessionCookieOptions);
        res.json({ message: "Signed out successfully." });
    });
});

app.post("/login", (req, res) => {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";
    if (!email || email.length > 254 || !password || password.length > 1024) {
        return res.status(400).json({ message: "A valid email and password are required." });
    }

    db.query(
        "SELECT id, name, email, role, created_at, password FROM users WHERE email = ? LIMIT 1",
        [email],
        async (err, rows) => {
            if (err) return res.status(500).json({ message: "Could not sign in." });
            if (!rows.length) return res.status(401).json({ message: "Invalid email or password." });

            const dbUser = rows[0];
            const storedPassword = String(dbUser.password || "");
            const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(storedPassword);
            let passwordMatches = false;
            try {
                passwordMatches = isBcryptHash
                    ? await bcrypt.compare(password, storedPassword)
                    : password === storedPassword;
            } catch (passwordError) {
                console.error("Could not verify login credentials:", passwordError.message);
                return res.status(500).json({ message: "Could not sign in." });
            }
            if (!passwordMatches) return res.status(401).json({ message: "Invalid email or password." });

            const completeLogin = () => {
                req.session.regenerate((sessionError) => {
                    if (sessionError) return res.status(500).json({ message: "Could not create a sign-in session." });
                    req.session.userId = Number(dbUser.id);
                    req.session.save((saveError) => {
                        if (saveError) return res.status(500).json({ message: "Could not save your sign-in session." });
                        const publicUser = {
                            id: dbUser.id,
                            name: dbUser.name,
                            email: dbUser.email,
                            role: dbUser.role,
                            created_at: dbUser.created_at,
                        };
                        res.json({ message: "Login successful.", user: publicUser });
                    });
                });
            };

            if (!isBcryptHash) {
                try {
                    const passwordHash = await bcrypt.hash(password, 12);
                    db.query("UPDATE users SET password = ? WHERE id = ?", [passwordHash, dbUser.id], (updateError) => {
                        if (updateError) return res.status(500).json({ message: "Could not secure the account password." });
                        completeLogin();
                    });
                } catch (hashError) {
                    console.error("Could not secure account password:", hashError.message);
                    return res.status(500).json({ message: "Could not sign in." });
                }
                return;
            }
            completeLogin();
        }
    );
});
// ================= USER MANAGEMENT APIs =================

const userRoles = new Set(["student", "admin"]);
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;

function requireAdmin(req, res, next) {
    db.query("SELECT role FROM users WHERE id = ?", [req.userId], (err, users) => {
        if (err) return res.status(500).json({ message: "Could not verify your permissions." });
        if (users[0]?.role !== "admin") {
            return res.status(403).json({ message: "Only administrators can manage users." });
        }
        next();
    });
}

app.get("/users", requireAdmin, (req, res) => {
    db.query(
        `SELECT users.id, users.name, users.email, users.role, users.created_at,
                COUNT(notes.id)::int AS notes_uploaded
         FROM users
         LEFT JOIN notes ON notes.uploaded_by = users.id
         GROUP BY users.id
         ORDER BY users.created_at DESC, users.id DESC`,
        (err, users) => {
            if (err) return res.status(500).json({ message: "Could not load users." });
            res.json(users);
        }
    );
});

app.post("/users", requireAdmin, async (req, res) => {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const role = typeof req.body.role === "string" ? req.body.role.trim().toLowerCase() : "student";
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!name || name.length > 100) return res.status(400).json({ message: "A name of up to 100 characters is required." });
    if (!isValidEmail(email)) return res.status(400).json({ message: "A valid email address is required." });
    if (!userRoles.has(role)) return res.status(400).json({ message: "Role must be student or admin." });
    if (password.length < 8 || password.length > 1024) {
        return res.status(400).json({ message: "The temporary password must be at least 8 characters." });
    }

    let passwordHash;
    try {
        passwordHash = await bcrypt.hash(password, 12);
    } catch (hashError) {
        console.error("Could not hash new user password:", hashError.message);
        return res.status(500).json({ message: "Could not create the user." });
    }

    db.query(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?) RETURNING id, name, email, role, created_at",
        [name, email, passwordHash, role],
        (err, result) => {
            if (err) {
                if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "A user with this email already exists." });
                return res.status(500).json({ message: "Could not create the user." });
            }
            res.status(201).json({ message: "User created.", user: { ...result.rows[0], notes_uploaded: 0 } });
        }
    );
});

app.patch("/users/:targetId/role", requireAdmin, (req, res) => {
    const { targetId } = req.params;
    const role = typeof req.body.role === "string" ? req.body.role.trim().toLowerCase() : "";
    if (!isPositiveInteger(targetId)) return res.status(400).json({ message: "A valid user ID is required." });
    if (!userRoles.has(role)) return res.status(400).json({ message: "Role must be student or admin." });
    if (Number(targetId) === req.userId) return res.status(400).json({ message: "You cannot change your own role." });

    db.query(
        "UPDATE users SET role = ? WHERE id = ? RETURNING id, role",
        [role, targetId],
        (err, result) => {
            if (err) return res.status(500).json({ message: "Could not update the role." });
            if (!result.rows.length) return res.status(404).json({ message: "User not found." });
            res.json({ message: "Role updated.", user: result.rows[0] });
        }
    );
});

app.delete("/users/:targetId", requireAdmin, (req, res) => {
    const { targetId } = req.params;
    if (!isPositiveInteger(targetId)) return res.status(400).json({ message: "A valid user ID is required." });
    if (Number(targetId) === req.userId) return res.status(400).json({ message: "You cannot remove your own account." });

    db.query("DELETE FROM users WHERE id = ?", [targetId], (err, result) => {
        if (err) return res.status(500).json({ message: "Could not remove the user." });
        if (!result.affectedRows) return res.status(404).json({ message: "User not found." });
        res.json({ message: "User removed." });
    });
});

app.post("/auth/change-password", (req, res) => {
    const currentPassword = typeof req.body.current_password === "string" ? req.body.current_password : "";
    const newPassword = typeof req.body.new_password === "string" ? req.body.new_password : "";
    if (!currentPassword || newPassword.length < 8 || newPassword.length > 1024) {
        return res.status(400).json({ message: "Enter your current password and a new password of at least 8 characters." });
    }

    db.query("SELECT password FROM users WHERE id = ?", [req.userId], async (err, users) => {
        if (err) return res.status(500).json({ message: "Could not change your password." });
        if (!users.length) return res.status(404).json({ message: "User not found." });
        try {
            if (!await bcrypt.compare(currentPassword, String(users[0].password || ""))) {
                return res.status(400).json({ message: "Your current password is incorrect." });
            }
            const passwordHash = await bcrypt.hash(newPassword, 12);
            db.query("UPDATE users SET password = ? WHERE id = ?", [passwordHash, req.userId], (updateError) => {
                if (updateError) return res.status(500).json({ message: "Could not change your password." });
                res.json({ message: "Password changed successfully." });
            });
        } catch (passwordError) {
            console.error("Could not change password:", passwordError.message);
            res.status(500).json({ message: "Could not change your password." });
        }
    });
});

// ================= BOOKMARK APIs =================

// Add bookmark
app.post("/bookmarks", (req, res) => {
    const user_id = req.userId;
    const { note_id } = req.body;

    if (!isPositiveInteger(note_id)) {
        return res.status(400).json({
            message: "A valid note ID is required."
        });
    }

    const sql = `
        INSERT INTO bookmarks (user_id, note_id)
        VALUES (?, ?)
    `;

    db.query(sql, [user_id, note_id], (err, result) => {
        if (err) {
            if (err.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                    message: "Note already bookmarked"
                });
            }

            return res.status(500).json({
                message: "Database error",
                error: err.message
            });
        }

        notifyNoteOwner(note_id, user_id, "note_bookmark", "Your note was bookmarked", "A student saved your note.", (notifyError) => {
            if (notifyError) console.error("Could not notify note owner about bookmark:", notifyError.message);
        });
        res.status(201).json({
            message: "Note bookmarked successfully",
            bookmark_id: result.insertId
        });
    });
});

// Get user's bookmarks
app.get("/bookmarks/:userId", (req, res) => {
    const userId = Number(req.params.userId);
    if (!isPositiveInteger(userId)) return res.status(400).json({ message: "A valid user ID is required." });
    if (userId !== req.userId) return res.status(403).json({ message: "You cannot access another user's bookmarks." });

    const sql = `
        SELECT 
            bookmarks.id AS bookmark_id,
            notes.id AS note_id,
            notes.title,
            notes.subject,
            notes.department,
            notes.semester,
            bookmarks.created_at
        FROM bookmarks
        JOIN notes ON bookmarks.note_id = notes.id
        WHERE bookmarks.user_id = ?
        ORDER BY bookmarks.created_at DESC
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err.message
            });
        }

        res.json(results);
    });
});

// Remove bookmark
app.delete("/bookmarks/:userId/:noteId", (req, res) => {
    const { userId, noteId } = req.params;
    if (!isPositiveInteger(userId) || !isPositiveInteger(noteId)) {
        return res.status(400).json({ message: "Valid user and note IDs are required." });
    }
    if (Number(userId) !== req.userId) return res.status(403).json({ message: "You cannot change another user's bookmarks." });

    const sql = `
        DELETE FROM bookmarks
        WHERE user_id = ? AND note_id = ?
    `;

    db.query(sql, [userId, noteId], (err, result) => {
        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err.message
            });
        }

        res.json({
            message: "Bookmark removed successfully"
        });
    });
});

app.use((req, res) => {
    res.status(404).json({ message: "API endpoint not found." });
});

app.use((err, req, res, next) => {
    console.error("Request failed:", err.message);
    if (res.headersSent) return next(err);
    res.status(err.status || 500).json({ message: "The request could not be processed." });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});