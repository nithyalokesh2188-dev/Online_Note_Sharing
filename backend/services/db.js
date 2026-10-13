const { Pool } = require("pg");

// PostgreSQL pool exposing the callback-style API the routes were written against:
// `?` placeholders, SELECT results as row arrays, and `insertId` / `affectedRows` on writes.
// A pool (rather than one client) survives hosted databases such as Neon closing idle connections.
function convertPlaceholders(sql) {
    let index = 0;
    let inString = false;
    let converted = "";
    for (const character of sql) {
        if (character === "'") inString = !inString;
        converted += character === "?" && !inString ? `$${++index}` : character;
    }
    return converted;
}

function runQuery(queryable, sql, params, callback) {
    if (typeof params === "function") {
        callback = params;
        params = [];
    }
    let text = convertPlaceholders(sql);
    const isInsert = /^\s*INSERT\b/i.test(text);
    if (isInsert && !/\bRETURNING\b/i.test(text) && !/\bstored_files\b/i.test(text)) text = `${text.trimEnd()} RETURNING id`;

    queryable.query(text, params || []).then(
        (result) => {
            if (result.command === "SELECT") return callback(null, result.rows);
            callback(null, {
                insertId: isInsert ? result.rows[0]?.id ?? null : null,
                affectedRows: result.rowCount,
                rows: result.rows,
            });
        },
        (error) => {
            if (error.code === "23505") {
                error.pgCode = error.code;
                error.code = "ER_DUP_ENTRY";
            }
            callback(error);
        }
    );
}

function createDatabase(config) {
    const pool = new Pool({ max: 10, idleTimeoutMillis: 30000, ...config });
    pool.on("error", (error) => console.error("PostgreSQL pool error:", error.message));

    return {
        pool,
        connect: (callback) => pool.query("SELECT 1").then(() => callback(null), callback),
        query: (sql, params, callback) => runQuery(pool, sql, params, callback),
        exec: (sql) => pool.query(sql),
        // Transactions get a dedicated client so concurrent requests never share BEGIN/COMMIT.
        beginTransaction: (callback) => {
            pool.connect().then(async (client) => {
                let released = false;
                const release = () => {
                    if (!released) client.release();
                    released = true;
                };
                try {
                    await client.query("BEGIN");
                } catch (error) {
                    release();
                    return callback(error);
                }
                callback(null, {
                    query: (sql, params, done) => runQuery(client, sql, params, done),
                    commit: (done) => client.query("COMMIT").then(() => { release(); done(null); }, (error) => done(error)),
                    rollback: (done) => client.query("ROLLBACK").catch(() => {}).then(() => { release(); done(); }),
                });
            }, callback);
        },
    };
}

module.exports = { createDatabase };
