
import React, { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { AiNoteDialog, AskAiDialog, NoteVersionsDialog } from "./AdvancedNoteDialogs";
import "./app.css";
import { AuthProvider, useAuth } from "./AuthContext";
import Login from "./Login";
import { ThemePicker, ThemeSwatches } from "./ThemePicker";

const navigation = [
  { label: "Dashboard", icon: "grid" },
  { label: "My Notes", icon: "file" },
  { label: "Upload Note", icon: "upload" },
  { label: "Uploaded Notes", icon: "folder" },
  { label: "Explore Notes", icon: "search" },
  { label: "Study Groups", icon: "users" },
  { label: "User Management", icon: "userManagement" },
  { label: "Bookmarks", icon: "bookmark" },
  { label: "Notifications", icon: "bell" },
  { label: "Settings", icon: "settings" },
];

const notes = [
  { title: "Data Structures & Algorithms", subject: "Computer Science", meta: "Updated 2 hours ago", color: "blue", initials: "DS" },
  { title: "Organic Chemistry Basics", subject: "Chemistry", meta: "Updated yesterday", color: "purple", initials: "OC" },
  { title: "Microeconomics — Unit 3", subject: "Economics", meta: "Updated 3 days ago", color: "orange", initials: "ME" },
];

const initialMyNotes = [
  { id: 1, fileName: "data-structures-algorithms.pdf", title: "Data Structures & Algorithms", subject: "Computer Science", semester: "Semester 4", year: "2025–26", type: "PDF", uploaded: "2026-09-19", uploadDate: "Sep 19, 2026", size: "2.4 MB", uploader: "Alex Kumar", keywords: "algorithms linked lists exam", color: "blue" },
  { id: 2, fileName: "organic-chemistry-basics.docx", title: "Organic Chemistry Basics", subject: "Chemistry", semester: "Semester 2", year: "2025–26", type: "DOCX", uploaded: "2026-09-17", uploadDate: "Sep 17, 2026", size: "1.1 MB", uploader: "Alex Kumar", keywords: "organic chemistry revision", color: "purple" },
  { id: 3, fileName: "microeconomics-unit-3.pptx", title: "Microeconomics — Unit 3", subject: "Economics", semester: "Semester 3", year: "2024–25", type: "PPTX", uploaded: "2026-09-14", uploadDate: "Sep 14, 2026", size: "4.8 MB", uploader: "Alex Kumar", keywords: "microeconomics unit demand supply", color: "orange" },
  { id: 4, fileName: "engineering-mathematics-formulas.pdf", title: "Engineering Mathematics Formula Sheet", subject: "Mathematics", semester: "Semester 1", year: "2025–26", type: "PDF", uploaded: "2026-09-09", uploadDate: "Sep 9, 2026", size: "860 KB", uploader: "Alex Kumar", keywords: "mathematics formulas calculus", color: "green" },
];

const members = [
  { name: "Maya Patel", email: "maya.patel@university.edu", role: "Student", status: "Active", initials: "MP", color: "purple" },
  { name: "Jordan Lee", email: "jordan.lee@university.edu", role: "Moderator", status: "Active", initials: "JL", color: "blue" },
  { name: "Priya Shah", email: "priya.shah@university.edu", role: "Student", status: "Pending", initials: "PS", color: "orange" },
  { name: "Ethan Williams", email: "ethan.williams@university.edu", role: "Student", status: "Active", initials: "EW", color: "green" },
];

function Icon({ name, size = 20 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    file: <><path d="M6 3.5h8l4 4V20.5H6z" /><path d="M14 3.5v4h4M9 12h6M9 16h6" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.3" /><path d="m16 16 4.5 4.5" /></>,
    users: <><path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20" /><circle cx="9.5" cy="7" r="3.5" /><path d="M17 11a3.5 3.5 0 0 0-1.5-6.7M21 20v-1.5a4 4 0 0 0-3-3.8" /></>,
    userManagement: <><circle cx="10" cy="8" r="3.2" /><path d="M4 20v-1.5A4.5 4.5 0 0 1 8.5 14h3A4.5 4.5 0 0 1 16 18.5V20M17 5v5M14.5 7.5h5" /></>,
    bookmark: <path d="M6 4.5A2.5 2.5 0 0 1 8.5 2h7A2.5 2.5 0 0 1 18 4.5V21l-6-3.5L6 21z" />,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-2.5V20a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H6v-2.5h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V4h2.5v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v2.5H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    upload: <><path d="M12 16V4M7 9l5-5 5 5M5 20h14" /></>,
    trash: <><path d="M4 7h16M10 11v5M14 11v5M6 7l1 13h10l1-13M9 7V4h6v3" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    folder: <><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v8A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5z" /><path d="M3 10h18" /></>,
    download: <><path d="M12 4v11M7 11l5 5 5-5M5 20h14" /></>,
    eye: <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></>,
    check: <path d="m4.5 12.5 5 5 10-11" />,
  };

  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

const uploadInitialForm = {
  title: "",
  subject: "",
  department: "",
  semester: "",
  description: "",
  tags: "",
};

const acceptedFileTypes = ["pdf", "csv", "xls", "xlsx", "doc", "docx", "ppt", "pptx", "jpg", "jpeg", "png"];
const maxFileSize = 10 * 1024 * 1024;
const acceptedFileLabel = "PDF, CSV, XLS, XLSX, DOC, DOCX, PPT, PPTX, JPG, JPEG, PNG";
const API_BASE_URL = "http://localhost:5000";
const apiFetch = (url, options = {}) => fetch(url, { ...options, credentials: "include" });
const getNoteIdFromPath = () => {
  const match = window.location.pathname.match(/^\/notes\/([1-9]\d*)\/?$/);
  return match ? match[1] : null;
};

async function readApiJson(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    const endpoint = response.url ? new URL(response.url).origin : API_BASE_URL;
    throw new Error(`The backend at ${endpoint} returned a non-JSON response. Confirm it is running on port 5000.`);
  }
  try {
    return await response.json();
  } catch {
    throw new Error("The backend returned invalid JSON. Check the backend logs and try again.");
  }
}

function mapNoteRecord(record) {
  const fileName = record.file_name || "";
  return {
    ...record,
    fileName,
    uploaded: record.uploaded_at,
    uploadedAt: record.uploaded_at,
    uploadDate: record.uploaded_at ? new Date(record.uploaded_at).toLocaleDateString() : "",
    year: record.academic_year || "",
    type: fileName.includes(".") ? fileName.split(".").pop().toUpperCase() : "FILE",
    size: "—",
    color: "blue",
    status: record.status || "pending",
    visibility: record.visibility || "Public",
  };
}

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatUploadDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

const departmentGroups = [
  {
    label: "Computer Science & IT",
    departments: [
      "BCA", "MCA", "B.Sc Computer Science", "M.Sc Computer Science",
      "B.Sc Information Technology", "M.Sc Information Technology",
      "B.Sc Data Science", "B.Sc Artificial Intelligence & Machine Learning",
      "Computer Engineering", "Information Technology",
    ],
  },
  {
    label: "Science",
    departments: [
      "B.Sc Mathematics", "M.Sc Mathematics", "B.Sc Physics", "M.Sc Physics",
      "B.Sc Chemistry", "M.Sc Chemistry", "B.Sc Biotechnology", "B.Sc Microbiology",
      "B.Sc Biochemistry", "B.Sc Botany", "B.Sc Zoology", "B.Sc Psychology",
      "B.Sc Statistics", "B.Sc Electronics", "Science",
    ],
  },
  {
    label: "Commerce & Management",
    departments: [
      "B.Com", "B.Com Computer Applications", "B.Com Accounting & Finance",
      "B.Com Corporate Secretaryship", "M.Com", "BBA", "MBA", "Business & Economics",
    ],
  },
  {
    label: "Arts & Humanities",
    departments: [
      "BA English", "MA English", "BA Economics", "MA Economics", "BA History",
      "BA Political Science", "BA Sociology", "BSW (Social Work)", "MSW (Social Work)",
      "B.Sc Visual Communication", "BA Journalism & Mass Communication",
    ],
  },
];

function UploadNotePage({ onCancel, onUploaded }) {
  const { user } = useAuth();
  const [form, setForm] = useState(uploadInitialForm);
  const [selectedFile, setSelectedFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");
  const [duplicateMatches, setDuplicateMatches] = useState([]);
  const [pendingFileHash, setPendingFileHash] = useState("");
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    if (!file) return "Please select a file.";
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!acceptedFileTypes.includes(extension)) return `Unsupported file type. Please upload one of: ${acceptedFileLabel}.`;
    if (file.size > maxFileSize) return "File is too large. The maximum allowed size is 10 MB.";
    return "";
  };

  const chooseFile = (file) => {
    const fileError = validateFile(file);
    setErrors((current) => ({ ...current, file: fileError }));
    if (fileError) {
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: "" }));
    setSuccessMessage("");
    setDuplicateMatches([]);
  };

  const getFileHash = async (file) => {
    const fileBytes = await file.arrayBuffer();
    const digest = await window.crypto.subtle.digest("SHA-256", fileBytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  };

  const saveNote = async (fileHash, allowDuplicate) => {
    if (!selectedFile || !user?.id) {
      setErrors((current) => ({ ...current, submit: "Your account or selected file could not be identified." }));
      return;
    }

    setIsUploading(true);
    setUploadProgress(25);
    setSuccessMessage("");
    setErrors((current) => ({ ...current, submit: "" }));
    try {
      const payload = new FormData();
      payload.append("title", form.title.trim());
      payload.append("subject", form.subject);
      payload.append("department", form.department);
      payload.append("semester", form.semester);
      payload.append("description", form.description.trim());
      payload.append("tags", form.tags.trim());
      payload.append("academic_year", "2026–27");
      payload.append("user_id", user.id);
      payload.append("allow_duplicate", String(allowDuplicate));
      payload.append("file", selectedFile);

      setUploadProgress(55);
      const response = await apiFetch(`${API_BASE_URL}/notes`, { method: "POST", body: payload });
      const data = await readApiJson(response);
      if (response.status === 409 && Array.isArray(data.duplicates)) {
        setDuplicateMatches(data.duplicates);
        setPendingFileHash(fileHash);
        return;
      }
      if (!response.ok) throw new Error(data.message || "Could not upload this note.");
      if (!data.note?.id) throw new Error("The backend did not return the saved note.");

      setUploadProgress(100);
      const uploadedAt = data.note.uploaded_at || new Date().toISOString();
      onUploaded({
        ...data.note,
        id: Number(data.note.id),
        year: data.note.academic_year || "2026–27",
        type: selectedFile.name.split(".").pop().toUpperCase(),
        uploaded: uploadedAt.slice(0, 10),
        uploadedAt,
        uploadDate: formatUploadDate(uploadedAt),
        size: formatFileSize(selectedFile.size),
        fileName: data.note.file_name || selectedFile.name,
        uploader: user.name || user.full_name || user.email || "Student",
        keywords: `${form.tags} ${form.description}`.toLowerCase(),
        color: "blue",
      });
      setSuccessMessage(data.message || "Note uploaded successfully.");
      setForm(uploadInitialForm);
      setSelectedFile(null);
      setDuplicateMatches([]);
      setPendingFileHash("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      setErrors((current) => ({ ...current, submit: error.message || "Could not upload this note." }));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const requiredFields = ["title", "subject", "department", "semester", "description"];
    const nextErrors = requiredFields.reduce((result, field) => {
      if (!form[field].trim()) result[field] = "This field is required.";
      return result;
    }, {});
    const fileError = validateFile(selectedFile);
    if (fileError) nextErrors.file = fileError;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setIsUploading(true);
    setUploadProgress(10);
    setSuccessMessage("");
    setErrors((current) => ({ ...current, submit: "" }));
    try {
      if (!user?.id) throw new Error("Your account could not be identified. Please sign in again.");
      const fileHash = await getFileHash(selectedFile);
      setPendingFileHash(fileHash);
      const response = await apiFetch(`${API_BASE_URL}/notes/check-duplicates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          subject: form.subject,
          file_name: selectedFile.name,
          file_hash: fileHash,
        }),
      });
      const data = await readApiJson(response);
      if (!response.ok) throw new Error(data.message || "Could not check for duplicate notes.");
      if (Array.isArray(data.duplicates) && data.duplicates.length) {
        setDuplicateMatches(data.duplicates);
        setIsUploading(false);
        setUploadProgress(0);
        return;
      }
      await saveNote(fileHash, false);
    } catch (error) {
      setErrors((current) => ({ ...current, submit: error.message || "Could not check for duplicate notes." }));
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setForm(uploadInitialForm);
    setSelectedFile(null);
    setErrors({});
    setSuccessMessage("");
    setDuplicateMatches([]);
    setPendingFileHash("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <section className="upload-note-page">
      <div className="upload-page-heading">
        <div>
          <p className="eyebrow">Share with your community</p>
          <h1>Upload Notes</h1>
          <p className="welcome-copy">Share your study materials with other students.</p>
        </div>
      </div>

      <form className="upload-form-card" onSubmit={handleSubmit} noValidate>
        <div className="upload-form-heading">
          <div><h2>Note details</h2><p>Add a few details so others can find your material.</p></div>
          <span className="required-hint">* Required fields</span>
        </div>

        <div className="upload-fields-grid">
          <label className="form-field">
            <span>Note title <b>*</b></span>
            <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Data Structures — Linked Lists" />
            {errors.title && <small className="field-error">{errors.title}</small>}
          </label>
          <label className="form-field">
            <span>Subject <b>*</b></span>
            <select name="subject" value={form.subject} onChange={handleChange}>
              <option value="">Select subject</option><option>Computer Science</option><option>Mathematics</option><option>Physics</option><option>Chemistry</option><option>Economics</option><option>Database Management System (DBMS)</option>
            </select>
            {errors.subject && <small className="field-error">{errors.subject}</small>}
          </label>
          <label className="form-field">
            <span>Department <b>*</b></span>
            <select name="department" value={form.department} onChange={handleChange}>
              <option value="">Select department</option>
              {departmentGroups.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.departments.map((department) => <option key={department}>{department}</option>)}
                </optgroup>
              ))}
            </select>
            {errors.department && <small className="field-error">{errors.department}</small>}
          </label>
          <label className="form-field">
            <span>Semester <b>*</b></span>
            <select name="semester" value={form.semester} onChange={handleChange}>
              <option value="">Select semester</option><option>Semester 1</option><option>Semester 2</option><option>Semester 3</option><option>Semester 4</option><option>Semester 5</option><option>Semester 6</option>
            </select>
            {errors.semester && <small className="field-error">{errors.semester}</small>}
          </label>
          <label className="form-field full-width">
            <span>Description <b>*</b></span>
            <textarea name="description" value={form.description} onChange={handleChange} placeholder="Briefly describe what students will find in this note..." rows="4" />
            {errors.description && <small className="field-error">{errors.description}</small>}
          </label>
          <label className="form-field full-width">
            <span>Tags <em>Optional</em></span>
            <input name="tags" value={form.tags} onChange={handleChange} placeholder="e.g. algorithms, exam prep, revision" />
          </label>
        </div>

        <div className="upload-file-section">
          <div className="file-section-label"><span>Study material <b>*</b></span><small>Maximum file size: 10 MB</small></div>
          {!selectedFile ? (
            <button
              type="button"
              className={`drop-zone ${isDragging ? "dragging" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => { event.preventDefault(); setIsDragging(false); chooseFile(event.dataTransfer.files[0]); }}
            >
              <span className="drop-icon"><Icon name="upload" size={23} /></span>
              <strong>Drag &amp; drop your file here or <u>Browse</u></strong>
              <small>Supported formats: {acceptedFileLabel}</small>
            </button>
          ) : (
            <div className="selected-file">
              <span className="selected-file-icon"><Icon name="file" size={21} /></span>
              <div><strong>{selectedFile.name}</strong><small>{selectedFile.name.split(".").pop().toUpperCase()} file · {formatFileSize(selectedFile.size)}</small></div>
              <button type="button" aria-label="Remove selected file" onClick={() => { setSelectedFile(null); setErrors((current) => ({ ...current, file: "" })); if (fileInputRef.current) fileInputRef.current.value = ""; }}><Icon name="trash" size={18} /></button>
            </div>
          )}
          <input ref={fileInputRef} className="visually-hidden" type="file" accept=".pdf,.csv,.xls,.xlsx,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png" onChange={(event) => chooseFile(event.target.files[0])} />
          {errors.file && <small className="field-error file-error">{errors.file}</small>}
        </div>

        {isUploading && <div className="upload-progress" aria-label={`Upload progress ${uploadProgress}%`}><div><span>Checking and saving your note</span><strong>{uploadProgress}%</strong></div><i><b style={{ width: `${uploadProgress}%` }} /></i></div>}
        {errors.submit && <div className="bookmark-feedback error" role="alert">{errors.submit}</div>}
        {successMessage && <div className="upload-success" role="status"><span>✓</span>{successMessage}</div>}
        <div className="upload-form-actions">
          <button type="button" className="cancel-button" onClick={() => { resetForm(); onCancel(); }}>Cancel</button>
          <button type="submit" className="primary-button upload-submit" disabled={isUploading}>{isUploading ? <><span className="loading-spinner" /> Checking...</> : <><Icon name="upload" size={17} /> Upload Note</>}</button>
        </div>
      </form>
      {duplicateMatches.length > 0 && (
        <div className="note-view-overlay" role="presentation" onClick={() => setDuplicateMatches([])}>
          <section className="note-view-dialog duplicate-dialog" role="dialog" aria-modal="true" aria-labelledby="duplicate-dialog-title" onClick={(event) => event.stopPropagation()}>
            <p className="eyebrow">Possible duplicate</p>
            <h2 id="duplicate-dialog-title">A similar note already exists.</h2>
            <p className="duplicate-dialog-copy">Review the matching note before deciding whether to upload another copy.</p>
            <ul className="duplicate-match-list">
              {duplicateMatches.map((match) => (
                <li key={match.id}>
                  <strong>{match.title}</strong>
                  <span>{[match.subject, match.file_name, ...(match.reasons || [])].filter(Boolean).join(" · ")}</span>
                </li>
              ))}
            </ul>
            <div className="duplicate-dialog-actions">
              <button type="button" className="secondary-button" onClick={() => { setDuplicateMatches([]); setPendingFileHash(""); }}>Cancel upload</button>
              <button type="button" className="primary-button" disabled={isUploading} onClick={() => saveNote(pendingFileHash, true)}>
                {isUploading ? "Uploading..." : "Continue anyway"}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

function MyNotesPage({ notes: myNotes }) {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("");
  const [semester, setSemester] = useState("");
  const [year, setYear] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [viewingNote, setViewingNote] = useState(null);

  const filteredNotes = [...myNotes]
    .filter((note) => {
      const searchable = `${note.title} ${note.subject} ${note.keywords}`.toLowerCase();
      return (!query.trim() || searchable.includes(query.trim().toLowerCase()))
        && (!subject || note.subject === subject)
        && (!semester || note.semester === semester)
        && (!year || note.year === year);
    })
    .sort((a, b) => sortOrder === "newest" ? b.uploaded.localeCompare(a.uploaded) : a.uploaded.localeCompare(b.uploaded));

  const downloadNote = (note) => {
    const content = `Note: ${note.title}\nSubject: ${note.subject}\nSemester: ${note.semester}\nAcademic year: ${note.year}\nFile type: ${note.type}\nUploaded: ${note.uploadDate}\nSize: ${note.size}`;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
    link.download = `${note.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <section className="my-notes-page">
      <div className="welcome-row">
        <div><p className="eyebrow">Your study library</p><h1>My Notes</h1><p className="welcome-copy">Keep your uploaded study materials organized and easy to revisit.</p></div>
        <span className="notes-count">{myNotes.length} {myNotes.length === 1 ? "note" : "notes"}</span>
      </div>

      <section className="notes-library-card">
        <div className="notes-library-toolbar">
          <label className="notes-search"><Icon name="search" size={17} /><input aria-label="Search my notes" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by title, subject, or keyword" /></label>
          <div className="notes-filters">
            <select aria-label="Filter by subject" value={subject} onChange={(event) => setSubject(event.target.value)}><option value="">All subjects</option>{[...new Set(myNotes.map((note) => note.subject))].map((item) => <option key={item}>{item}</option>)}</select>
            <select aria-label="Filter by semester" value={semester} onChange={(event) => setSemester(event.target.value)}><option value="">All semesters</option>{[...new Set(myNotes.map((note) => note.semester))].map((item) => <option key={item}>{item}</option>)}</select>
            <select aria-label="Filter by academic year" value={year} onChange={(event) => setYear(event.target.value)}><option value="">All years</option>{[...new Set(myNotes.map((note) => note.year))].map((item) => <option key={item}>{item}</option>)}</select>
            <select aria-label="Sort notes" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select>
          </div>
        </div>

        <div className="notes-library-heading"><div><h2>Uploaded notes</h2><p>{filteredNotes.length} {filteredNotes.length === 1 ? "note" : "notes"} found</p></div></div>
        {filteredNotes.length ? (
          <div className="my-notes-list">
            {filteredNotes.map((note) => (
              <article className="my-note-row" key={note.id}>
                <div className={`my-note-icon ${note.color}`}><Icon name="file" size={21} /><strong>{note.type}</strong></div>
                <div className="my-note-main"><h3>{note.title}</h3><div className="my-note-meta"><span>{note.subject}</span><i /> <span>{note.semester}</span><i /> <span>{note.year}</span></div></div>
                <div className="my-note-details"><span>{note.uploadDate}</span><span>{note.size}</span></div>
                <div className="my-note-actions"><button className="view-note-button" onClick={() => setViewingNote(note)}>View</button><button className="download-note-button" onClick={() => downloadNote(note)}>Download</button></div>
              </article>
            ))}
          </div>
        ) : (
          <div className="notes-empty-state"><span><Icon name="file" size={24} /></span><h3>No notes found</h3><p>Try adjusting your filters or search terms to find what you’re looking for.</p></div>
        )}
      </section>

      {viewingNote && <div className="note-view-overlay" role="presentation" onClick={() => setViewingNote(null)}><section className="note-view-dialog" role="dialog" aria-modal="true" aria-labelledby="note-view-title" onClick={(event) => event.stopPropagation()}><button className="note-dialog-close" aria-label="Close note preview" onClick={() => setViewingNote(null)}><Icon name="close" size={18} /></button><div className={`my-note-icon ${viewingNote.color}`}><Icon name="file" size={23} /><strong>{viewingNote.type}</strong></div><p className="eyebrow">Note preview</p><h2 id="note-view-title">{viewingNote.title}</h2><p className="note-dialog-description">This is a mock preview. Connect the download/view handlers to your backend or storage service when it is available.</p><div className="note-dialog-grid"><span>Subject<strong>{viewingNote.subject}</strong></span><span>Semester<strong>{viewingNote.semester}</strong></span><span>Academic year<strong>{viewingNote.year}</strong></span><span>File size<strong>{viewingNote.size}</strong></span></div><button className="primary-button" onClick={() => downloadNote(viewingNote)}>Download note</button></section></div>}
    </section>
  );
}

function UploadedNotesPage({ notes: uploadedNotes, onDelete }) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ subject: "", semester: "", year: "", type: "" });
  const [sortOrder, setSortOrder] = useState("newest");
  const [preview, setPreview] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const updateFilter = (name, value) => setFilters((current) => ({ ...current, [name]: value }));
  const visibleNotes = [...uploadedNotes].filter((note) => {
    const text = `${note.fileName} ${note.title} ${note.subject}`.toLowerCase();
    return (!query.trim() || text.includes(query.trim().toLowerCase()))
      && (!filters.subject || note.subject === filters.subject)
      && (!filters.semester || note.semester === filters.semester)
      && (!filters.year || note.year === filters.year)
      && (!filters.type || note.type === filters.type);
  }).sort((a, b) => sortOrder === "newest" ? b.uploaded.localeCompare(a.uploaded) : a.uploaded.localeCompare(b.uploaded));

  const download = (note) => {
    const content = `${note.fileName}\n${note.title}\n${note.subject} · ${note.semester} · ${note.year}`;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
    link.download = note.fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <section className="uploaded-notes-page">
      <div className="welcome-row"><div><p className="eyebrow">Workspace library</p><h1>Uploaded Notes</h1><p className="welcome-copy">View and manage all uploaded study materials.</p></div><span className="notes-count">{uploadedNotes.length} documents</span></div>
      <section className="uploaded-library-card">
        <div className="uploaded-toolbar">
          <label className="notes-search"><Icon name="search" size={17} /><input aria-label="Search uploaded documents" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search file name, title, or subject" /></label>
          <div className="uploaded-filters">
            {["subject", "semester", "year", "type"].map((name) => <select key={name} aria-label={`Filter by ${name === "type" ? "file type" : name}`} value={filters[name]} onChange={(event) => updateFilter(name, event.target.value)}><option value="">All {name === "type" ? "file types" : `${name}s`}</option>{[...new Set(uploadedNotes.map((note) => note[name]))].map((item) => <option key={item}>{item}</option>)}</select>)}
            <select aria-label="Sort uploaded documents" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select>
          </div>
        </div>
        <div className="uploaded-heading"><div><h2>All uploaded documents</h2><p>{visibleNotes.length} {visibleNotes.length === 1 ? "document" : "documents"} found</p></div><span className="file-types-note">PDF · CSV · Excel · Word · PowerPoint · Images</span></div>
        {visibleNotes.length ? <div className="uploaded-table"><div className="uploaded-row uploaded-header"><span>Document</span><span>Academic details</span><span>Uploader</span><span>Uploaded</span><span>Actions</span></div>{visibleNotes.map((note) => <article className="uploaded-row" key={note.id}><div className="uploaded-document"><div className={`my-note-icon ${note.color}`}><Icon name="file" size={19} /><strong>{note.type}</strong></div><div><strong>{note.fileName}</strong><span>{note.title}</span></div></div><div className="uploaded-academic"><span>{note.subject}</span><small>{note.semester} · {note.year}</small></div><span className="uploaded-uploader">{note.uploader || "Alex Kumar"}</span><div className="uploaded-date"><span>{note.uploadDate}</span><small>{note.size}</small></div><div className="uploaded-actions"><button className="icon-action view" aria-label={`View ${note.fileName}`} onClick={() => setPreview(note)}><Icon name="eye" size={16} /></button><button className="icon-action download" aria-label={`Download ${note.fileName}`} onClick={() => download(note)}><Icon name="download" size={16} /></button><button className="icon-action delete" aria-label={`Delete ${note.fileName}`} onClick={() => setPendingDelete(note)}><Icon name="trash" size={16} /></button></div></article>)}</div> : <div className="notes-empty-state"><span><Icon name="folder" size={24} /></span><h3>No uploaded documents</h3><p>Try adjusting your filters or upload a new study material to see it here.</p></div>}
      </section>
      {preview && <div className="note-view-overlay" onClick={() => setPreview(null)}><section className="note-view-dialog" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><button className="note-dialog-close" aria-label="Close document preview" onClick={() => setPreview(null)}><Icon name="close" size={18} /></button><div className={`my-note-icon ${preview.color}`}><Icon name="file" size={23} /><strong>{preview.type}</strong></div><p className="eyebrow">Document preview</p><h2>{preview.title}</h2><p className="note-dialog-description">{preview.fileName} is ready to preview. Connect this action to a storage preview URL when the backend is available.</p><div className="note-dialog-grid"><span>Subject<strong>{preview.subject}</strong></span><span>Uploader<strong>{preview.uploader || "Alex Kumar"}</strong></span><span>Academic year<strong>{preview.year}</strong></span><span>File size<strong>{preview.size}</strong></span></div><button className="primary-button" onClick={() => download(preview)}>Download document</button></section></div>}
      {pendingDelete && <div className="note-view-overlay"><section className="delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title"><span className="delete-dialog-icon"><Icon name="trash" size={21} /></span><h2 id="delete-title">Delete this document?</h2><p>This will remove “{pendingDelete.fileName}” from Uploaded Notes.</p><div><button className="cancel-button" onClick={() => setPendingDelete(null)}>Cancel</button><button className="delete-confirm-button" onClick={() => { onDelete(pendingDelete.id); setPendingDelete(null); }}>Delete document</button></div></section></div>}
    </section>
  );
}

const noteStatusLabels = { pending: "Pending", approved: "Approved", rejected: "Rejected" };
const previewableImageTypes = new Set(["JPG", "JPEG", "PNG"]);

function noteFileUrl(note) {
  return note.file_path ? `${API_BASE_URL}${note.file_path}` : "";
}

function downloadNoteFile(note) {
  const link = document.createElement("a");
  link.href = `${API_BASE_URL}/notes/${encodeURIComponent(note.id)}/download`;
  link.download = note.fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function NotePreviewDialog({ note, onClose }) {
  const fileUrl = noteFileUrl(note);
  const isPdf = note.type === "PDF";
  const isImage = previewableImageTypes.has(note.type);

  return (
    <div className="note-view-overlay" onClick={onClose}>
      <section className={`note-view-dialog ${isPdf || isImage ? "note-file-preview-dialog" : ""}`} role="dialog" aria-modal="true" aria-labelledby="note-preview-title" onClick={(event) => event.stopPropagation()}>
        <button className="note-dialog-close" aria-label="Close document preview" onClick={onClose}><Icon name="close" size={18} /></button>
        <p className="eyebrow">Document preview</p>
        <h2 id="note-preview-title">{note.title}</h2>
        <p className="note-dialog-description">{[note.fileName, note.subject, note.department].filter(Boolean).join(" · ")}</p>
        {!fileUrl ? (
          <p className="note-preview-unavailable">This note has no stored file.</p>
        ) : isPdf ? (
          <iframe className="note-file-frame" src={fileUrl} title={`Preview of ${note.fileName}`} />
        ) : isImage ? (
          <img className="note-file-image" src={fileUrl} alt={`Preview of ${note.fileName}`} />
        ) : (
          <p className="note-preview-unavailable">{note.type} files can't be previewed in the browser. Download the file to open it.</p>
        )}
        <div className="note-preview-actions">
          {fileUrl && (isPdf || isImage) && <a className="secondary-button" href={fileUrl} target="_blank" rel="noreferrer">Open in new tab</a>}
          {fileUrl && <button className="primary-button" onClick={() => downloadNoteFile(note)}>Download document</button>}
        </div>
      </section>
    </div>
  );
}

const statusFilters = [
  { value: "all", label: "All notes" },
  { value: "pending", label: "Pending review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

function AdminUploadedNotesPage({ notes: uploadedNotes, user, onStatusChange, onOpenNote }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [department, setDepartment] = useState("");
  const [preview, setPreview] = useState(null);
  const [updatingIds, setUpdatingIds] = useState(() => new Set());
  const [statusMessage, setStatusMessage] = useState(null);
  const isAdmin = user?.role === "admin";

  const statusOf = (note) => (noteStatusLabels[note.status] ? note.status : "pending");
  const counts = uploadedNotes.reduce((totals, note) => {
    totals[statusOf(note)] += 1;
    return totals;
  }, { all: uploadedNotes.length, pending: 0, approved: 0, rejected: 0 });
  const departments = [...new Set(uploadedNotes.map((note) => note.department).filter(Boolean))].sort();
  const normalizedQuery = query.trim().toLowerCase();
  const visibleNotes = uploadedNotes.filter((note) => (statusFilter === "all" || statusOf(note) === statusFilter)
    && (!department || note.department === department)
    && [note.title, note.fileName, note.subject, note.department, note.uploader_name].filter(Boolean).join(" ").toLowerCase().includes(normalizedQuery));

  const updateStatus = async (note, status) => {
    setUpdatingIds((current) => new Set(current).add(note.id));
    setStatusMessage(null);
    try {
      const response = await apiFetch(`${API_BASE_URL}/notes/${encodeURIComponent(note.id)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await readApiJson(response);
      if (!response.ok) throw new Error(data.message || "Could not update the note status.");
      onStatusChange(note.id, data.note.status);
      setStatusMessage({ type: "success", text: `“${note.title}” ${data.note.status}.` });
    } catch (error) {
      setStatusMessage({ type: "error", text: error.message });
    } finally {
      setUpdatingIds((current) => {
        const next = new Set(current);
        next.delete(note.id);
        return next;
      });
    }
  };

  const summaryCards = [
    { value: "all", label: "Total notes", icon: "folder", tone: "indigo", hint: "All uploaded files" },
    { value: "pending", label: "Pending review", icon: "bell", tone: "amber", hint: isAdmin ? "Waiting for your approval" : "Waiting for an admin" },
    { value: "approved", label: "Approved", icon: "check", tone: "green", hint: "Visible to students" },
    { value: "rejected", label: "Rejected", icon: "close", tone: "red", hint: "Not approved" },
  ];

  return (
    <section className="un-page">
      <header className="un-header">
        <div>
          <p className="un-eyebrow">{isAdmin ? "Admin workspace" : "Notes library"}</p>
          <h1>Uploaded Notes</h1>
          <p className="un-subtitle">Review uploaded study material, approve notes, and open any note for full details.</p>
        </div>
      </header>

      <div className="un-summary">
        {summaryCards.map((card) => (
          <button key={card.value} type="button" className={`un-summary-card ${statusFilter === card.value ? "active" : ""}`} onClick={() => setStatusFilter(card.value)} aria-pressed={statusFilter === card.value}>
            <span className={`un-summary-icon ${card.tone}`}><Icon name={card.icon} size={18} /></span>
            <span className="un-summary-text"><span>{card.label}</span><strong>{counts[card.value]}</strong><small>{card.hint}</small></span>
          </button>
        ))}
      </div>

      <section className="un-card">
        <div className="un-toolbar">
          <div className="un-tabs" role="tablist" aria-label="Filter by status">
            {statusFilters.map((filter) => (
              <button key={filter.value} type="button" role="tab" aria-selected={statusFilter === filter.value} className={statusFilter === filter.value ? "active" : ""} onClick={() => setStatusFilter(filter.value)}>
                {filter.label}<span>{counts[filter.value]}</span>
              </button>
            ))}
          </div>
          <div className="un-filters">
            <label className="un-search"><Icon name="search" size={16} /><input aria-label="Search uploaded notes" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, file, subject, uploader…" /></label>
            <select className="un-select" aria-label="Filter by department" value={department} onChange={(event) => setDepartment(event.target.value)}>
              <option value="">All departments</option>
              {departments.map((name) => <option key={name}>{name}</option>)}
            </select>
          </div>
        </div>

        {statusMessage && <p className={`un-message ${statusMessage.type}`} role="status">{statusMessage.text}</p>}

        <div className="un-table-wrap">
          <table className="un-table">
            <thead>
              <tr><th>Date</th><th>Note title</th><th>Subject</th><th>Department</th><th>Uploaded by</th><th>Status</th><th className="un-actions-head">Actions</th></tr>
            </thead>
            <tbody>
              {visibleNotes.map((note) => {
                const status = statusOf(note);
                const isUpdating = updatingIds.has(note.id);
                const uploader = note.uploader_name || (String(note.uploaded_by) === String(user?.id) ? user?.name : "") || "Unknown";
                return (
                  <tr
                    key={note.id}
                    className={onOpenNote ? "un-row-clickable" : ""}
                    {...(onOpenNote ? {
                      tabIndex: 0,
                      title: "Open note details",
                      onClick: () => onOpenNote(note),
                      onKeyDown: (event) => {
                        if (event.target !== event.currentTarget || !["Enter", " "].includes(event.key)) return;
                        event.preventDefault();
                        onOpenNote(note);
                      },
                    } : {})}
                  >
                    <td className="un-date">{formatUploadDate(note.uploadedAt || note.uploaded)}</td>
                    <td>
                      <div className="un-note-cell">
                        <div className="un-note-text"><strong>{note.title}</strong><small title={note.fileName}>{note.fileName}</small></div>
                      </div>
                    </td>
                    <td className="un-subject">{note.subject || "—"}</td>
                    <td><div className="un-stack"><strong>{note.department || "—"}</strong><small>{[note.semester, note.year].filter(Boolean).join(" · ")}</small></div></td>
                    <td><div className="un-uploader"><span className="avatar small">{initialsFor(uploader)}</span><span>{uploader}</span></div></td>
                    <td><span className={`un-status ${status}`}><i />{noteStatusLabels[status]}</span></td>
                    <td onClick={(event) => event.stopPropagation()}>
                      <div className="un-actions">
                        {isAdmin && status !== "approved" && <button className="un-icon-button approve" type="button" title="Approve note" aria-label={`Approve ${note.title}`} disabled={isUpdating} onClick={() => updateStatus(note, "approved")}><Icon name="check" size={16} /></button>}
                        {isAdmin && status !== "rejected" && <button className="un-icon-button reject" type="button" title="Reject note" aria-label={`Reject ${note.title}`} disabled={isUpdating} onClick={() => updateStatus(note, "rejected")}><Icon name="close" size={15} /></button>}
                        {isAdmin && <span className="un-divider" aria-hidden="true" />}
                        <button className="un-icon-button" type="button" title="Preview" aria-label={`Preview ${note.fileName}`} onClick={() => setPreview(note)}><Icon name="eye" size={15} /></button>
                        <button className="un-icon-button" type="button" title="Download" aria-label={`Download ${note.fileName}`} onClick={() => downloadNoteFile(note)}><Icon name="download" size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!visibleNotes.length && (
            <div className="un-empty">
              <span><Icon name="folder" size={24} /></span>
              <h3>{uploadedNotes.length ? "No notes match these filters" : "No notes uploaded yet"}</h3>
              <p>{uploadedNotes.length ? "Try another status, department, or search term." : "Uploaded notes will appear here for review."}</p>
            </div>
          )}
        </div>
        <footer className="un-footer">Showing {visibleNotes.length} of {uploadedNotes.length} notes{onOpenNote ? " · Click a row to open full details" : ""}</footer>
      </section>

      {preview && <NotePreviewDialog note={preview} onClose={() => setPreview(null)} />}
    </section>
  );
}

const memberAvatarColors = ["purple", "blue", "orange", "green"];

function initialsFor(name) {
  return String(name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("");
}

function InviteUserDialog({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", email: "", role: "student", password: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await apiFetch(`${API_BASE_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await readApiJson(response);
      if (!response.ok) throw new Error(data.message || "Could not create the user.");
      onCreated(data.user, form.password);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="note-view-overlay" onClick={onClose}>
      <section className="note-view-dialog workspace-form-dialog" role="dialog" aria-modal="true" aria-labelledby="invite-user-title" onClick={(event) => event.stopPropagation()}>
        <button className="note-dialog-close" aria-label="Close invite user" onClick={onClose}><Icon name="close" size={18} /></button>
        <p className="eyebrow">User management</p>
        <h2 id="invite-user-title">Invite user</h2>
        <p className="note-dialog-description">Create an account and share the temporary password with the user. They can change it in Settings.</p>
        <form className="workspace-form" onSubmit={submit}>
          <label>Full name<input name="name" value={form.name} onChange={update} maxLength={100} required autoFocus /></label>
          <label>Email<input name="email" type="email" value={form.email} onChange={update} maxLength={254} required /></label>
          <label>Role
            <select name="role" value={form.role} onChange={update}>
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label>Temporary password<input name="password" type="text" value={form.password} onChange={update} minLength={8} maxLength={1024} required placeholder="At least 8 characters" /></label>
          {error && <p className="workspace-message error" role="alert">{error}</p>}
          <div className="workspace-form-actions">
            <button className="cancel-button" type="button" onClick={onClose}>Cancel</button>
            <button className="primary-button" type="submit" disabled={saving}>{saving ? "Creating…" : "Create user"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function UserManagementPage({ user }) {
  const isAdmin = user?.role === "admin";
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(isAdmin);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(null);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [inviting, setInviting] = useState(false);
  const [pendingRemove, setPendingRemove] = useState(null);
  const [busyIds, setBusyIds] = useState(() => new Set());

  useEffect(() => {
    if (!isAdmin) return;
    let isCurrent = true;
    apiFetch(`${API_BASE_URL}/users`)
      .then(async (response) => {
        const data = await readApiJson(response);
        if (!response.ok) throw new Error(data.message || "Could not load users.");
        if (isCurrent) setUsers(data);
      })
      .catch((requestError) => { if (isCurrent) setError(requestError.message); })
      .finally(() => { if (isCurrent) setLoading(false); });
    return () => { isCurrent = false; };
  }, [isAdmin]);

  const setBusy = (id, busy) => setBusyIds((current) => {
    const next = new Set(current);
    if (busy) next.add(id); else next.delete(id);
    return next;
  });

  const changeRole = async (member, role) => {
    setBusy(member.id, true);
    setMessage(null);
    try {
      const response = await apiFetch(`${API_BASE_URL}/users/${member.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await readApiJson(response);
      if (!response.ok) throw new Error(data.message || "Could not update the role.");
      setUsers((current) => current.map((item) => item.id === member.id ? { ...item, role: data.user.role } : item));
      setMessage({ type: "success", text: `${member.name} is now ${data.user.role === "admin" ? "an admin" : "a student"}.` });
    } catch (requestError) {
      setMessage({ type: "error", text: requestError.message });
    } finally {
      setBusy(member.id, false);
    }
  };

  const removeUser = async (member) => {
    setPendingRemove(null);
    setBusy(member.id, true);
    setMessage(null);
    try {
      const response = await apiFetch(`${API_BASE_URL}/users/${member.id}`, { method: "DELETE" });
      const data = await readApiJson(response);
      if (!response.ok) throw new Error(data.message || "Could not remove the user.");
      setUsers((current) => current.filter((item) => item.id !== member.id));
      setMessage({ type: "success", text: `${member.name} was removed.` });
    } catch (requestError) {
      setMessage({ type: "error", text: requestError.message });
    } finally {
      setBusy(member.id, false);
    }
  };

  if (!isAdmin) {
    return (
      <section className="user-management-page">
        <div className="welcome-row"><div><p className="eyebrow">Workspace administration</p><h1>User management</h1><p className="welcome-copy">Manage members, roles, and access to your notes community.</p></div></div>
        <div className="notes-empty-state"><span><Icon name="userManagement" size={24} /></span><h3>Administrators only</h3><p>Sign in with an admin account to invite users and manage roles.</p></div>
      </section>
    );
  }

  const normalizedQuery = query.trim().toLowerCase();
  const visibleUsers = users.filter((member) => (roleFilter === "all" || member.role === roleFilter)
    && `${member.name} ${member.email}`.toLowerCase().includes(normalizedQuery));
  const adminCount = users.filter((member) => member.role === "admin").length;
  const totalNotes = users.reduce((total, member) => total + Number(member.notes_uploaded || 0), 0);

  return (
    <section className="user-management-page">
      <div className="welcome-row">
        <div><p className="eyebrow">Workspace administration</p><h1>User management</h1><p className="welcome-copy">Manage members, roles, and access to your notes community.</p></div>
        <button className="primary-button" type="button" onClick={() => setInviting(true)}><Icon name="plus" size={18} /> Invite user</button>
      </div>

      <section className="user-summary-grid" aria-label="User summary">
        <article className="user-summary-card"><span>Total members</span><strong>{loading ? "…" : users.length}</strong><small>Registered accounts</small></article>
        <article className="user-summary-card"><span>Students</span><strong>{loading ? "…" : users.length - adminCount}</strong><small>{adminCount} {adminCount === 1 ? "admin" : "admins"}</small></article>
        <article className="user-summary-card"><span>Notes uploaded</span><strong>{loading ? "…" : totalNotes}</strong><small>Across all members</small></article>
      </section>

      <section className="members-panel">
        <div className="section-heading">
          <div><h2>All members</h2><p>View and manage platform access</p></div>
          <div className="member-tools">
            <label className="member-search"><Icon name="search" size={17} /><input placeholder="Search members" aria-label="Search members" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
            <select className="filter-button" aria-label="Filter by role" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              <option value="all">All roles</option>
              <option value="student">Students</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>
        {message && <p className={`workspace-message ${message.type}`} role="status">{message.text}</p>}
        {error && <p className="workspace-message error" role="alert">{error}</p>}
        <div className="members-table">
          <div className="member-row member-header"><span>Member</span><span>Role</span><span>Notes uploaded</span><span>Joined</span><span /></div>
          {loading ? <div className="notes-empty-state"><h3>Loading members...</h3></div> : visibleUsers.length ? visibleUsers.map((member, index) => {
            const isSelf = String(member.id) === String(user.id);
            return (
              <div className="member-row" key={member.id}>
                <div className="member-identity"><div className={`avatar member-avatar ${memberAvatarColors[index % memberAvatarColors.length]}`}>{initialsFor(member.name)}</div><div><strong>{member.name}{isSelf ? " (you)" : ""}</strong><span>{member.email}</span></div></div>
                <span>
                  <select className="member-role-select" aria-label={`Role for ${member.name}`} value={member.role} disabled={isSelf || busyIds.has(member.id)} onChange={(event) => changeRole(member, event.target.value)}>
                    <option value="student">Student</option>
                    <option value="admin">Admin</option>
                  </select>
                </span>
                <span>{member.notes_uploaded}</span>
                <span>{formatUploadDate(member.created_at)}</span>
                <span>{!isSelf && <button className="member-remove-button" type="button" title="Remove user" aria-label={`Remove ${member.name}`} disabled={busyIds.has(member.id)} onClick={() => setPendingRemove(member)}><Icon name="trash" size={15} /></button>}</span>
              </div>
            );
          }) : <div className="notes-empty-state"><h3>No members found</h3><p>Try a different search or role filter.</p></div>}
        </div>
        <div className="members-footer"><span>Showing {visibleUsers.length} of {users.length} members</span></div>
      </section>

      {inviting && <InviteUserDialog onClose={() => setInviting(false)} onCreated={(newUser) => {
        setUsers((current) => [newUser, ...current]);
        setInviting(false);
        setMessage({ type: "success", text: `${newUser.name} was added. Share their email and temporary password with them.` });
      }} />}
      {pendingRemove && <div className="note-view-overlay"><section className="delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="remove-user-title"><span className="delete-dialog-icon"><Icon name="trash" size={21} /></span><h2 id="remove-user-title">Remove {pendingRemove.name}?</h2><p>Their account, reviews, and bookmarks will be deleted. Notes they uploaded stay available.</p><div><button className="cancel-button" onClick={() => setPendingRemove(null)}>Cancel</button><button className="delete-confirm-button" onClick={() => removeUser(pendingRemove)}>Remove user</button></div></section></div>}
    </section>
  );
}

function ExploreNotesPage({ notes, loading, error, onOpenNote, onAi }) {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("");
  const departments = [...new Set(notes.map((note) => note.department).filter(Boolean))].sort();
  const normalizedQuery = query.trim().toLowerCase();
  const visibleNotes = notes.filter((note) => (!department || note.department === department)
    && [note.title, note.subject, note.department, note.tags, note.description].filter(Boolean).join(" ").toLowerCase().includes(normalizedQuery));

  return (
    <section className="explore-notes-page">
      <div className="welcome-row"><div><p className="eyebrow">Community library</p><h1>Explore notes</h1><p className="welcome-copy">Find study material shared by students across departments.</p></div><span className="notes-count">{visibleNotes.length} {visibleNotes.length === 1 ? "note" : "notes"}</span></div>
      <div className="explore-tools">
        <label className="notes-search"><Icon name="search" size={17} /><input aria-label="Search notes" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by title, subject, tag…" /></label>
        <select className="filter-button" aria-label="Filter by department" value={department} onChange={(event) => setDepartment(event.target.value)}>
          <option value="">All departments</option>
          {departments.map((name) => <option key={name}>{name}</option>)}
        </select>
      </div>
      {loading ? <div className="notes-empty-state"><h3>Loading notes...</h3></div> : error ? <div className="notes-empty-state"><h3>Notes could not be loaded</h3><p>{error}</p></div> : visibleNotes.length ? (
        <div className="explore-grid">
          {visibleNotes.map((note) => (
            <article className="explore-card" key={note.id}>
              <span className="note-subject">{note.subject || note.department}</span>
              <h3>{note.title}</h3>
              <p>{[note.department, note.semester, note.year].filter(Boolean).join(" · ")}</p>
              <p className="explore-card-rating">★ {Number(note.average_rating || 0).toFixed(1)} · {Number(note.total_reviews || 0)} {Number(note.total_reviews) === 1 ? "review" : "reviews"} · {note.type}</p>
              <div className="note-card-actions">
                <button className="note-open-button" type="button" onClick={() => onOpenNote(note)}>View note</button>
                <button className="note-open-button" type="button" onClick={() => onAi(note, "summary")}>AI Summary</button>
                <button className="note-open-button" type="button" onClick={() => onAi(note, "questions")}>AI Questions</button>
              </div>
            </article>
          ))}
        </div>
      ) : <div className="notes-empty-state"><span><Icon name="search" size={24} /></span><h3>No matching notes</h3><p>Try a different search or department.</p></div>}
    </section>
  );
}

function SettingsPage({ user, onLogout }) {
  const [form, setForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setMessage(null);
    if (form.new_password !== form.confirm_password) {
      setMessage({ type: "error", text: "The new passwords do not match." });
      return;
    }
    setSaving(true);
    try {
      const response = await apiFetch(`${API_BASE_URL}/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: form.current_password, new_password: form.new_password }),
      });
      const data = await readApiJson(response);
      if (!response.ok) throw new Error(data.message || "Could not change your password.");
      setForm({ current_password: "", new_password: "", confirm_password: "" });
      setMessage({ type: "success", text: data.message });
    } catch (requestError) {
      setMessage({ type: "error", text: requestError.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="settings-page">
      <div className="welcome-row"><div><p className="eyebrow">Your account</p><h1>Settings</h1><p className="welcome-copy">View your profile and change your password.</p></div></div>
      <div className="settings-layout">
        <article className="settings-panel settings-profile">
          <div className="settings-avatar">{initialsFor(user?.name)}</div>
          <div className="settings-profile-text">
            <h2>{user?.name || "Your account"}</h2>
            <p>{user?.email}</p>
          </div>
          <span className={`settings-role ${user?.role === "admin" ? "admin" : ""}`}>{user?.role === "admin" ? "Administrator" : "Student"}</span>
          <dl className="settings-profile-meta">
            <div><dt>Member since</dt><dd>{formatUploadDate(user?.created_at)}</dd></div>
            <div><dt>Account type</dt><dd>{user?.role === "admin" ? "Can approve notes and manage users" : "Can upload, review, and save notes"}</dd></div>
          </dl>
        </article>

        <article className="settings-panel settings-section">
          <div className="settings-section-intro">
            <h2>Password</h2>
            <p>Use at least 8 characters. Choose a password you don’t use on other sites.</p>
          </div>
          <form className="workspace-form settings-form" onSubmit={submit}>
            <label>Current password<input name="current_password" type="password" autoComplete="current-password" value={form.current_password} onChange={update} required /></label>
            <div className="settings-form-row">
              <label>New password<input name="new_password" type="password" autoComplete="new-password" value={form.new_password} onChange={update} minLength={8} required /></label>
              <label>Confirm new password<input name="confirm_password" type="password" autoComplete="new-password" value={form.confirm_password} onChange={update} minLength={8} required /></label>
            </div>
            {message && <p className={`workspace-message ${message.type}`} role="status">{message.text}</p>}
            <div className="workspace-form-actions"><button className="primary-button" type="submit" disabled={saving}>{saving ? "Updating…" : "Update password"}</button></div>
          </form>
        </article>

        <article className="settings-panel settings-section">
          <div className="settings-section-intro">
            <h2>Appearance</h2>
            <p>Choose a theme color. It applies to the login page and every module on this device.</p>
          </div>
          <ThemeSwatches />
        </article>

        <article className="settings-panel settings-section">
          <div className="settings-section-intro">
            <h2>Session</h2>
            <p>Sign out of Notes Sharing on this device. You’ll need your email and password to sign in again.</p>
          </div>
          <div className="settings-session-action">
            <button className="settings-signout-button" type="button" onClick={onLogout}><Icon name="close" size={16} />Sign out</button>
          </div>
        </article>
      </div>
    </section>
  );
}

function StudyGroupsPage({ onExplore }) {
  return (
    <section className="study-groups-page">
      <div className="welcome-row"><div><p className="eyebrow">Collaborate</p><h1>Study groups</h1><p className="welcome-copy">Learn together with classmates in your department.</p></div></div>
      <div className="notes-empty-state">
        <span><Icon name="users" size={24} /></span>
        <h3>Study groups are coming soon</h3>
        <p>Group creation isn’t available yet. Meanwhile, share notes with classmates using the Share note option on any note.</p>
        <button className="secondary-button" type="button" onClick={onExplore}>Explore notes</button>
      </div>
    </section>
  );
}

function App() {
  const [activePage, setActivePage] = useState(window.location.pathname === "/admin/uploaded-notes" ? "Uploaded Notes" : "Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [myNotes, setMyNotes] = useState(initialMyNotes);
  const [uploadedNotes, setUploadedNotes] = useState([]);

  useEffect(() => {
    const handlePopState = () => setActivePage(window.location.pathname === "/admin/uploaded-notes" ? "Uploaded Notes" : "Dashboard");
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (page) => {
    const path = page === "Uploaded Notes" ? "/admin/uploaded-notes" : "/";
    window.history.pushState({}, "", path);
    setActivePage(page);
  };

  return (
    <div className="dashboard-shell">
      <aside className={`dashboard-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="dashboard-brand">
          <div className="brand-mark">N</div>
          <div><strong>Notes Sharing</strong><span>Student workspace</span></div>
        </div>

        <div className="sidebar-heading">Workspace</div>
        <nav aria-label="Main navigation">
          {navigation.map((item) => (
            <button
              className={`sidebar-link ${activePage === item.label ? "active" : ""}`}
              key={item.label}
              onClick={() => { navigate(item.label); setSidebarOpen(false); }}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button className="sidebar-link" onClick={() => setActivePage("Settings")}><Icon name="settings" /><span>Settings</span></button>
          <div className="sidebar-tip">
            <span className="tip-icon">✦</span>
            <strong>Keep learning</strong>
            <p>Small progress every day adds up.</p>
          </div>
          <div className="profile-card">
            <div className="avatar">AK</div>
            <div><strong>Alex Kumar</strong><span>Computer Science</span></div>
            <button aria-label="Profile options">•••</button>
          </div>
        </div>
      </aside>

      {sidebarOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}

      <main className="dashboard-main">
        <header className="dashboard-header">
          <button className="mobile-menu" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><Icon name="menu" /></button>
          <div className="header-search">
            <Icon name="search" size={19} />
            <input aria-label="Search notes" placeholder="Search notes, subjects, or classmates..." />
            <kbd>⌘ K</kbd>
          </div>
          <div className="header-actions">
            <button className="icon-button notification-button" aria-label="Notifications"><Icon name="bell" size={20} /><span /></button>
            <div className="header-divider" />
            <div className="header-user"><div className="avatar small">AK</div><span>Alex Kumar</span><span className="chevron">⌄</span></div>
          </div>
        </header>

        <div className="dashboard-content">
          {activePage === "Uploaded Notes" ? (
            <AdminUploadedNotesPage notes={uploadedNotes} />
          ) : activePage === "My Notes" ? (
            <MyNotesPage notes={myNotes} />
          ) : activePage === "Upload Note" ? (
            <UploadNotePage onCancel={() => navigate("Dashboard")} onUploaded={(newNote) => { setMyNotes((current) => [newNote, ...current]); }} />
          ) : activePage === "User Management" ? (
            <section className="user-management-page">
              <div className="welcome-row">
                <div><p className="eyebrow">Workspace administration</p><h1>User management</h1><p className="welcome-copy">Manage members, roles, and access to your notes community.</p></div>
                <button className="primary-button"><Icon name="plus" size={18} /> Invite user</button>
              </div>

              <section className="user-summary-grid" aria-label="User summary">
                <article className="user-summary-card"><span>Total members</span><strong>248</strong><small>Across 12 study groups</small></article>
                <article className="user-summary-card"><span>Active this month</span><strong>216</strong><small className="positive">↑ 14% from last month</small></article>
                <article className="user-summary-card"><span>Pending invites</span><strong>08</strong><small>Requires your review</small></article>
              </section>

              <section className="members-panel">
                <div className="section-heading"><div><h2>All members</h2><p>View and manage platform access</p></div><div className="member-tools"><label className="member-search"><Icon name="search" size={17} /><input placeholder="Search members" aria-label="Search members" /></label><button className="filter-button">All roles⌄</button></div></div>
                <div className="members-table">
                  <div className="member-row member-header"><span>Member</span><span>Role</span><span>Status</span><span>Last active</span><span /></div>
                  {members.map((member, index) => <div className="member-row" key={member.email}><div className="member-identity"><div className={`avatar member-avatar ${member.color}`}>{member.initials}</div><div><strong>{member.name}</strong><span>{member.email}</span></div></div><span className="member-role">{member.role}</span><span className={`member-status ${member.status.toLowerCase()}`}><i />{member.status}</span><span className="last-active">{index === 0 ? "Just now" : index === 1 ? "2 hours ago" : index === 2 ? "Yesterday" : "3 days ago"}</span><button className="more-button" aria-label={`More options for ${member.name}`}>•••</button></div>)}
                </div>
                <div className="members-footer"><span>Showing 4 of 248 members</span><div><button className="pagination-button" disabled>‹</button><button className="pagination-button active">1</button><button className="pagination-button">2</button><button className="pagination-button">3</button><button className="pagination-button">›</button></div></div>
              </section>
            </section>
          ) : (
            <>
          <section className="welcome-row">
            <div><p className="eyebrow">Monday, September 21, 2026</p><h1>Good morning, Alex <span>✦</span></h1><p className="welcome-copy">Ready to make some progress today?</p></div>
            <button className="primary-button"><Icon name="plus" size={18} /> Share a note</button>
          </section>

          <section className="stats-grid" aria-label="Learning summary">
            <article className="stat-card"><div className="stat-icon blue"><Icon name="file" /></div><div><span>Notes shared</span><strong>24</strong><small><b>↑ 12%</b> this month</small></div></article>
            <article className="stat-card"><div className="stat-icon purple"><Icon name="bookmark" /></div><div><span>Saved notes</span><strong>—</strong><small>Sign in to view your library</small></div></article>
            <article className="stat-card"><div className="stat-icon orange"><Icon name="users" /></div><div><span>Study groups</span><strong>6</strong><small><b>↑ 2</b> this month</small></div></article>
          </section>

          <section className="dashboard-grid">
            <div className="notes-section">
              <div className="section-heading"><div><h2>Your recent notes</h2><p>Pick up where you left off</p></div><button className="text-button">View all <Icon name="arrow" size={16} /></button></div>
              <div className="notes-list">
                {notes.map((note) => <article className="note-card" key={note.title}><div className={`note-thumbnail ${note.color}`}><span>{note.initials}</span><div className="thumbnail-lines"><i /><i /><i /></div></div><div className="note-info"><span className="note-subject">{note.subject}</span><h3>{note.title}</h3><p>{note.meta}</p></div><button className="more-button" aria-label={`More options for ${note.title}`}>•••</button></article>)}
              </div>
            </div>

            <aside className="activity-card"><div className="section-heading"><div><h2>Study streak</h2><p>Your learning rhythm</p></div><span className="streak-badge">🔥 12 days</span></div><div className="streak-chart"><div className="chart-labels"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div><div className="chart-bars"><i style={{ height: "48%" }} /><i style={{ height: "72%" }} /><i style={{ height: "61%" }} /><i style={{ height: "86%" }} /><i style={{ height: "66%" }} /><i style={{ height: "92%" }} /><i className="today" style={{ height: "78%" }} /></div></div><div className="activity-footer"><span><b /> Learning activity</span><strong>+24% <small>vs last week</small></strong></div></aside>
          </section>

          <section className="discover-card"><div><span className="discover-label">COMMUNITY PICK</span><h2>Discover notes from your community</h2><p>Find helpful study material shared by students in your course.</p></div><button className="secondary-button">Explore notes <Icon name="arrow" size={17} /></button><div className="discover-shape shape-one" /><div className="discover-shape shape-two" /></section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function ProtectedApp() {
  const { isAuthenticated, validateToken, sessionExpired, isInitialized } = useAuth();

  // Validate token on mount and when component updates
  useEffect(() => {
    if (isAuthenticated && isInitialized) {
      const isValid = validateToken();
      if (!isValid) {
        window.location.href = '/';
      }
    }
  }, [isAuthenticated, validateToken, isInitialized]);

  if (!isInitialized) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid #e5e7eb', borderTopColor: 'var(--accent-500)', borderRadius: '50%', animation: 'spin 0.6s linear infinite', marginBottom: '16px' }} />
          <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Loading...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated || sessionExpired) {
    return <Login onLoginSuccess={() => window.location.reload()} />;
  }

  return <AppDashboard />;
}

function NoteReviewsDialog({ note, user, onClose, onSummaryChange }) {
  const [reviewData, setReviewData] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let isCurrent = true;

    apiFetch(`${API_BASE_URL}/reviews/${encodeURIComponent(note.id)}?user_id=${encodeURIComponent(user.id)}`)
      .then(async (response) => {
        const data = await readApiJson(response);
        if (!response.ok) throw new Error(data.message || "Could not load note reviews.");
        if (!Array.isArray(data.reviews)) throw new Error("The reviews response was not valid.");
        if (!isCurrent) return;
        setReviewData(data);
        setRating(Number(data.ownReview?.rating) || 0);
        setComment(data.ownReview?.comment || "");
        onSummaryChange(note.id, data.averageRating, data.totalReviews);
      })
      .catch((error) => {
        if (isCurrent) setMessage({ type: "error", text: error.message || "Could not load note reviews." });
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => { isCurrent = false; };
  }, [note.id, user.id, onSummaryChange]);

  const refreshReviews = async () => {
    const response = await apiFetch(`${API_BASE_URL}/reviews/${encodeURIComponent(note.id)}?user_id=${encodeURIComponent(user.id)}`);
    const data = await readApiJson(response);
    if (!response.ok) throw new Error(data.message || "Could not refresh note reviews.");
    setReviewData(data);
    setRating(Number(data.ownReview?.rating) || 0);
    setComment(data.ownReview?.comment || "");
    onSummaryChange(note.id, data.averageRating, data.totalReviews);
  };

  const submitReview = async (event) => {
    event.preventDefault();
    setMessage(null);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setMessage({ type: "error", text: "Choose a rating from 1 to 5 stars." });
      return;
    }
    if (!comment.trim() || comment.trim().length > 2000) {
      setMessage({ type: "error", text: "Add a comment of up to 2,000 characters." });
      return;
    }

    setSaving(true);
    try {
      const ownReview = reviewData?.ownReview;
      const response = await apiFetch(
        ownReview
          ? `${API_BASE_URL}/reviews/${encodeURIComponent(ownReview.id)}`
          : `${API_BASE_URL}/reviews`,
        {
          method: ownReview ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id, note_id: note.id, rating, comment: comment.trim() }),
        }
      );
      const data = await readApiJson(response);
      if (!response.ok) throw new Error(data.message || "Could not save your review.");

      setMessage({ type: "success", text: data.message || "Review saved successfully." });
      await refreshReviews();
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Could not save your review." });
    } finally {
      setSaving(false);
    }
  };

  const deleteReview = async () => {
    const ownReview = reviewData?.ownReview;
    if (!ownReview) return;

    setDeleting(true);
    setMessage(null);
    try {
      const response = await apiFetch(
        `${API_BASE_URL}/reviews/${encodeURIComponent(ownReview.id)}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id, note_id: note.id }),
        }
      );
      const data = await readApiJson(response);
      if (!response.ok) throw new Error(data.message || "Could not delete your review.");

      setMessage({ type: "success", text: data.message || "Review deleted successfully." });
      await refreshReviews();
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Could not delete your review." });
    } finally {
      setDeleting(false);
    }
  };

  const reviews = reviewData?.reviews || [];

  return (
    <div className="note-view-overlay" role="presentation" onClick={onClose}>
      <section className="note-view-dialog reviews-dialog" role="dialog" aria-modal="true" aria-labelledby="reviews-dialog-title" onClick={(event) => event.stopPropagation()}>
        <button className="note-dialog-close" aria-label="Close reviews" onClick={onClose}><Icon name="close" size={18} /></button>
        <p className="eyebrow">Student feedback</p>
        <h2 id="reviews-dialog-title">{note.title}</h2>

        {message && <div className={`review-feedback ${message.type}`} role={message.type === "error" ? "alert" : "status"}>{message.text}</div>}
        {loading ? <p className="review-loading">Loading ratings and comments...</p> : reviewData ? (
          <>
            <div className="review-summary">
              <strong>{Number(reviewData.averageRating || 0).toFixed(1)}</strong>
              <span className="review-summary-stars" aria-label={`${reviewData.averageRating} out of 5 stars`}>{"★".repeat(Math.round(Number(reviewData.averageRating) || 0))}{"☆".repeat(5 - Math.round(Number(reviewData.averageRating) || 0))}</span>
              <span>{reviewData.totalReviews} {reviewData.totalReviews === 1 ? "review" : "reviews"}</span>
            </div>

            <form className="review-form" onSubmit={submitReview}>
              <h3>{reviewData?.ownReview ? "Update your review" : "Write a review"}</h3>
              <div className="rating-picker" role="radiogroup" aria-label="Your rating">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`rating-star ${value <= rating ? "selected" : ""}`}
                    role="radio"
                    aria-checked={rating === value}
                    aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
                    onClick={() => setRating(value)}
                  >★</button>
                ))}
              </div>
              <label htmlFor="review-comment">Comment</label>
              <textarea id="review-comment" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={2000} rows={4} placeholder="Share helpful feedback about this note..." />
              <div className="review-form-footer">
                <span>{comment.length}/2000</span>
                <div>
                  {reviewData?.ownReview && <button type="button" className="review-delete-button" onClick={deleteReview} disabled={deleting || saving}>{deleting ? "Deleting..." : "Delete review"}</button>}
                  <button type="submit" className="primary-button" disabled={saving || deleting || rating < 1}>{saving ? "Saving..." : reviewData?.ownReview ? "Update review" : "Submit review"}</button>
                </div>
              </div>
            </form>

            <section className="review-list" aria-label="Comments and ratings">
              <h3>Comments ({reviews.length})</h3>
              {reviews.length ? reviews.map((review) => (
                <article className="review-item" key={review.id}>
                  <div className="review-item-heading">
                    <strong>{String(review.user_id) === String(user.id) ? "You" : review.reviewer_email || "Student"}</strong>
                    <span className="review-item-stars" aria-label={`${review.rating} out of 5 stars`}>{"★".repeat(Number(review.rating))}{"☆".repeat(5 - Number(review.rating))}</span>
                    <time>{review.created_at ? new Date(review.created_at).toLocaleDateString() : ""}</time>
                  </div>
                  <p>{review.comment}</p>
                </article>
              )) : <p className="review-empty">No reviews yet. Be the first to share feedback.</p>}
            </section>
          </>
        ) : <p className="review-loading">Reviews could not be loaded. Close this panel and try again.</p>}
      </section>
    </div>
  );
}

function ShareNoteDialog({ note, onClose, onShowQr }) {
  const [message, setMessage] = useState(null);
  const noteUrl = `${window.location.origin}/notes/${encodeURIComponent(note.id)}`;
  const shareText = `Check out these notes: ${note.title}${note.subject ? ` (${note.subject})` : ""}`;
  const canUseDeviceShare = typeof navigator.share === "function";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(noteUrl);
      setMessage({ type: "success", text: "Link copied to clipboard." });
    } catch {
      setMessage({ type: "error", text: "Could not copy automatically. Select the link and copy it." });
    }
  };

  const shareWithDevice = async () => {
    try {
      await navigator.share({ title: note.title, text: shareText, url: noteUrl });
    } catch (error) {
      if (error.name !== "AbortError") setMessage({ type: "error", text: "Sharing was not completed." });
    }
  };

  return (
    <div className="note-view-overlay" onClick={onClose}>
      <section className="note-view-dialog share-note-dialog" role="dialog" aria-modal="true" aria-labelledby="share-note-title" onClick={(event) => event.stopPropagation()}>
        <button className="note-dialog-close" aria-label="Close share options" onClick={onClose}><Icon name="close" size={18} /></button>
        <p className="eyebrow">Share note</p>
        <h2 id="share-note-title">{note.title}</h2>
        <p className="note-dialog-description">Anyone with this link can open the note after signing in.</p>
        <div className="share-link-row">
          <input aria-label="Note link" value={noteUrl} readOnly onFocus={(event) => event.target.select()} />
          <button className="primary-button" type="button" onClick={copyLink}>Copy link</button>
        </div>
        {message && <p className={`share-message ${message.type}`} role="status">{message.text}</p>}
        <div className="share-options">
          <a className="secondary-button" href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${noteUrl}`)}`} target="_blank" rel="noreferrer">WhatsApp</a>
          <a className="secondary-button" href={`mailto:?subject=${encodeURIComponent(`Notes: ${note.title}`)}&body=${encodeURIComponent(`${shareText}\n\n${noteUrl}`)}`}>Email</a>
          <button className="secondary-button" type="button" onClick={onShowQr}>QR code</button>
          {canUseDeviceShare && <button className="secondary-button" type="button" onClick={shareWithDevice}>More options…</button>}
        </div>
      </section>
    </div>
  );
}

function NoteQrDialog({ note, onClose }) {
  const [qrImage, setQrImage] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const noteUrl = `${window.location.origin}/notes/${encodeURIComponent(note.id)}`;

  useEffect(() => {
    let isCurrent = true;
    QRCode.toDataURL(noteUrl, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 320,
      color: { dark: "#202943", light: "#FFFFFF" },
    }).then((dataUrl) => {
      if (isCurrent) setQrImage(dataUrl);
    }).catch((qrError) => {
      if (isCurrent) setError(qrError.message || "Could not generate a QR code.");
    });

    return () => { isCurrent = false; };
  }, [noteUrl]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(noteUrl);
      setMessage("Note link copied.");
    } catch {
      setMessage("Could not copy the link. Copy it from the address below.");
    }
  };

  return (
    <div className="note-view-overlay" role="presentation" onClick={onClose}>
      <section className="note-view-dialog qr-dialog" role="dialog" aria-modal="true" aria-labelledby="qr-dialog-title" onClick={(event) => event.stopPropagation()}>
        <button className="note-dialog-close" aria-label="Close QR code" onClick={onClose}><Icon name="close" size={18} /></button>
        <p className="eyebrow">Share this note</p>
        <h2 id="qr-dialog-title">{note.title}</h2>
        <p className="qr-dialog-description">Scan this code to open the note details on this site.</p>
        <div className="qr-image-frame">
          {qrImage ? <img src={qrImage} alt={`QR code linking to ${note.title}`} /> : error ? <p className="qr-error" role="alert">{error}</p> : <p>Generating QR code…</p>}
        </div>
        <label className="qr-link-label" htmlFor="note-share-url">Note link</label>
        <input id="note-share-url" className="qr-link-input" value={noteUrl} readOnly onFocus={(event) => event.target.select()} />
        {message && <p className="qr-copy-message" role="status">{message}</p>}
        <div className="qr-dialog-actions">
          <button className="secondary-button" type="button" onClick={copyLink}>Copy link</button>
          <a className={`primary-button ${qrImage ? "" : "disabled"}`} href={qrImage || undefined} download={`note-${note.id}-qr.png`} aria-disabled={!qrImage} onClick={(event) => { if (!qrImage) event.preventDefault(); }}>Download QR</a>
        </div>
      </section>
    </div>
  );
}

function AppDashboard() {
  const { logout, user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [myNotes, setMyNotes] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [bookmarksLoading, setBookmarksLoading] = useState(true);
  const [notesError, setNotesError] = useState("");
  const [bookmarkMessage, setBookmarkMessage] = useState(null);
  const [pendingBookmarkIds, setPendingBookmarkIds] = useState(() => new Set());
  const pendingBookmarkIdsRef = useRef(new Set());
  const [reviewNote, setReviewNote] = useState(null);
  const [qrNote, setQrNote] = useState(null);
  const [aiNote, setAiNote] = useState(null);
  const [aiMode, setAiMode] = useState("summary");
  const [headerQuestion, setHeaderQuestion] = useState("");
  const [askAiQuestion, setAskAiQuestion] = useState(null);
  const [previewNote, setPreviewNote] = useState(null);
  const [shareNote, setShareNote] = useState(null);
  const [detailsStatus, setDetailsStatus] = useState({ busy: false, message: null });
  const [versionNote, setVersionNote] = useState(null);
  const [selectedNoteId, setSelectedNoteId] = useState(getNoteIdFromPath);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const displayName = user?.name || user?.email || "Student";
  const userInitials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("");
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good morning" : currentHour < 17 ? "Good afternoon" : "Good evening";
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const [uploadedNotes, setUploadedNotes] = useState([]);
  const [activePage, setActivePage] = useState(window.location.pathname === "/admin/uploaded-notes" ? "Uploaded Notes" : "Dashboard");

  useEffect(() => {
    let isCurrent = true;

    apiFetch(`${API_BASE_URL}/notes`)
      .then(async (response) => {
        const data = await readApiJson(response);
        if (!response.ok) throw new Error(data.message || "Could not load notes.");
        if (!Array.isArray(data)) throw new Error("The notes response was not valid.");
        if (isCurrent) {
          const mappedNotes = data.map(mapNoteRecord);
          setNotes(mappedNotes);
          setMyNotes(mappedNotes.filter((record) => String(record.uploaded_by) === String(user?.id)));
          setUploadedNotes(mappedNotes);
        }
      })
      .catch((error) => {
        if (isCurrent) setNotesError(error.message || "Could not load notes.");
      })
      .finally(() => {
        if (isCurrent) setNotesLoading(false);
      });

    return () => { isCurrent = false; };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setBookmarksLoading(false);
      return;
    }

    let isCurrent = true;
    apiFetch(`${API_BASE_URL}/bookmarks/${encodeURIComponent(user.id)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Could not load bookmarks.");
        if (!Array.isArray(data)) throw new Error("The bookmarks response was not valid.");
        if (isCurrent) setBookmarks(data);
      })
      .catch((error) => {
        if (isCurrent) setBookmarkMessage({ type: "error", text: error.message || "Could not load bookmarks." });
      })
      .finally(() => {
        if (isCurrent) setBookmarksLoading(false);
      });

    return () => { isCurrent = false; };
  }, [user?.id]);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;
    setNotificationsLoading(true);
    setNotificationsError("");
    try {
      const response = await apiFetch(`${API_BASE_URL}/notifications/${encodeURIComponent(user.id)}`);
      const data = await readApiJson(response);
      if (!response.ok) throw new Error(data.message || "Could not load notifications.");
      if (!Array.isArray(data)) throw new Error("The notifications response was not valid.");
      setNotifications(data);
    } catch (error) {
      setNotificationsError(error.message || "Could not load notifications.");
    } finally {
      setNotificationsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    const handlePopState = () => {
      setSelectedNoteId(getNoteIdFromPath());
      setActivePage(window.location.pathname === "/admin/uploaded-notes" ? "Uploaded Notes" : "Dashboard");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (page) => {
    setSelectedNoteId(null);
    if (page === "Notifications") loadNotifications();
    if (page === "Uploaded Notes") {
      window.history.pushState({}, "", "/admin/uploaded-notes");
    } else {
      window.history.pushState({}, "", "/");
    }
    setActivePage(page);
  };

  // The page behind the details view stays active, so "Back" returns to wherever the note was opened from.
  const openNoteDetails = (note) => {
    setDetailsStatus({ busy: false, message: null });
    window.history.pushState({}, "", `/notes/${encodeURIComponent(note.id)}`);
    setSelectedNoteId(String(note.id));
  };

  const closeNoteDetails = () => {
    window.history.pushState({}, "", activePage === "Uploaded Notes" ? "/admin/uploaded-notes" : "/");
    setSelectedNoteId(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/";
    } catch (error) {
      window.alert(error.message || "Could not sign out.");
    }
  };

  const unreadNotificationCount = notifications.filter((notification) => !Number(notification.is_read)).length;

  const handleBookmark = async (note) => {
    if (!user?.id) {
      setBookmarkMessage({ type: "error", text: "Your account could not be identified. Please sign in again." });
      return;
    }

    const noteId = String(note.id);
    if (bookmarks.some((bookmark) => String(bookmark.note_id) === String(note.id))) {
      setBookmarkMessage({ type: "error", text: "This note is already in your bookmarks." });
      return;
    }

    if (pendingBookmarkIdsRef.current.has(noteId)) return;
    pendingBookmarkIdsRef.current.add(noteId);
    setPendingBookmarkIds((current) => new Set(current).add(noteId));
    setBookmarkMessage(null);
    try {
      const response = await apiFetch(`${API_BASE_URL}/bookmarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, note_id: note.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not bookmark this note.");
      if (data.bookmark_id == null) throw new Error("The server did not return the saved bookmark.");

      setBookmarks((current) => [
        {
          bookmark_id: data.bookmark_id,
          note_id: note.id,
          title: note.title,
          subject: note.subject,
          department: note.department,
          semester: note.semester,
        },
        ...current,
      ]);
      setBookmarkMessage({ type: "success", text: "Note bookmarked successfully." });
    } catch (error) {
      setBookmarkMessage({ type: "error", text: error.message || "Could not bookmark this note." });
    } finally {
      pendingBookmarkIdsRef.current.delete(noteId);
      setPendingBookmarkIds((current) => {
        const next = new Set(current);
        next.delete(noteId);
        return next;
      });
    }
  };

  const handleRemoveBookmark = async (noteId) => {
    if (!user?.id) return;

    const noteKey = String(noteId);
    if (pendingBookmarkIdsRef.current.has(noteKey)) return;
    pendingBookmarkIdsRef.current.add(noteKey);
    setPendingBookmarkIds((current) => new Set(current).add(noteKey));
    setBookmarkMessage(null);
    try {
      const response = await apiFetch(`${API_BASE_URL}/bookmarks/${encodeURIComponent(user.id)}/${encodeURIComponent(noteId)}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not remove this bookmark.");

      setBookmarks((current) => current.filter((bookmark) => String(bookmark.note_id) !== String(noteId)));
      setBookmarkMessage({ type: "success", text: "Bookmark removed successfully." });
    } catch (error) {
      setBookmarkMessage({ type: "error", text: error.message || "Could not remove this bookmark." });
    } finally {
      pendingBookmarkIdsRef.current.delete(noteKey);
      setPendingBookmarkIds((current) => {
        const next = new Set(current);
        next.delete(noteKey);
        return next;
      });
    }
  };

  const markNotificationRead = async (notificationId) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/notifications/${encodeURIComponent(notificationId)}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      });
      const data = await readApiJson(response);
      if (!response.ok) throw new Error(data.message || "Could not mark notification as read.");
      setNotifications((current) => current.map((item) => String(item.id) === String(notificationId) ? { ...item, is_read: 1 } : item));
    } catch (error) {
      setNotificationsError(error.message || "Could not mark notification as read.");
    }
  };

  const updateNoteReviewSummary = useCallback((noteId, averageRating, totalReviews) => {
    setNotes((current) => current.map((note) => String(note.id) === String(noteId)
      ? { ...note, average_rating: averageRating, total_reviews: totalReviews }
      : note));
  }, []);

  const changeNoteStatus = async (note, status) => {
    setDetailsStatus({ busy: true, message: null });
    try {
      const response = await apiFetch(`${API_BASE_URL}/notes/${encodeURIComponent(note.id)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await readApiJson(response);
      if (!response.ok) throw new Error(data.message || "Could not update the note status.");
      updateNoteStatus(note.id, data.note.status);
      setDetailsStatus({ busy: false, message: { type: "success", text: `Note ${data.note.status}.` } });
    } catch (error) {
      setDetailsStatus({ busy: false, message: { type: "error", text: error.message } });
    }
  };

  const updateNoteStatus = useCallback((noteId, status) => {
    const applyStatus = (current) => current.map((note) => String(note.id) === String(noteId) ? { ...note, status } : note);
    setNotes(applyStatus);
    setMyNotes(applyStatus);
    setUploadedNotes(applyStatus);
  }, []);

  return (
    <div className="dashboard-shell">
      <aside className={`dashboard-sidebar ${sidebarOpen ? "open" : ""}`} aria-label="Main navigation">
        <div className="dashboard-brand">
          <div className="brand-mark">N</div>
          <div><strong>Notes Sharing</strong><span>{user?.role === "admin" ? "Admin workspace" : "Student workspace"}</span></div>
        </div>

        <div className="sidebar-heading">Workspace</div>
        <nav aria-label="Main navigation">
          {navigation.map((item) => (
            <button key={item.label} className={`sidebar-link ${activePage === item.label ? "active" : ""}`} onClick={() => { navigate(item.label); setSidebarOpen(false); }}>
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
              {item.label === "Notifications" && unreadNotificationCount > 0
                && <span className="notification-nav-badge">{unreadNotificationCount}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <span className="tip-icon">✦</span>
            <strong>Keep learning</strong>
            <p>Small progress every day adds up.</p>
          </div>
        </div>
      </aside>

      {sidebarOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}

      <main className="dashboard-main">
        <header className="dashboard-header">
          <button className="mobile-menu" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><Icon name="menu" size={20} /></button>
          <form className="header-search" onSubmit={(event) => {
            event.preventDefault();
            setAskAiQuestion(headerQuestion.trim());
            setHeaderQuestion("");
          }}>
            <Icon name="search" size={17} />
            <input aria-label="Ask AI a question" value={headerQuestion} maxLength={500} onChange={(event) => setHeaderQuestion(event.target.value)} placeholder="Ask AI anything… e.g. What is Python?" />
            <button className="header-ask-button" type="submit">Ask AI</button>
          </form>
          <div className="header-actions">
            <ThemePicker />
            <button className="icon-button notification-button" aria-label={`Notifications${unreadNotificationCount ? `, ${unreadNotificationCount} unread` : ""}`} onClick={() => navigate("Notifications")}><Icon name="bell" size={20} />{unreadNotificationCount > 0 && <span>{unreadNotificationCount}</span>}</button>
            <div className="header-divider" />
            <button className="header-user" type="button" title="Account settings" onClick={() => navigate("Settings")}><div className="avatar small">{userInitials}</div><span>{displayName}</span><span className="chevron">⌄</span></button>
          </div>
        </header>

        <div className="dashboard-content">
          {selectedNoteId ? (
            notesLoading ? (
              <div className="notes-empty-state"><h3>Loading note details...</h3></div>
            ) : notesError ? (
              <div className="notes-empty-state"><h3>Note details could not be loaded</h3><p>{notesError}</p></div>
            ) : (() => {
              const selectedNote = notes.find((note) => String(note.id) === selectedNoteId);
              return selectedNote ? (
                <section className="note-details-page">
                  <button className="text-button" type="button" onClick={closeNoteDetails}>← Back to {activePage === "Dashboard" ? "dashboard" : activePage}</button>
                  <article className="note-details-card">
                    <div className={`note-thumbnail ${selectedNote.color || "blue"}`}><span>{selectedNote.initials || selectedNote.title?.slice(0, 2).toUpperCase()}</span><div className="thumbnail-lines"><i /><i /><i /></div></div>
                    <p className="eyebrow">{selectedNote.subject || selectedNote.department || "Shared note"}</p>
                    <h1>{selectedNote.title}</h1>
                    <p className="note-details-meta">{[selectedNote.department, selectedNote.semester].filter(Boolean).join(" · ")}</p>
                    <div className="note-dialog-grid note-details-grid">
                      <span>Status<strong><b className={`admin-status ${noteStatusLabels[selectedNote.status] ? selectedNote.status : "pending"}`}>{noteStatusLabels[selectedNote.status] || "Pending"}</b></strong></span>
                      <span>Department<strong>{selectedNote.department || "—"}</strong></span>
                      <span>Academic year<strong>{selectedNote.year || "—"}</strong></span>
                      <span>Semester<strong>{selectedNote.semester || "—"}</strong></span>
                      <span>Subject<strong>{selectedNote.subject || "—"}</strong></span>
                      <span>Tags<strong>{selectedNote.tags || "—"}</strong></span>
                      <span>Uploaded on<strong>{formatUploadDate(selectedNote.uploadedAt)}</strong></span>
                      <span>Rating<strong>★ {Number(selectedNote.average_rating || 0).toFixed(1)} ({Number(selectedNote.total_reviews || 0)} {Number(selectedNote.total_reviews) === 1 ? "review" : "reviews"})</strong></span>
                      <span>File<strong>{selectedNote.fileName ? `${selectedNote.fileName} (${selectedNote.type})` : "—"}</strong></span>
                    </div>
                    {user?.role === "admin" && (
                      <div className="note-review-bar">
                        <span>Admin review</span>
                        {selectedNote.status !== "approved" && <button className="un-approve" type="button" disabled={detailsStatus.busy} onClick={() => changeNoteStatus(selectedNote, "approved")}><Icon name="check" size={14} />Approve</button>}
                        {selectedNote.status !== "rejected" && <button className="un-reject" type="button" disabled={detailsStatus.busy} onClick={() => changeNoteStatus(selectedNote, "rejected")}><Icon name="close" size={14} />Reject</button>}
                        {selectedNote.status !== "pending" && <button className="cancel-button" type="button" disabled={detailsStatus.busy} onClick={() => changeNoteStatus(selectedNote, "pending")}>Move back to pending</button>}
                        {detailsStatus.message && <em className={`un-inline-message ${detailsStatus.message.type}`} role="status">{detailsStatus.message.text}</em>}
                      </div>
                    )}
                    <div className="note-details-actions">
                      <button className="primary-button" type="button" onClick={() => setShareNote(selectedNote)}>Share note</button>
                      <button className="secondary-button" type="button" onClick={() => setPreviewNote(selectedNote)}>Preview file</button>
                      <button className="secondary-button" type="button" onClick={() => setReviewNote(selectedNote)}>Ratings & comments</button>
                      <button className="secondary-button" type="button" onClick={() => setQrNote(selectedNote)}>Generate QR</button>
                      <button className="secondary-button" type="button" onClick={() => { setAiNote(selectedNote); setAiMode("summary"); }}>AI Summary</button>
                      <button className="secondary-button" type="button" onClick={() => { setAiNote(selectedNote); setAiMode("questions"); }}>AI Generate Questions</button>
                      <button className="secondary-button" type="button" onClick={() => setVersionNote(selectedNote)}>Version history</button>
                    </div>
                    {selectedNote.file_path && <a className="note-file-download" href={`${API_BASE_URL}/${String(selectedNote.file_path).replace(/^\/+/, "")}`}>Download current file: {selectedNote.file_name || selectedNote.fileName}</a>}
                    {selectedNote.description && <p className="note-details-description">{selectedNote.description}</p>}
                  </article>
                </section>
              ) : (
                <section className="notes-empty-state"><h3>Note not found</h3><p>This note may have been removed or is not available.</p><button className="text-button" type="button" onClick={closeNoteDetails}>Back to dashboard</button></section>
              );
            })()
          ) : activePage === "Uploaded Notes" ? (
            <AdminUploadedNotesPage notes={uploadedNotes} user={user} onStatusChange={updateNoteStatus} onOpenNote={openNoteDetails} />
          ) : activePage === "Bookmarks" ? (
            <section className="bookmarks-page">
              <div className="welcome-row"><div><p className="eyebrow">Your saved library</p><h1>Bookmarks</h1><p className="welcome-copy">Notes you have saved for later.</p></div><span className="notes-count">{bookmarks.length} {bookmarks.length === 1 ? "note" : "notes"}</span></div>
              {bookmarkMessage && <div className={`bookmark-feedback ${bookmarkMessage.type}`} role={bookmarkMessage.type === "error" ? "alert" : "status"}>{bookmarkMessage.text}</div>}
              {bookmarksLoading ? <div className="notes-empty-state"><h3>Loading bookmarks...</h3></div> : bookmarks.length ? (
                <div className="bookmarks-list">
                  {bookmarks.map((bookmark) => (
                    <article className="bookmark-item" key={bookmark.bookmark_id}>
                      <div className="bookmark-item-icon"><Icon name="bookmark" size={20} /></div>
                      <div className="bookmark-item-copy"><h2>{bookmark.title}</h2><p>{[bookmark.subject, bookmark.department, bookmark.semester].filter(Boolean).join(" · ")}</p></div>
                      <button className="bookmark-remove-button" onClick={() => handleRemoveBookmark(bookmark.note_id)} disabled={pendingBookmarkIds.has(String(bookmark.note_id))}>
                        {pendingBookmarkIds.has(String(bookmark.note_id)) ? "Removing..." : "Remove bookmark"}
                      </button>
                    </article>
                  ))}
                </div>
              ) : <div className="notes-empty-state"><span><Icon name="bookmark" size={24} /></span><h3>No bookmarks yet</h3><p>Save a note from your dashboard and it will appear here.</p></div>}
            </section>
          ) : activePage === "Notifications" ? (
            <section className="notifications-page">
              <div className="welcome-row">
                <div><p className="eyebrow">Your activity</p><h1>Notifications</h1><p className="welcome-copy">Updates about your notes and study activity.</p></div>
                <span className="notes-count">{unreadNotificationCount} unread</span>
              </div>
              {notificationsError && <div className="bookmark-feedback error" role="alert">{notificationsError}</div>}
              {notificationsLoading ? <p className="advanced-state">Loading notifications…</p> : notifications.length ? (
                <div className="notification-list">
                  {notifications.map((notification) => (
                    <article className={`notification-item ${Number(notification.is_read) ? "" : "unread"}`} key={notification.id}>
                      <span className="notification-dot" />
                      <div className="notification-copy">
                        <strong>{notification.title}</strong>
                        <p>{notification.message}</p>
                        <time>{notification.created_at ? new Date(notification.created_at).toLocaleString() : ""}</time>
                      </div>
                      {!Number(notification.is_read) && <button className="notification-read-button" type="button" onClick={() => markNotificationRead(notification.id)}>Mark read</button>}
                    </article>
                  ))}
                </div>
              ) : notificationsError ? null : <div className="notes-empty-state"><span><Icon name="bell" size={24} /></span><h3>You’re all caught up</h3><p>New note activity will appear here.</p></div>}
            </section>
          ) : activePage === "My Notes" ? (
            <MyNotesPage notes={myNotes} />
          ) : activePage === "Upload Note" ? (
            <UploadNotePage onCancel={() => navigate("Dashboard")} onUploaded={(newNote) => {
              const mappedNote = mapNoteRecord(newNote);
              if (String(mappedNote.uploaded_by) === String(user?.id)) setMyNotes((current) => [mappedNote, ...current]);
              setUploadedNotes((current) => [mappedNote, ...current.filter((note) => String(note.id) !== String(mappedNote.id))]);
              setNotes((current) => [mappedNote, ...current.filter((note) => String(note.id) !== String(mappedNote.id))]);
              loadNotifications();
            }} />
          ) : activePage === "User Management" ? (
            <UserManagementPage user={user} />
          ) : activePage === "Explore Notes" ? (
            <ExploreNotesPage notes={notes} loading={notesLoading} error={notesError} onOpenNote={openNoteDetails} onAi={(note, mode) => { setAiNote(note); setAiMode(mode); }} />
          ) : activePage === "Study Groups" ? (
            <StudyGroupsPage onExplore={() => navigate("Explore Notes")} />
          ) : activePage === "Settings" ? (
            <SettingsPage user={user} onLogout={handleLogout} />
          ) : (
            <>
              <section className="welcome-row">
                <div><p className="eyebrow">{new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p><h1>{greeting}, {displayName.split(/\s+/)[0]} <span>✦</span></h1><p className="welcome-copy">Ready to make some progress today?</p></div>
                <button className="primary-button" type="button" onClick={() => navigate("Upload Note")}><Icon name="upload" size={18} /> Upload notes</button>
              </section>

              <section className="stats-grid" aria-label="Learning summary">
                <article className="stat-card"><div className="stat-icon blue"><Icon name="file" /></div><div><span>Notes in library</span><strong>{notesLoading ? "…" : notes.length}</strong><small>{notesLoading ? "Loading" : `${notes.filter((note) => note.status === "approved").length} approved`}</small></div></article>
                <article className="stat-card"><div className="stat-icon purple"><Icon name="bookmark" /></div><div><span>Saved notes</span><strong>{bookmarksLoading ? "…" : bookmarks.length}</strong><small>In your library</small></div></article>
                <article className="stat-card"><div className="stat-icon orange"><Icon name="upload" /></div><div><span>My uploads</span><strong>{notesLoading ? "…" : myNotes.length}</strong><small>{notesLoading ? "Loading" : `${myNotes.filter((note) => note.status === "pending").length} waiting for review`}</small></div></article>
              </section>

              <section className="dashboard-grid">
                <div className="notes-section">
                  <div className="section-heading"><div><h2>Your recent notes</h2><p>Pick up where you left off</p></div><button className="text-button" type="button" onClick={() => navigate("Explore Notes")}>View all <Icon name="arrow" size={16} /></button></div>
                  {bookmarkMessage && <div className={`bookmark-feedback ${bookmarkMessage.type}`} role={bookmarkMessage.type === "error" ? "alert" : "status"}>{bookmarkMessage.text}</div>}
                  {notesLoading ? <div className="notes-empty-state"><h3>Loading notes...</h3></div> : notesError ? <div className="notes-empty-state"><h3>Notes could not be loaded</h3><p>{notesError}</p></div> : notes.length ? (
                    <div className="notes-list">
                      {notes.map((note) => {
                        const isBookmarked = bookmarks.some((bookmark) => String(bookmark.note_id) === String(note.id));
                        return (
                          <article className="note-card" key={note.id}>
                            <div className={`note-thumbnail ${note.color || "blue"}`}><span>{note.initials || note.title?.slice(0, 2).toUpperCase()}</span><div className="thumbnail-lines"><i /><i /><i /></div></div>
                            <div className="note-info">
                              <span className="note-subject">{note.subject || note.department}</span>
                              <h3>{note.title}</h3>
                              <p>{[note.department, note.semester].filter(Boolean).join(" · ")}</p>
                              <button className="note-review-trigger" onClick={() => setReviewNote(note)} aria-label={`View ratings and comments for ${note.title}`}>
                                <span className="note-review-stars">★</span>
                                <strong>{Number(note.average_rating || 0).toFixed(1)}</strong>
                                <span>{Number(note.total_reviews || 0)} {Number(note.total_reviews) === 1 ? "review" : "reviews"} · View comments</span>
                              </button>
                              <div className="note-card-actions">
                                <button className="note-open-button" type="button" onClick={() => openNoteDetails(note)}>View note</button>
                                <button className="note-open-button" type="button" onClick={() => setQrNote(note)}>Generate QR</button>
                                <button className="note-open-button" type="button" onClick={() => { setAiNote(note); setAiMode("summary"); }}>AI Summary</button>
                                <button className="note-open-button" type="button" onClick={() => { setAiNote(note); setAiMode("questions"); }}>AI Questions</button>
                                <button className="note-open-button" type="button" onClick={() => setVersionNote(note)}>Versions</button>
                              </div>
                            </div>
                            <button className={`note-bookmark-button ${isBookmarked ? "saved" : ""}`} onClick={() => handleBookmark(note)} disabled={bookmarksLoading || pendingBookmarkIds.has(String(note.id)) || isBookmarked} aria-label={isBookmarked ? `${note.title} is bookmarked` : `Bookmark ${note.title}`} title={isBookmarked ? "Bookmarked" : "Bookmark note"}><Icon name="bookmark" size={17} /><span>{bookmarksLoading ? "Checking..." : pendingBookmarkIds.has(String(note.id)) ? "Saving..." : isBookmarked ? "Saved" : "Bookmark"}</span></button>
                          </article>
                        );
                      })}
                    </div>
                  ) : <div className="notes-empty-state"><span><Icon name="file" size={24} /></span><h3>No notes available</h3><p>Notes from the database will appear here.</p></div>}
                </div>

                <aside className="activity-card overview-card">
                  <div className="section-heading"><div><h2>Library overview</h2><p>Review status of all notes</p></div></div>
                  {notes.length ? (() => {
                    const statusRows = [["approved", "Approved"], ["pending", "Pending review"], ["rejected", "Rejected"]]
                      .map(([key, label]) => ({ key, label, count: notes.filter((note) => (note.status || "pending") === key).length }));
                    const departmentCounts = Object.entries(notes.reduce((totals, note) => {
                      if (note.department) totals[note.department] = (totals[note.department] || 0) + 1;
                      return totals;
                    }, {})).sort((left, right) => right[1] - left[1]).slice(0, 4);
                    return (
                      <>
                        <div className="overview-list">
                          {statusRows.map((row) => (
                            <div className="overview-row" key={row.key}>
                              <header><span>{row.label}</span><strong>{row.count}</strong></header>
                              <div className="overview-bar"><span className={row.key} style={{ width: `${Math.round((row.count / notes.length) * 100)}%` }} /></div>
                            </div>
                          ))}
                        </div>
                        {departmentCounts.length > 0 && <p className="overview-subheading">Top departments</p>}
                        <div className="overview-list">
                          {departmentCounts.map(([name, count]) => (
                            <div className="overview-row" key={name}>
                              <header><span>{name}</span><strong>{count}</strong></header>
                              <div className="overview-bar"><span className="department" style={{ width: `${Math.round((count / notes.length) * 100)}%` }} /></div>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })() : <p className="overview-empty">Upload a note to see library statistics.</p>}
                </aside>
              </section>

              <section className="discover-card"><div><span className="discover-label">COMMUNITY PICK</span><h2>Discover notes from your community</h2><p>Find helpful study material shared by students in your course.</p></div><button className="secondary-button" type="button" onClick={() => navigate("Explore Notes")}>Explore notes <Icon name="arrow" size={17} /></button><div className="discover-shape shape-one" /><div className="discover-shape shape-two" /></section>
            </>
          )}
        </div>
      </main>
      {reviewNote && user && <NoteReviewsDialog note={reviewNote} user={user} onClose={() => setReviewNote(null)} onSummaryChange={updateNoteReviewSummary} />}
      {qrNote && <NoteQrDialog note={qrNote} onClose={() => setQrNote(null)} />}
      {aiNote && <AiNoteDialog key={`${aiNote.id}-${aiMode}`} note={aiNote} user={user} mode={aiMode} onClose={() => setAiNote(null)} />}
      {versionNote && <NoteVersionsDialog note={versionNote} user={user} onClose={() => setVersionNote(null)} />}
      {askAiQuestion !== null && <AskAiDialog initialQuestion={askAiQuestion} onClose={() => setAskAiQuestion(null)} />}
      {previewNote && <NotePreviewDialog note={previewNote} onClose={() => setPreviewNote(null)} />}
      {shareNote && <ShareNoteDialog note={shareNote} onClose={() => setShareNote(null)} onShowQr={() => { setQrNote(shareNote); setShareNote(null); }} />}
    </div>
  );
}

export default function AppRoot() {
  return (
    <AuthProvider>
      <ProtectedApp />
    </AuthProvider>
  );
}
