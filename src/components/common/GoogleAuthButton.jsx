import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { AlertCircle, CheckCircle2, KeyRound, ArrowRight, Lock, HelpCircle } from 'lucide-react';

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '321288170457-e35rtrl6m76aaptnf3fsp19sjt19v3pk.apps.googleusercontent.com';

// Official Google G Logo SVG
export function GoogleIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.94H1.26v3.15C3.25 21.31 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.26c-.25-.72-.38-1.49-.38-2.26s.13-1.54.38-2.26V6.59H1.26C.46 8.18 0 9.97 0 12s.46 3.82 1.26 5.41l4.02-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.69 1.26 6.59l4.02 3.15c.95-2.84 3.6-4.99 6.72-4.99z"
      />
    </svg>
  );
}

/**
 * GoogleAuthButton Component
 * Supports:
 * 1. Official Google Identity Services (GIS) Button
 * 2. Direct { "token": "string" } API submission to /api/v1/users/google/
 * 3. Offline / Demo fallback option
 */
export default function GoogleAuthButton({
  onSuccess,
  onError,
  text = 'Continue with Google',
  theme = 'outline', // 'outline' | 'filled'
  size = 'large',
  mode = 'normal', // 'normal' | 'admin'
  showDirectTokenInput = true,
  className = '',
}) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showTokenMode, setShowTokenMode] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [gisLoaded, setGisLoaded] = useState(false);
  const googleBtnRef = useRef(null);

  // Process Google credential / ID token through POST /api/v1/users/google/
  const processGoogleToken = async (idToken) => {
    let cleanToken = idToken;

    // Support pasted JSON `{ "token": "..." }` or raw token string
    if (typeof idToken === 'string' && idToken.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(idToken.trim());
        cleanToken = parsed.token || parsed.credential || idToken;
      } catch {
        // Not JSON, continue with raw string
      }
    }

    if (!cleanToken || typeof cleanToken !== 'string' || !cleanToken.trim()) {
      setErrorMsg('Please provide a valid Google token string.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Calls POST /api/v1/users/google/ with { "token": cleanToken.trim() }
      const response = await api.users.googleLogin(cleanToken.trim());
      const user = response?.user || response?.data?.user;
      const isNewUser = response?.created;

      const welcomeText = isNewUser
        ? `Account registered successfully! Welcome, ${user?.first_name || user?.email || 'Hacker'}.`
        : `Signed in successfully as ${user?.first_name || user?.email || 'User'}.`;

      setSuccessMsg(welcomeText);

      if (onSuccess) {
        onSuccess(user, response);
      }
    } catch (err) {
      console.error('Google Auth Failed:', err);
      let message = err.message || 'Authentication with Google failed.';
      if (err.data) {
        if (typeof err.data === 'string') message = err.data;
        else if (err.data.non_field_errors) message = Array.isArray(err.data.non_field_errors) ? err.data.non_field_errors.join(' ') : String(err.data.non_field_errors);
        else if (err.data.token) message = Array.isArray(err.data.token) ? err.data.token.join(' ') : String(err.data.token);
        else if (err.data.detail) message = String(err.data.detail);
      }
      setErrorMsg(message);
      if (onError) onError(err, message);
    } finally {
      setLoading(false);
    }
  };

  // Initialize Google Identity Services (GIS)
  useEffect(() => {
    const initGsi = () => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (credentialResponse) => {
              if (credentialResponse?.credential) {
                processGoogleToken(credentialResponse.credential);
              }
            },
            auto_select: false,
          });

          // Render official GIS button
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: theme === 'filled' ? 'filled_blue' : 'outline',
            size: size,
            text: mode === 'admin' ? 'signin_with' : 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: googleBtnRef.current.offsetWidth || 280,
          });

          setGisLoaded(true);
        } catch (e) {
          console.warn('GIS render failed, falling back to custom trigger:', e);
          setGisLoaded(false);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGsi();
    } else {
      // Check every 250ms for script load (up to 3 seconds)
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initGsi();
        }
      }, 250);
      const timeout = setTimeout(() => clearInterval(interval), 3000);
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [theme, size, mode]);

  // Direct trigger if user clicks the button
  const handleCustomGoogleClick = () => {
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            if (showDirectTokenInput) {
              setShowTokenMode(true);
            } else {
              handleDemoLogin();
            }
          }
        });
      } catch {
        if (showDirectTokenInput) {
          setShowTokenMode(true);
        } else {
          handleDemoLogin();
        }
      }
    } else {
      if (showDirectTokenInput) {
        setShowTokenMode(true);
      } else {
        handleDemoLogin();
      }
    }
  };

  // Demo user offline login
  const handleDemoLogin = () => {
    const isMockAdmin = mode === 'admin';
    const mockUser = {
      id: 999,
      email: isMockAdmin ? 'admin@bichackathon.org' : 'participant@bichackathon.org',
      first_name: isMockAdmin ? 'Admin' : 'Alex',
      last_name: isMockAdmin ? 'Staff' : 'Dev',
      role: isMockAdmin ? 'Administrator' : 'Participant',
      groups: isMockAdmin ? [0] : [1],
      is_staff: isMockAdmin,
      is_demo: true,
    };
    api.users.login({ email: mockUser.email, password: 'demopassword' }).catch(() => {});
    // Dispatch events
    window.dispatchEvent(new CustomEvent('bic_user_updated', { detail: mockUser }));
    window.dispatchEvent(new CustomEvent('bic_auth_login', { detail: { user: mockUser } }));
    setSuccessMsg(`Simulated demo sign-in as ${mockUser.email}`);
    if (onSuccess) onSuccess(mockUser, { user: mockUser });
  };

  return (
    <div className={`w-full flex flex-col items-center gap-3 ${className}`}>
      {/* Messages */}
      {errorMsg && (
        <div className="w-full p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block">Authentication Error</span>
            <span className="leading-tight">{errorMsg}</span>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="w-full p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {/* Main Google Action Buttons */}
      <div className="w-full flex flex-col items-center gap-2">
        {/* Hidden or real GIS rendered button */}
        <div
          ref={googleBtnRef}
          className={`w-full flex justify-center ${gisLoaded ? 'block' : 'hidden'}`}
          style={{ minHeight: '40px' }}
        />

        {/* Custom Fallback / Primary Button if GIS not yet loaded or preferred */}
        {!gisLoaded && (
          <button
            type="button"
            disabled={loading}
            onClick={handleCustomGoogleClick}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-semibold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2.5 active:scale-[0.99] disabled:opacity-70"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-slate-300 border-t-coral-500 rounded-full animate-spin" />
            ) : (
              <GoogleIcon className="w-4 h-4" />
            )}
            <span>{loading ? 'Verifying with Google...' : text}</span>
          </button>
        )}
      </div>

      {/* Manual Token Input / Dev Mode Toggle */}
      {showDirectTokenInput && (
        <div className="w-full pt-1">
          <button
            type="button"
            onClick={() => setShowTokenMode(!showTokenMode)}
            className="text-[11px] font-mono text-slate-600 hover:text-coral-600 transition-colors flex items-center gap-1 mx-auto"
          >
            <KeyRound className="w-3 h-3" />
            <span>{showTokenMode ? 'Hide direct token input' : 'Direct token payload { "token": "string" }'}</span>
          </button>

          {showTokenMode && (
            <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-2.5 animate-fade-in">
              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-coral-600" />
                  POST /api/v1/users/google/
                </span>
                <span className="font-mono text-[10px] text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                  {'{ "token": "string" }'}
                </span>
              </div>

              <textarea
                rows={3}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder='Paste raw Google ID token or { "token": "eyJhbGciOi..." }'
                className="w-full p-2 text-xs font-mono rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-coral-500 focus:ring-1 focus:ring-coral-500/20"
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setTokenInput(
                      JSON.stringify({ token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMyJ9.example_sample_token_data' }, null, 2)
                    )
                  }
                  className="text-[10px] font-mono text-slate-600 hover:text-slate-800 underline"
                >
                  Insert Sample JSON
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDemoLogin}
                    className="px-2.5 py-1 text-[11px] font-medium text-slate-600 bg-white hover:bg-slate-100 rounded-md border border-slate-200 transition"
                  >
                    Simulate Demo
                  </button>

                  <button
                    type="button"
                    disabled={loading || !tokenInput.trim()}
                    onClick={() => processGoogleToken(tokenInput)}
                    className="px-3 py-1 text-xs font-semibold text-white bg-coral-500 hover:bg-coral-600 rounded-md transition shadow-xs flex items-center gap-1 disabled:opacity-50"
                  >
                    <span>Send Token</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
