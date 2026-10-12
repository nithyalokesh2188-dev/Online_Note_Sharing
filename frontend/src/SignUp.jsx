import { useState } from "react";
import "./SignUp.css";

function SignUp() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    college: "",
    year: "1st Year",
    agreeTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: "", message: "" });
  const [passwordStrength, setPasswordStrength] = useState(0);

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    } else if (formData.fullName.trim().length < 3) {
      nextErrors.fullName = "Full name must be at least 3 characters.";
    }

    if (!formData.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!formData.password) {
      nextErrors.password = "Password is required.";
    } else if (formData.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }

    if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    if (!formData.college.trim()) {
      nextErrors.college = "College/University is required.";
    }

    if (!formData.agreeTerms) {
      nextErrors.agreeTerms = "You must agree to the terms and conditions.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    const newValue = type === "checkbox" ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    if (name === "password") {
      setPasswordStrength(calculatePasswordStrength(value));
    }

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    if (status.type) {
      setStatus({ type: "", message: "" });
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validateForm()) {
      setStatus({ type: "error", message: "Please fix the highlighted fields and try again." });
      return;
    }

    setStatus({
      type: "success",
      message: `Account created successfully, ${formData.fullName}! Check your email to verify.`,
    });
  };

  const getPasswordStrengthLabel = () => {
    const labels = ["", "Very Weak", "Weak", "Fair", "Good", "Strong"];
    return labels[passwordStrength];
  };

  const getPasswordStrengthColor = () => {
    const colors = ["#e5e7eb", "#dc2626", "#f97316", "#eab308", "#84cc16", "#22c55e"];
    return colors[passwordStrength];
  };

  return (
    <div className="page-shell">
      <div className="signup-card">
        <aside className="brand-visual" aria-label="Notes Sharing brand information">
          <div className="visual-badge">Join Now</div>

          <div className="illustration" aria-hidden="true">
            <div className="notebook">
              <div className="note-pin" />
              <div className="note-lines">
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>

          <div className="benefits-list" aria-label="Signup benefits">
            <div className="benefit-item">
              <span className="benefit-check">✓</span>
              <span>Share & collaborate with classmates</span>
            </div>
            <div className="benefit-item">
              <span className="benefit-check">✓</span>
              <span>Access organized study materials</span>
            </div>
            <div className="benefit-item">
              <span className="benefit-check">✓</span>
              <span>Join study groups in your course</span>
            </div>
            <div className="benefit-item">
              <span className="benefit-check">✓</span>
              <span>Secure cloud storage for notes</span>
            </div>
          </div>
        </aside>

        <main className="signup-panel">
          <div className="panel-header">
            <h1>Create Account</h1>
            <p>Join thousands of students learning together</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="field-group">
              <label htmlFor="fullName">Full Name</label>
              <div className={`input-field ${errors.fullName ? "invalid" : ""}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="John Doe"
                  autoComplete="name"
                  value={formData.fullName}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.fullName)}
                  aria-describedby={errors.fullName ? "fullName-error" : undefined}
                />
              </div>
              {errors.fullName && <span id="fullName-error" className="field-error">{errors.fullName}</span>}
            </div>

            <div className="field-group">
              <label htmlFor="email">Email Address</label>
              <div className={`input-field ${errors.email ? "invalid" : ""}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z" />
                  <path d="m5 7 7 5 7-5" />
                </svg>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@university.edu"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
              </div>
              {errors.email && <span id="email-error" className="field-error">{errors.email}</span>}
            </div>

            <div className="field-group">
              <label htmlFor="college">College/University</label>
              <div className={`input-field ${errors.college ? "invalid" : ""}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M12 3L2 9v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9l-10-6z" />
                  <path d="M12 9v6M9 15h6" />
                </svg>
                <input
                  id="college"
                  name="college"
                  type="text"
                  placeholder="e.g., IIT Mumbai, Stanford"
                  autoComplete="organization"
                  value={formData.college}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.college)}
                  aria-describedby={errors.college ? "college-error" : undefined}
                />
              </div>
              {errors.college && <span id="college-error" className="field-error">{errors.college}</span>}
            </div>

            <div className="field-row">
              <div className="field-group">
                <label htmlFor="year">Year of Study</label>
                <div className="input-field">
                  <select
                    id="year"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                  >
                    <option>1st Year</option>
                    <option>2nd Year</option>
                    <option>3rd Year</option>
                    <option>4th Year</option>
                    <option>Post-Graduate</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="field-group">
              <label htmlFor="password">Password</label>
              <div className={`input-field ${errors.password ? "invalid" : ""}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <rect x="5" y="11" width="14" height="9" rx="2" />
                  <path d="M8 11V8.5A4 4 0 1 1 16 8.5V11" />
                </svg>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "password-error" : undefined}
                />
              </div>
              {errors.password && <span id="password-error" className="field-error">{errors.password}</span>}
              {formData.password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div
                      className="strength-fill"
                      style={{
                        width: `${(passwordStrength / 5) * 100}%`,
                        backgroundColor: getPasswordStrengthColor(),
                      }}
                    />
                  </div>
                  <span className="strength-label" style={{ color: getPasswordStrengthColor() }}>
                    {getPasswordStrengthLabel()}
                  </span>
                </div>
              )}
            </div>

            <div className="field-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className={`input-field ${errors.confirmPassword ? "invalid" : ""}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <rect x="5" y="11" width="14" height="9" rx="2" />
                  <path d="M8 11V8.5A4 4 0 1 1 16 8.5V11" />
                </svg>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.confirmPassword)}
                  aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                />
              </div>
              {errors.confirmPassword && <span id="confirmPassword-error" className="field-error">{errors.confirmPassword}</span>}
            </div>

            <div className="terms-group">
              <label className="checkbox" htmlFor="agreeTerms">
                <input
                  id="agreeTerms"
                  name="agreeTerms"
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.agreeTerms)}
                />
                I agree to the <a href="#">Terms & Conditions</a> and <a href="#">Privacy Policy</a>
              </label>
              {errors.agreeTerms && <span className="field-error">{errors.agreeTerms}</span>}
            </div>

            <button className="signup-button" type="submit">
              Create Account
            </button>

            {status.message && (
              <p className={`form-status ${status.type}`} role="status" aria-live="polite">
                {status.message}
              </p>
            )}
          </form>

          <p className="login-prompt">
            Already have an account? <a href="#">Sign In</a>
          </p>
        </main>
      </div>
    </div>
  );
}

export default SignUp;
