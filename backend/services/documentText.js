const fs = require("fs/promises");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const JSZip = require("jszip");

const MAX_EXTRACTED_CHARACTERS = 80000;

async function extractNoteText(filePath, originalName) {
    const extension = path.extname(originalName || filePath).toLowerCase();
    let text;
    const fileStats = await fs.stat(filePath).catch((error) => {
        const missing = new Error("The uploaded note file is missing from backend storage.");
        missing.status = error.code === "ENOENT" ? 404 : 500;
        throw missing;
    });
    if (!fileStats.isFile()) {
        const error = new Error("The uploaded note path does not point to a file.");
        error.status = 422;
        throw error;
    }
    if (fileStats.size === 0) {
        const error = new Error("The uploaded note file is empty. Upload a valid document before requesting AI analysis.");
        error.status = 422;
        throw error;
    }

    if (extension === ".pdf") {
        const buffer = await fs.readFile(filePath);
        if (!buffer.length) {
            const error = new Error("The uploaded PDF is empty. Upload a valid PDF before requesting AI analysis.");
            error.status = 422;
            throw error;
        }
        let parsed;
        try {
            parsed = await pdfParse(buffer);
        } catch {
            const error = new Error("The uploaded PDF is invalid or could not be parsed.");
            error.status = 422;
            throw error;
        }
        text = parsed.text;
    } else if (extension === ".docx") {
        const buffer = await fs.readFile(filePath);
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
    } else if (extension === ".pptx") {
        const buffer = await fs.readFile(filePath);
        let archive;
        try {
            archive = await JSZip.loadAsync(buffer);
        } catch {
            const error = new Error("The uploaded PowerPoint file is invalid or could not be parsed.");
            error.status = 422;
            throw error;
        }

        const slides = Object.keys(archive.files)
            .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
            .sort((left, right) => {
                const leftNumber = Number(left.match(/slide(\d+)\.xml$/)[1]);
                const rightNumber = Number(right.match(/slide(\d+)\.xml$/)[1]);
                return leftNumber - rightNumber;
            });
        const decodeXmlText = (value) => value
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, "\"")
            .replace(/&apos;/g, "'")
            .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
            .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
        const slideText = [];
        for (const slideName of slides) {
            const xml = await archive.file(slideName).async("string");
            const parts = [...xml.matchAll(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g)]
                .map((match) => decodeXmlText(match[1]).trim())
                .filter(Boolean);
            if (parts.length) slideText.push(parts.join(" "));
        }
        text = slideText.join("\n");
    } else if (extension === ".csv") {
        text = await fs.readFile(filePath, "utf8");
    } else {
        const error = new Error("Text extraction is currently supported for PDF, DOCX, PPTX, and CSV notes.");
        error.status = 415;
        throw error;
    }

    const normalized = String(text || "").replace(/\u0000/g, "").trim();
    if (!normalized) {
        const error = new Error("No readable text was found in this note.");
        error.status = 422;
        throw error;
    }

    return normalized.slice(0, MAX_EXTRACTED_CHARACTERS);
}

module.exports = { extractNoteText };
