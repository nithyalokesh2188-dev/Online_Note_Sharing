import React, { useEffect, useState } from "react";
import "./advanced-features.css";

const API_BASE_URL = "http://localhost:5000";

async function requestJson(url, options) {
  const response = await fetch(url, { ...options, credentials: "include" });
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("The backend returned an unexpected response. Confirm it is running on port 5000.");
  }
  const data = await response.json();
  if (response.status === 404 && data.message === "API endpoint not found.") {
    throw new Error("The AI route is missing from the backend currently running on port 5000. Restart the updated backend server.");
  }
  if (!response.ok) {
    const error = new Error(data.message || "The request failed.");
    error.status = response.status;
    throw error;
  }
  return data;
}

const INLINE_MARKDOWN = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)\s]+\)|\*[^*\s][^*]*\*)/g;

function renderInlineMarkdown(text, keyPrefix) {
  return text.split(INLINE_MARKDOWN).filter(Boolean).map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={key}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={key}>{part.slice(1, -1)}</code>;
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
    if (link) return <a key={key} href={link[2]} target="_blank" rel="noreferrer">{link[1]}</a>;
    if (/^\*[^*\s][^*]*\*$/.test(part)) return <em key={key}>{part.slice(1, -1)}</em>;
    return part;
  });
}

// Renders the Markdown subset AI responses use (headings, lists, emphasis, code, links)
// as React elements, so no model output is ever injected as raw HTML.
export function MarkdownText({ text, className = "" }) {
  const blocks = [];
  let list = null;
  let paragraph = [];
  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: "p", text: paragraph.join(" ") });
    paragraph = [];
  };
  const flushList = () => {
    if (list) blocks.push(list);
    list = null;
  };

  String(text || "").split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine.trim();
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    const bullet = line.match(/^[*-]\s+(.*)$/);
    const numbered = line.match(/^\d+[.)]\s+(.*)$/);
    if (!line) {
      flushParagraph();
      flushList();
    } else if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
      flushParagraph();
      flushList();
      blocks.push({ type: "hr" });
    } else if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ type: "h", level: Math.min(heading[1].length + 2, 6), text: heading[2] });
    } else if (bullet || numbered) {
      flushParagraph();
      const type = bullet ? "ul" : "ol";
      if (list?.type !== type) {
        flushList();
        list = { type, items: [] };
      }
      list.items.push((bullet || numbered)[1]);
    } else {
      flushList();
      paragraph.push(line);
    }
  });
  flushParagraph();
  flushList();

  return (
    <div className={`markdown-text ${className}`}>
      {blocks.map((block, index) => {
        if (block.type === "hr") return <hr key={index} />;
        if (block.type === "h") {
          const Heading = `h${block.level}`;
          return <Heading key={index}>{renderInlineMarkdown(block.text, index)}</Heading>;
        }
        if (block.type === "ul" || block.type === "ol") {
          const List = block.type;
          return <List key={index}>{block.items.map((item, itemIndex) => <li key={itemIndex}>{renderInlineMarkdown(item, `${index}-${itemIndex}`)}</li>)}</List>;
        }
        return <p key={index}>{renderInlineMarkdown(block.text, index)}</p>;
      })}
    </div>
  );
}

