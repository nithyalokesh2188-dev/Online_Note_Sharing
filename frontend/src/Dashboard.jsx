import { useState } from "react";
import "./Dashboard.css";

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [notes, setNotes] = useState([
    { id: 1, title: "React Hooks Guide", category: "Web Dev", date: "2 days ago", shared: true, color: "#4f46e5" },
    { id: 2, title: "Data Structures", category: "CS Fundamentals", date: "5 days ago", shared: false, color: "#7c3aed" },
    { id: 3, title: "Linear Algebra Notes", category: "Mathematics", date: "1 week ago", shared: true, color: "#06b6d4" },
    { id: 4, title: "Database Design Principles", category: "Backend", date: "1 week ago", shared: true, color: "#ec4899" },
  ]);

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊", description: "Overview" },
    { id: "my-notes", label: "My Notes", icon: "📝", description: "Your notes" },
    { id: "shared", label: "Shared with Me", icon: "📤", description: "From others" },
    { id: "favorites", label: "Favorites", icon: "⭐", description: "Starred notes" },
    { id: "settings", label: "Settings", icon: "⚙️", description: "Preferences" },
  ];

  return (
    <div className="dashboard-shell">
      <nav className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <div className="brand-icon">N</div>
          {sidebarOpen && (
            <div>
              <h2>Notes Sharing</h2>
              <p>Learning Hub</p>
            </div>
          )}
          <button
            className="toggle-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            title={sidebarOpen ? "Collapse" : "Expand"}
          >
            {sidebarOpen ? "‹" : "›"}
          </button>
        </div>

        <ul className="nav-list">
          {navItems.slice(0, 4).map((item) => (
            <li key={item.id}>
              <button
                className={`nav-link ${activeTab === item.id ? "active" : ""}`}
                onClick={() => setActiveTab(item.id)}
                title={item.label}
              >
                <span className="icon">{item.icon}</span>
                {sidebarOpen && (
                  <span className="label">
                    <span className="name">{item.label}</span>
                    <span className="hint">{item.description}</span>
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>

        <div className="sidebar-divider" />

        <ul className="nav-list">
          <li>
            <button
              className={`nav-link ${activeTab === "settings" ? "active" : ""}`}
              onClick={() => setActiveTab("settings")}
              title="Settings"
            >
              <span className="icon">{navItems[4].icon}</span>
              {sidebarOpen && (
                <span className="label">
                  <span className="name">{navItems[4].label}</span>
                  <span className="hint">{navItems[4].description}</span>
                </span>
              )}
            </button>
          </li>
          <li>
            <button
              className="nav-link logout"
              onClick={() => alert("Logged out successfully!")}
              title="Logout"
            >
              <span className="icon">🚪</span>
              {sidebarOpen && (
                <span className="label">
                  <span className="name">Logout</span>
                  <span className="hint">Exit app</span>
                </span>
              )}
            </button>
          </li>
        </ul>
      </nav>

      <main className="main-content">
        <header className="top-bar">
          <div className="header-left">
            <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              ☰
            </button>
            <h1 className="page-title">
              {navItems.find(item => item.id === activeTab)?.label || "Dashboard"}
            </h1>
          </div>

          <div className="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search notes"
            />
          </div>

          <div className="user-menu">
            <button className="profile-btn" title="Profile">👤</button>
          </div>
        </header>

        <section className="content-area">
          {activeTab === "dashboard" && (
            <div className="dashboard-view">
              <div className="welcome-card">
                <div>
                  <h2>Welcome back, Student! 👋</h2>
                  <p>Here's your learning progress this week</p>
                </div>
                <button className="btn-primary">+ Create Note</button>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">📝</div>
                  <div>
                    <h3>{notes.length}</h3>
                    <p>Total Notes</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📤</div>
                  <div>
                    <h3>{notes.filter(n => n.shared).length}</h3>
                    <p>Notes Shared</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div>
                    <h3>12</h3>
                    <p>Study Groups</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">⭐</div>
                  <div>
                    <h3>28</h3>
                    <p>Favorites</p>
                  </div>
                </div>
              </div>

              <div className="recent-section">
                <div className="section-header">
                  <h3>Recent Notes</h3>
                  <a href="#">View all →</a>
                </div>
                <div className="notes-grid">
                  {filteredNotes.slice(0, 4).map((note) => (
                    <div key={note.id} className="note-card">
                      <div className="note-header" style={{ borderTopColor: note.color }}>
                        <span className="note-category">{note.category}</span>
                        {note.shared && <span className="badge-shared">Shared</span>}
                      </div>
                      <h4>{note.title}</h4>
                      <p className="note-date">{note.date}</p>
                      <div className="note-actions">
                        <button className="icon-btn" title="View">👁️</button>
                        <button className="icon-btn" title="Edit">✏️</button>
                        <button className="icon-btn" title="Share">📤</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "my-notes" && (
            <div className="notes-view">
              <div className="view-controls">
                <h2>My Notes</h2>
                <div className="view-options">
                  <button className="view-btn active" title="Grid view">⊞</button>
                  <button className="view-btn" title="List view">☰</button>
                </div>
              </div>
              <div className="notes-list">
                {filteredNotes.length > 0 ? (
                  <div className="notes-grid">
                    {filteredNotes.map((note) => (
                      <div key={note.id} className="note-card">
                        <div className="note-header" style={{ borderTopColor: note.color }}>
                          <span className="note-category">{note.category}</span>
                          {note.shared && <span className="badge-shared">Shared</span>}
                        </div>
                        <h4>{note.title}</h4>
                        <p className="note-date">{note.date}</p>
                        <div className="note-actions">
                          <button className="icon-btn" title="View">👁️</button>
                          <button className="icon-btn" title="Edit">✏️</button>
                          <button className="icon-btn" title="Share">📤</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>No notes found matching your search.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "shared" && (
            <div className="shared-view">
              <h2>Notes Shared with Me</h2>
              <div className="notes-grid">
                {notes.filter(n => n.shared).map((note) => (
                  <div key={note.id} className="note-card shared-note">
                    <div className="note-header" style={{ borderTopColor: note.color }}>
                      <span className="note-category">{note.category}</span>
                      <span className="badge-shared">Shared by Alice</span>
                    </div>
                    <h4>{note.title}</h4>
                    <p className="note-date">Shared {note.date}</p>
                    <div className="note-actions">
                      <button className="icon-btn" title="View">👁️</button>
                      <button className="icon-btn" title="Add to favorites">⭐</button>
                      <button className="icon-btn" title="Comment">💬</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "favorites" && (
            <div className="favorites-view">
              <h2>Favorite Notes</h2>
              <div className="empty-state">
                <p>⭐ No favorites yet. Star your favorite notes to see them here.</p>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="settings-view">
              <div className="settings-section">
                <h2>Settings</h2>

                <div className="setting-group">
                  <h3>Account</h3>
                  <div className="setting-item">
                    <label>Email</label>
                    <input type="email" value="student@example.com" readOnly />
                  </div>
                  <div className="setting-item">
                    <label>Full Name</label>
                    <input type="text" value="John Doe" readOnly />
                  </div>
                </div>

                <div className="setting-group">
                  <h3>Preferences</h3>
                  <div className="setting-item checkbox">
                    <input type="checkbox" id="notifications" defaultChecked />
                    <label htmlFor="notifications">Enable notifications</label>
                  </div>
                  <div className="setting-item checkbox">
                    <input type="checkbox" id="share-profile" defaultChecked />
                    <label htmlFor="share-profile">Share my profile with study groups</label>
                  </div>
                </div>

                <div className="setting-group">
                  <h3>Privacy</h3>
                  <div className="setting-item">
                    <label>Default note visibility</label>
                    <select>
                      <option>Private</option>
                      <option>Study Group Only</option>
                      <option>Public</option>
                    </select>
                  </div>
                </div>

                <div className="setting-actions">
                  <button className="btn-primary">Save Changes</button>
                  <button className="btn-secondary">Reset to Default</button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
