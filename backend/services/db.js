const { Client } = require("pg");

// PostgreSQL client exposing the callback-style API the routes were written against:
// `?` placeholders, SELECT results as row arrays, and `insertId` / `affectedRows` on writes.
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

function createDatabase(config) {
    const client = new Client(config);

    function query(sql, params, callback) {
        if (typeof params === "function") {
            callback = params;
            params = [];
        }
        let text = convertPlaceholders(sql);
        const isInsert = /^\s*INSERT\b/i.test(text);
        if (isInsert && !/\bRETURNING\b/i.test(text)) text = `${text.trimEnd()} RETURNING id`;

        client.query(text, params || []).then(
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

    const run = (statement) => (callback) => query(statement, (error) => callback(error || null));

    return {
        connect: (callback) => client.connect().then(() => callback(null), callback),
        query,
        exec: (sql) => client.query(sql),
        beginTransaction: run("BEGIN"),
        commit: run("COMMIT"),
        rollback: (callback) => query("ROLLBACK", () => callback()),
    };
}

module.exports = { createDatabase };