export function AskAiDialog({ initialQuestion = "", onClose }) {
  const [question, setQuestion] = useState(initialQuestion);
  const [result, setResult] = useState(null);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");

  const ask = async (text = question) => {
    const trimmed = text.trim();
    if (!trimmed || asking) return;
    setAsking(true);
    setError("");
    setResult(null);
    try {
      setResult(await requestJson(`${API_BASE_URL}/ai/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setAsking(false);
    }
  };

  useEffect(() => {
    if (initialQuestion.trim()) ask(initialQuestion);
  }, []);

  return (
    <div className="advanced-overlay ai-overlay" role="presentation" onClick={onClose}>
      <section className="advanced-dialog ai-dialog" role="dialog" aria-modal="true" aria-labelledby="ask-ai-title" onClick={(event) => event.stopPropagation()}>
        <header className="ai-dialog-header">
          <button className="advanced-close" type="button" aria-label="Close Ask AI" onClick={onClose}>×</button>
          <p className="eyebrow">AI study tools</p>
          <h2 id="ask-ai-title">Ask AI</h2>
          <p className="advanced-subtitle">Get an answer from the web, with sources.</p>
        </header>
        <form className="ask-ai-form" onSubmit={(event) => { event.preventDefault(); ask(); }}>
          <input
            aria-label="Your question"
            value={question}
            maxLength={500}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="e.g. What is Python?"
            autoFocus
          />
          <button className="primary-button" type="submit" disabled={asking || !question.trim()}>{asking ? "Searching…" : "Ask"}</button>
        </form>
        <div className="ai-dialog-body">
          {error && <p className="advanced-error" role="alert">{error}</p>}
          {asking && <p className="advanced-state">Searching the web and writing an answer…</p>}
          {result && (
            <>
              <MarkdownText className="ai-summary-content" text={result.answer} />
              {result.sources?.length > 0 && (
                <section className="ask-ai-sources">
                  <h3>Sources</h3>
                  <ol>{result.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ol>
                </section>
              )}
              <p className="ask-ai-provider">{result.provider === "google" ? "Answered using Google Search." : "Answered using Wikipedia sources."} AI answers can contain mistakes — check the sources.</p>
            </>
          )}
          {!result && !asking && !error && <p className="advanced-state">Ask any study question, like “What is Python?” or “Explain normalization in DBMS”.</p>}
        </div>
      </section>
    </div>
  );
}

export function AiNoteDialog({ note, user, mode, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [selectedQuestionSetId, setSelectedQuestionSetId] = useState("");

  const aiRoute = mode === "summary" ? "ai-summary" : "ai-questions";
  const endpoint = `${API_BASE_URL}/notes/${encodeURIComponent(note.id)}/${aiRoute}?user_id=${encodeURIComponent(user.id)}`;

  const load = async () => {
    setLoading(true);
    setError("");
    setServiceUnavailable(false);
    try {
      const result = await requestJson(endpoint);
      setData(result[mode] || result.questionSets?.length ? result : null);
    } catch (requestError) {
      setError(requestError.message);
      setServiceUnavailable(
        requestError.status === 503 && requestError.message.startsWith("AI service is not configured.")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [endpoint]);

  const generate = async () => {
    setGenerating(true);
    setError("");
    setServiceUnavailable(false);
    try {
      const result = await requestJson(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, regenerate: true }),
      });
      if (mode === "questions") {
        const questionSet = {
          id: result.questionSetId,
          questions: result.questions,
          createdAt: result.createdAt,
          isCurrentContent: true,
        };
        setData((current) => ({
          ...result,
          questionSets: [questionSet, ...(current?.questionSets || [])],
        }));
        setSelectedQuestionSetId(String(result.questionSetId));
      } else {
        setData(result);
      }
    } catch (requestError) {
      setError(requestError.message);
      setServiceUnavailable(
        requestError.status === 503 && requestError.message.startsWith("AI service is not configured.")
      );
    } finally {
      setGenerating(false);
    }
  };

  const displayedQuestionSet = mode === "questions"
    ? data?.questionSets?.find((item) => String(item.id) === selectedQuestionSetId)
      || data?.questionSets?.find((item) => item.isCurrentContent)
      || data?.questionSets?.[0]
    : null;
  const displayedQuestions = displayedQuestionSet?.questions || data?.questions;

  return (
    <div className="advanced-overlay ai-overlay" role="presentation" onClick={onClose}>
      <section className="advanced-dialog ai-dialog" role="dialog" aria-modal="true" aria-labelledby="ai-dialog-title" onClick={(event) => event.stopPropagation()}>
        <header className="ai-dialog-header">
          <button className="advanced-close" type="button" aria-label="Close AI tool" onClick={onClose}>×</button>
          <p className="eyebrow">AI study tools</p>
          <h2 id="ai-dialog-title">{mode === "summary" ? "AI note summary" : "AI generated questions"}</h2>
          <p className="advanced-subtitle">{note.title}</p>
        </header>
        <div className="ai-dialog-body">
          {error && <p className="advanced-error" role="alert">{error}</p>}
          {loading ? <p className="advanced-state">Checking for a saved result…</p> : data ? (
            mode === "summary" ? (
              <MarkdownText className="ai-summary-content" text={data.summary} />
            ) : (
              <>
                {data.questionSets?.length > 0 && (
                  <label className="question-history-picker">
                    Previously generated sets
                    <select
                      value={selectedQuestionSetId || String(displayedQuestionSet?.id || "")}
                      onChange={(event) => setSelectedQuestionSetId(event.target.value)}
                    >
                      {data.questionSets.map((set, index) => (
                        <option key={set.id || `new-${index}`} value={String(set.id)}>
                          {set.createdAt ? new Date(set.createdAt).toLocaleString() : "Generated question set"}
                          {set.isCurrentContent ? " · current note version" : " · earlier note version"}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <div className="ai-question-groups">
                  {[
                    ["1-mark questions", displayedQuestions?.oneMark],
                    ["5-mark questions", displayedQuestions?.fiveMark],
                    ["10-mark questions", displayedQuestions?.tenMark],
                  ].map(([heading, questions]) => (
                    <section key={heading}>
                      <h3>{heading}</h3>
                      <ol>{(questions || []).map((question, index) => <li key={`${heading}-${index}`}>{question}</li>)}</ol>
                    </section>
                  ))}
                  <section>
                    <h3>Multiple-choice questions</h3>
                    {(displayedQuestions?.mcqs || []).map((item, index) => (
                      <article className="ai-mcq" key={`mcq-${index}`}>
                        <strong>{index + 1}. {item.question}</strong>
                        <ol type="A">{item.options.map((option, optionIndex) => <li key={`option-${optionIndex}`}>{option}</li>)}</ol>
                        <p><b>Answer:</b> {item.answer}</p>
                      </article>
                    ))}
                  </section>
                </div>
              </>
            )
          ) : error || serviceUnavailable ? null : (
            <div className="advanced-empty">
              <p>No saved {mode === "summary" ? "summary" : "question set"} exists for this note yet.</p>
              <p>Click Generate to create one from the text in this note’s file (PDF, DOCX, PPTX, or CSV). It is saved so it opens instantly next time.</p>
            </div>
          )}
        </div>
        {!serviceUnavailable && <footer className="advanced-actions ai-dialog-footer">
          {data && <span className="advanced-saved-label">{data.cached ? "Saved result" : "Generated and saved"}</span>}
          <button className="primary-button" type="button" onClick={generate} disabled={loading || generating}>
            {generating ? "Generating…" : data ? "Regenerate" : "Generate"}
          </button>
        </footer>}
      </section>
    </div>
  );
}

export function NoteVersionsDialog({ note, user, onClose }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const canUpload = String(note.uploaded_by) === String(user.id);
  const versionsUrl = `${API_BASE_URL}/notes/${encodeURIComponent(note.id)}/versions?user_id=${encodeURIComponent(user.id)}`;

  const loadVersions = async () => {
    setLoading(true);
    try {
      const result = await requestJson(versionsUrl);
      setVersions(result.versions || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadVersions(); }, [versionsUrl]);

  const uploadVersion = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      setError("Choose a file for the new version.");
      return;
    }
    setUploading(true);
    setError("");
    setMessage("");
    try {
      const body = new FormData();
      body.append("file", selectedFile);
      body.append("user_id", user.id);
      await requestJson(`${API_BASE_URL}/notes/${encodeURIComponent(note.id)}/versions`, { method: "POST", body });
      setMessage("New version uploaded successfully.");
      setSelectedFile(null);
      await loadVersions();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="advanced-overlay" role="presentation" onClick={onClose}>
      <section className="advanced-dialog versions-dialog" role="dialog" aria-modal="true" aria-labelledby="versions-title" onClick={(event) => event.stopPropagation()}>
        <button className="advanced-close" type="button" aria-label="Close version history" onClick={onClose}>×</button>
        <p className="eyebrow">Document history</p>
        <h2 id="versions-title">Version history</h2>
        <p className="advanced-subtitle">{note.title}</p>
        {error && <p className="advanced-error" role="alert">{error}</p>}
        {message && <p className="advanced-success" role="status">{message}</p>}
        {loading ? <p className="advanced-state">Loading versions…</p> : versions.length ? (
          <ol className="version-list">
            {versions.map((version) => (
              <li key={version.id}>
                <div>
                  <strong>Version {version.version_number}{version.is_current ? <span className="current-version-label">Latest</span> : null}</strong>
                  <span>{version.file_name}</span>
                  <small>{version.created_at ? new Date(version.created_at).toLocaleString() : ""}{version.updated_by_email ? ` · ${version.updated_by_email}` : ""}</small>
                </div>
                <a className="version-download" href={`${API_BASE_URL}/note-versions/${encodeURIComponent(version.id)}/download?user_id=${encodeURIComponent(user.id)}`}>Download</a>
              </li>
            ))}
          </ol>
        ) : <p className="advanced-empty">No version history is available for this note.</p>}
        {canUpload && (
          <form className="version-upload-form" onSubmit={uploadVersion}>
            <label htmlFor="new-note-version">Upload a new version</label>
            <input id="new-note-version" type="file" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} />
            <button className="primary-button" type="submit" disabled={uploading}>{uploading ? "Uploading…" : "Upload version"}</button>
          </form>
        )}
      </section>
    </div>
  );
}
