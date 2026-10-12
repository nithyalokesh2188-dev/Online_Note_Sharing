import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import './Login.css';
import { ThemePicker } from './ThemePicker';

function Icon({ name, size = 20 }) {
  const paths = {
    mail: <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z M5 7l7 5 7-5" />,
    lock: <path d="M7 10h10M8 5h8a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm0 7v3" />,
    eye: <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></>,
    eyeOff: <><path d="M10.5 5C5.5 5 2.5 12 2.5 12s1.3 2.5 3.5 4.5m12-4.5s-3 6-9.5 6c-2 0-3.8-1-5-2.5M21 4l-18 18" /></>,
    alert: <><path d="M12 2L2 20h20L12 2Z" /><circle cx="12" cy="15" r="1" /><path d="M12 10v3" /></>,
    check: <path d="m3 12 6 6 12-12" />,
  };

  return (
    <svg 
      aria-hidden="true" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.8" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function Login({ onLoginSuccess }) {
  const { login, sessionExpired } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetDone, setResetDone] = useState(false);

  useEffect(() => {
    if (sessionExpired) {
      setError('Your session has expired. Please login again.');
    }
  }, [sessionExpired]);

  const validateForm = () => {
    const nextErrors = {};

    if (!email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      nextErrors.password = 'Password is required.';
    } else if (password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const user = await login(email, password);
      setEmail('');
      setPassword('');
      setErrors({});
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    
    if (name === 'email') {
      setEmail(value);
      if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
    } else if (name === 'password') {
      setPassword(value);
      if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
    }

    if (error) setError('');
  };

  const handleForgotPassword = () => {
    if (!email.trim()) {
      setErrors({ email: 'Please enter your email address.' });
      return;
    }
    setResetDone(true);
    setTimeout(() => setResetDone(false), 3000);
  };

  return (
    <div className="login-page-shell">
      <ThemePicker className="login-theme-picker" showLabel />
      <div className="login-container">
        {/* Left side - Brand */}
        <aside className="login-brand-section" aria-label="Notes Sharing brand">
          <div className="brand-logo-large">
            <div className="logo-circle">N</div>
          </div>

          <div className="brand-headline">
            <h1>Notes Sharing</h1>
            <p>Your collaborative learning platform</p>
          </div>

          <div className="brand-features">
            <div className="feature-item">
              <span className="feature-icon">📚</span>
              <span>Share study materials</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">👥</span>
              <span>Collaborate with classmates</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🔒</span>
              <span>Secure & organized</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <span>Access anytime, anywhere</span>
            </div>
          </div>

          <div className="brand-footer">
            <p>Join thousands of students learning together</p>
          </div>
        </aside>

        {/* Right side - Login form */}
        <main className="login-form-section">
          <div className="login-form-card">
            <div className="login-header">
              <h2>Welcome Back</h2>
              <p>Sign in to your account to continue</p>
            </div>

            {/* Session expired alert */}
            {sessionExpired && (
              <div className="session-alert">
                <Icon name="alert" size={18} />
                <span>Your session has expired. Please login again.</span>
              </div>
            )}

            {/* Reset password success message */}
            {resetDone && (
              <div className="reset-success-alert">
                <Icon name="check" size={18} />
                <span>Password reset link sent to your email.</span>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="login-error-alert">
                <Icon name="alert" size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Email field */}
              <div className="login-field-group">
                <label htmlFor="email">Email Address</label>
                <div className={`login-input-field ${errors.email ? 'invalid' : ''}`}>
                  <Icon name="mail" size={18} />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@university.edu"
                    autoComplete="email"
                    value={email}
                    onChange={handleChange}
                    disabled={isLoading}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                </div>
                {errors.email && (
                  <span id="email-error" className="login-field-error">{errors.email}</span>
                )}
              </div>

              {/* Password field */}
              <div className="login-field-group">
                <label htmlFor="password">Password</label>
                <div className={`login-input-field ${errors.password ? 'invalid' : ''}`}>
                  <Icon name="lock" size={18} />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={password}
                    onChange={handleChange}
                    disabled={isLoading}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    disabled={isLoading}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
                  </button>
                </div>
                {errors.password && (
                  <span id="password-error" className="login-field-error">{errors.password}</span>
                )}
              </div>

              {/* Remember me & forgot password */}
              <div className="login-options">
                <label className="login-checkbox">
                  <input type="checkbox" defaultChecked />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  className="login-forgot-link"
                  onClick={handleForgotPassword}
                  disabled={isLoading}
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="login-submit-button"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="login-spinner" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Icon name="check" size={17} />
                    Sign In
                  </>
                )}
              </button>
            </form>

            {/* Sign up link */}
            <div className="login-footer">
              <p>Don't have an account? <a href="/signup">Create one now</a></p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Login;
