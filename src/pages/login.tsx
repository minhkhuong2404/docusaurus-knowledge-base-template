import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import { useLocation } from '@docusaurus/router';
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  applyActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset,
  User,
} from 'firebase/auth';
import { auth, firebaseConfig } from '../config/firebase';
import FirebaseGoogleLoginButton from '../components/FirebaseGoogleLoginButton';
import {
  sendOtpToUserEmail,
  verifyUserEmailOtp,
  checkUserEmailVerification,
  isUserPermanentlyVerified,
  markUserPermanentlyVerified,
} from '../services/emailVerificationService';

function formatFirebaseError(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please try again.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    default:
      return 'Authentication failed. Please check your details and try again.';
  }
}

// @ts-ignore
export default function Login(): React.ReactNode {
  const [mode, setMode] = useState<'signin' | 'register' | 'forgot'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [loggedInState, setLoggedInState] = useState<'checking' | 'logged_in' | 'logged_out'>('checking');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [returnTo, setReturnTo] = useState('/');
  const location = useLocation();

  // Registration verification step state
  const [showRegisterOtp, setShowRegisterOtp] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<User | null>(null);
  const [currentOtpCode, setCurrentOtpCode] = useState<string>('');
  const [showManualOtpInput, setShowManualOtpInput] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpInfoMsg, setOtpInfoMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(60);

  // Action code handler states (for in-app email verification and password reset via custom action URL)
  const [actionCodeStatus, setActionCodeStatus] = useState<
    null | 'verifying_email' | 'verify_email_success' | 'verify_email_error' | 'reset_password_prompt' | 'reset_password_success' | 'reset_password_error'
  >(null);
  const [actionCodeOob, setActionCodeOob] = useState('');
  const [resetEmailTarget, setResetEmailTarget] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0 && showRegisterOtp) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown, showRegisterOtp]);

  // Periodic polling to detect when the user clicks the verification link in their email
  useEffect(() => {
    let pollInterval: any;
    if (showRegisterOtp && registeredUser) {
      pollInterval = setInterval(async () => {
        try {
          const res = await checkUserEmailVerification(registeredUser);
          if (res.verified || isUserPermanentlyVerified(registeredUser)) {
            clearInterval(pollInterval);
            markUserPermanentlyVerified(registeredUser);
            setSuccessMsg('🎉 Email verified successfully! Redirecting...');
            setTimeout(() => {
              window.location.href = returnTo;
            }, 1000);
          }
        } catch {
          // Ignore periodic background check errors
        }
      }, 3500);
    }
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [showRegisterOtp, registeredUser, returnTo]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const redirectUrl = params.get('returnTo');
    if (redirectUrl) {
      setReturnTo(redirectUrl);
    }

    const urlMode = params.get('mode');
    const oobCode = params.get('oobCode');

    if (urlMode === 'verifyEmail' && oobCode) {
      setActionCodeStatus('verifying_email');
      setActionCodeOob(oobCode);
      applyActionCode(auth, oobCode)
        .then(() => {
          setActionCodeStatus('verify_email_success');
          setSuccessMsg('🎉 Email verified successfully! Your account is active.');
          if (auth.currentUser) {
            markUserPermanentlyVerified(auth.currentUser);
          }
        })
        .catch((err: any) => {
          setActionCodeStatus('verify_email_error');
          setError(err?.message || 'This verification link is invalid or has expired.');
        });
    } else if (urlMode === 'resetPassword' && oobCode) {
      setActionCodeStatus('reset_password_prompt');
      setActionCodeOob(oobCode);
      verifyPasswordResetCode(auth, oobCode)
        .then((emailFound) => {
          setResetEmailTarget(emailFound);
        })
        .catch((err: any) => {
          setActionCodeStatus('reset_password_error');
          setError(err?.message || 'This password reset link is invalid or has expired.');
        });
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setLoggedInState('logged_in');
        if (isUserPermanentlyVerified(user)) {
          markUserPermanentlyVerified(user);
        }
        localStorage.setItem('premium_session_state', 'logged_in');
        sessionStorage.setItem('premium_session_state', 'logged_in');
      } else {
        const localSession = localStorage.getItem('premium_session_state') || sessionStorage.getItem('premium_session_state');
        if (localSession === 'logged_in' && auth.currentUser) {
          setLoggedInState('logged_in');
        } else {
          setLoggedInState('logged_out');
        }
      }
    });

    return () => unsubscribe();
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (mode === 'forgot') {
        if (!email.trim()) {
          setError('Please enter your email address.');
          setLoading(false);
          return;
        }
        const actionCodeSettings = {
          url: typeof window !== 'undefined' ? `${window.location.origin}/login` : 'https://luminhkhuong.dev/login',
          handleCodeInApp: false,
        };
        try {
          await sendPasswordResetEmail(auth, email.trim(), actionCodeSettings);
        } catch {
          await sendPasswordResetEmail(auth, email.trim());
        }
        setSuccessMsg(`Password reset email sent to ${email}. Check your inbox!`);
        setLoading(false);
        return;
      }

      if (mode === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;
        if (name.trim() && newUser) {
          await updateProfile(newUser, { displayName: name.trim() });
        }
        sessionStorage.setItem('premium_session_state', 'logged_in');
        setRegisteredUser(newUser);

        // If already verified previously (or bypass active), skip verification screen entirely
        if (isUserPermanentlyVerified(newUser)) {
          markUserPermanentlyVerified(newUser);
          window.location.href = returnTo;
          return;
        }

        // Dispatch verification email
        try {
          const res = await sendOtpToUserEmail(newUser);
          if (res.otpCode) {
            setCurrentOtpCode(res.otpCode);
          }
          if (res.success) {
            setOtpInfoMsg(res.message);
          } else {
            setOtpError(res.message);
          }
        } catch (otpErr: any) {
          console.warn('Initial verification email send error:', otpErr);
          setOtpError(otpErr?.message || 'Failed to dispatch verification email.');
        }

        setShowRegisterOtp(true);
        setResendCooldown(60);
      } else {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        if (userCred.user && isUserPermanentlyVerified(userCred.user)) {
          markUserPermanentlyVerified(userCred.user);
        }
        sessionStorage.setItem('premium_session_state', 'logged_in');
        window.location.href = returnTo;
      }
    } catch (err: any) {
      setError(formatFirebaseError(err.code || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickBypassVerify = async () => {
    if (!registeredUser) return;
    setOtpLoading(true);
    try {
      if (currentOtpCode) {
        await verifyUserEmailOtp(registeredUser, currentOtpCode);
      }
      markUserPermanentlyVerified(registeredUser);
      setSuccessMsg('🎉 Account verified permanently! Redirecting...');
      setTimeout(() => {
        window.location.href = returnTo;
      }, 800);
    } catch (err: any) {
      markUserPermanentlyVerified(registeredUser);
      window.location.href = returnTo;
    } finally {
      setOtpLoading(false);
    }
  };

  const handleManualCheckStatus = async () => {
    if (!registeredUser) return;
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await checkUserEmailVerification(registeredUser);
      if (res.verified || isUserPermanentlyVerified(registeredUser)) {
        markUserPermanentlyVerified(registeredUser);
        setSuccessMsg('🎉 Email verified successfully! Redirecting...');
        setTimeout(() => {
          window.location.href = returnTo;
        }, 1000);
      } else {
        setOtpError(res.message);
      }
    } catch (err: any) {
      setOtpError(err?.message || 'Verification check failed. Please click the link in your email.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyRegisterOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registeredUser) return;
    const fullCode = otpDigits.join('');
    if (fullCode.length !== 6) {
      setOtpError('Please enter all 6 digits of your OTP code.');
      return;
    }

    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await verifyUserEmailOtp(registeredUser, fullCode);
      if (res.success) {
        markUserPermanentlyVerified(registeredUser);
        setSuccessMsg('Email verified successfully! Redirecting...');
        setTimeout(() => {
          window.location.href = returnTo;
        }, 1000);
      } else {
        setOtpError(res.message);
      }
    } catch (err: any) {
      setOtpError(err?.message || 'Verification failed. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendRegisterOtp = async () => {
    if (!registeredUser) return;
    setOtpLoading(true);
    setOtpError('');
    setOtpInfoMsg('');
    try {
      const res = await sendOtpToUserEmail(registeredUser);
      if (res.otpCode) {
        setCurrentOtpCode(res.otpCode);
      }
      if (res.success) {
        setResendCooldown(60);
        setOtpInfoMsg(res.message);
      } else {
        setOtpError(res.message);
        if (res.cooldownRemaining) setResendCooldown(res.cooldownRemaining);
      }
    } catch (err: any) {
      setOtpError(err?.message || 'Failed to resend verification email.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    if (value && index < 5) {
      const nextInput = document.getElementById(`reg-otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`reg-otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleGoogleSuccess = (_user: User) => {
    markUserPermanentlyVerified(_user);
    sessionStorage.setItem('premium_session_state', 'logged_in');
    window.location.href = returnTo;
  };

  const handleGoogleError = (err: any) => {
    console.error('Google Sign-In Error:', err);
    if (err?.code === 'auth/api-key-not-valid' || err?.code === 'auth/invalid-api-key' || firebaseConfig.apiKey === 'YOUR_FIREBASE_API_KEY') {
      setError('Firebase API Key is missing or invalid. Please add your real Firebase Config keys to src/config/firebase.ts or .env.');
    } else if (err?.code === 'auth/unauthorized-domain') {
      setError('Domain not authorized! Please add localhost / your website domain to Firebase Console -> Authentication -> Settings -> Authorized Domains.');
    } else if (err?.code === 'auth/popup-closed-by-user') {
      setError('Google sign-in popup was closed before completing sign-in.');
    } else if (err?.code === 'auth/operation-not-allowed') {
      setError('Google sign-in is disabled in your Firebase Console. Please turn ON "Google" under Firebase Console -> Authentication -> Sign-in method.');
    } else {
      setError(`Google login failed (${err?.code || 'error'}): ${err?.message || 'Please try again.'}`);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }

    setResetSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      await confirmPasswordReset(auth, actionCodeOob, newPassword);
      setActionCodeStatus('reset_password_success');
      setSuccessMsg('🎉 Your password has been reset successfully! You can now sign in.');
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setResetSubmitting(false);
    }
  };

  return (
    // @ts-ignore
    <Layout title={loggedInState === 'logged_in' && currentUser ? 'My Account' : mode === 'signin' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Reset Password'} description="Sign in or register to sync your reading progress">
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '65vh', padding: '1.5rem 1rem' }}>
        <div style={{ padding: '2.5rem', border: '1px solid var(--ifm-color-emphasis-200)', borderRadius: '16px', maxWidth: '460px', width: '100%', backgroundColor: 'var(--ifm-background-surface-color)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
          
          {/* ACTION CODE: INCOMING EMAIL ACTION HANDLER SCREENS */}
          {actionCodeStatus === 'verifying_email' ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'spin 1.5s linear infinite' }}>⏳</div>
              <h2 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>Verifying Your Email Address...</h2>
              <p style={{ color: 'var(--ifm-color-emphasis-600)', fontSize: '0.9rem' }}>Please wait a moment while we activate your account.</p>
            </div>
          ) : actionCodeStatus === 'verify_email_success' ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
              <h2 style={{ fontSize: '1.4rem', color: '#34d399', marginBottom: '0.5rem' }}>Email Verified Successfully!</h2>
              <p style={{ color: 'var(--ifm-color-emphasis-600)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Your account is fully verified. You now have complete access to the Engineering Knowledge Base!
              </p>
              <button
                type="button"
                onClick={() => {
                  setActionCodeStatus(null);
                  window.location.href = returnTo;
                }}
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  backgroundColor: 'var(--ifm-color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                }}
              >
                Continue to Knowledge Base 🚀
              </button>
            </div>
          ) : actionCodeStatus === 'verify_email_error' ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⚠️</div>
              <h2 style={{ fontSize: '1.35rem', color: '#f87171', marginBottom: '0.5rem' }}>Verification Link Expired</h2>
              <p style={{ color: 'var(--ifm-color-emphasis-600)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                {error || 'This verification link is invalid or has already been used.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setActionCodeStatus(null);
                  setMode('signin');
                }}
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  backgroundColor: 'var(--ifm-color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                }}
              >
                Go to Sign In
              </button>
            </div>
          ) : actionCodeStatus === 'reset_password_prompt' ? (
            <div>
              <div style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔑</div>
              <h2 style={{ textAlign: 'center', fontSize: '1.35rem', marginBottom: '0.35rem' }}>Set New Password</h2>
              {resetEmailTarget && (
                <p style={{ textAlign: 'center', color: 'var(--ifm-color-emphasis-600)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
                  Resetting password for <strong>{resetEmailTarget}</strong>
                </p>
              )}

              {error && (
                <div style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--ifm-color-danger)', color: 'var(--ifm-color-danger)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleResetPasswordSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>New Password</label>
                  <input
                    type="password"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-300)', backgroundColor: 'var(--ifm-color-emphasis-100)', color: 'var(--ifm-font-color-base)', outline: 'none' }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Re-type your new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-300)', backgroundColor: 'var(--ifm-color-emphasis-100)', color: 'var(--ifm-font-color-base)', outline: 'none' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={resetSubmitting}
                  style={{ width: '100%', padding: '0.8rem', backgroundColor: 'var(--ifm-color-primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.95rem', cursor: resetSubmitting ? 'not-allowed' : 'pointer', opacity: resetSubmitting ? 0.7 : 1 }}
                >
                  {resetSubmitting ? 'Updating Password...' : 'Save New Password 🔒'}
                </button>
              </form>
            </div>
          ) : actionCodeStatus === 'reset_password_success' ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
              <h2 style={{ fontSize: '1.4rem', color: '#34d399', marginBottom: '0.5rem' }}>Password Reset Complete!</h2>
              <p style={{ color: 'var(--ifm-color-emphasis-600)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Your password has been securely updated. You can now sign in with your new credentials.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActionCodeStatus(null);
                  setMode('signin');
                }}
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  backgroundColor: 'var(--ifm-color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                }}
              >
                Sign In Now 🔑
              </button>
            </div>
          ) : actionCodeStatus === 'reset_password_error' ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⚠️</div>
              <h2 style={{ fontSize: '1.35rem', color: '#f87171', marginBottom: '0.5rem' }}>Reset Link Expired</h2>
              <p style={{ color: 'var(--ifm-color-emphasis-600)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                {error || 'This password reset link is invalid or has already been used.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setActionCodeStatus(null);
                  setMode('forgot');
                }}
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  backgroundColor: 'var(--ifm-color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                }}
              >
                Request a New Reset Link 🔄
              </button>
            </div>
          ) : loggedInState === 'logged_in' && currentUser ? (
            /* 1. ALREADY LOGGED IN VIEW */
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>👋</div>
              <h2 style={{ fontSize: '1.4rem', marginBottom: '0.4rem' }}>
                You're Already Signed In!
              </h2>
              <p style={{ color: 'var(--ifm-color-emphasis-600)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Signed in as <strong>{currentUser.email || currentUser.displayName || 'Knowledge Base User'}</strong>
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => { window.location.href = returnTo; }}
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    backgroundColor: 'var(--ifm-color-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s',
                  }}
                >
                  Continue to Knowledge Base 🚀
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await auth.signOut();
                    localStorage.removeItem('premium_session_state');
                    sessionStorage.removeItem('premium_session_state');
                    setLoggedInState('logged_out');
                    setCurrentUser(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    background: 'transparent',
                    border: '1px solid var(--ifm-color-emphasis-300)',
                    color: 'var(--ifm-font-color-base)',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Sign Out & Switch Account
                </button>
              </div>
            </div>
          ) : showRegisterOtp ? (
            /* 2. REGISTRATION EMAIL VERIFICATION SCREEN */
            <div>
              <div style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '0.5rem' }}>📧</div>
              <h2 style={{ textAlign: 'center', marginBottom: '0.35rem', fontSize: '1.4rem' }}>
                Verify Your Email Address
              </h2>
              <p style={{ textAlign: 'center', color: 'var(--ifm-color-emphasis-600)', marginBottom: '1rem', fontSize: '0.875rem', lineHeight: 1.45 }}>
                We dispatched a verification email to <strong>{registeredUser?.email}</strong>.
              </p>

              {/* Status Instructions Card */}
              <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '10px', padding: '0.85rem', marginBottom: '1.25rem', fontSize: '0.82rem', lineHeight: 1.45, color: 'var(--ifm-font-color-base)' }}>
                <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📬</span> Email Verification Sent:
                </div>
                1. Check your email inbox (and <strong>Spam / Junk / Promotions</strong> folder).<br />
                2. Click the verification link in the email from <strong>Firebase</strong>.<br />
                3. Or use the <strong>Instant In-App Fallback</strong> below if email delivery is delayed.
              </div>

              {/* In-App Direct Fallback Code Card */}
              {currentOtpCode && (
                <div style={{ backgroundColor: 'rgba(52, 211, 153, 0.08)', border: '1.5px dashed #34d399', borderRadius: '10px', padding: '0.85rem', marginBottom: '1.25rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 700, marginBottom: '4px' }}>
                    ⚡ Email Delayed? Use In-App Verification Code:
                  </div>
                  <div style={{ fontSize: '1.5rem', letterSpacing: '6px', fontWeight: 800, color: '#34d399', fontFamily: 'monospace', margin: '6px 0' }}>
                    {currentOtpCode}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const digits = currentOtpCode.split('').slice(0, 6);
                        setOtpDigits(digits);
                        setShowManualOtpInput(true);
                      }}
                      style={{
                        backgroundColor: '#34d399',
                        color: '#000000',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '5px 12px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Auto-Fill Code ✍️
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickBypassVerify}
                      disabled={otpLoading}
                      style={{
                        backgroundColor: 'rgba(52, 211, 153, 0.2)',
                        color: '#34d399',
                        border: '1px solid #34d399',
                        borderRadius: '6px',
                        padding: '5px 12px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: otpLoading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      1-Click Verify & Continue 🚀
                    </button>
                  </div>
                </div>
              )}

              {otpInfoMsg && !currentOtpCode && (
                <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', padding: '0.65rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.825rem', textAlign: 'center' }}>
                  {otpInfoMsg}
                </div>
              )}

              {otpError && (
                <div style={{ backgroundColor: 'var(--ifm-color-danger-contrast-background)', color: 'var(--ifm-color-danger-contrast-foreground)', padding: '0.65rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.825rem', textAlign: 'center' }}>
                  {otpError}
                </div>
              )}

              {successMsg && (
                <div style={{ backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#34d399', padding: '0.65rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.825rem', textAlign: 'center', fontWeight: 600 }}>
                  {successMsg}
                </div>
              )}

              {/* Primary Action: Check Verification Status */}
              <button
                type="button"
                onClick={handleManualCheckStatus}
                disabled={otpLoading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: 'var(--ifm-color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: otpLoading ? 'not-allowed' : 'pointer',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {otpLoading ? 'Checking Status...' : 'I\'ve Clicked The Link (Verify & Continue) 🚀'}
              </button>

              {/* Toggle manual 6-digit OTP code entry */}
              <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowManualOtpInput(!showManualOtpInput)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--ifm-color-emphasis-700)',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: '2px',
                  }}
                >
                  {showManualOtpInput ? 'Hide 6-digit code entry' : 'Have a 6-digit code? Enter code instead'}
                </button>
              </div>

              {showManualOtpInput && (
                <form onSubmit={handleVerifyRegisterOtp} style={{ marginBottom: '1rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--ifm-color-emphasis-300)' }}>
                  <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--ifm-color-emphasis-600)', marginBottom: '0.75rem' }}>
                    Enter the 6-digit numeric OTP code:
                  </p>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '0.75rem' }}>
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`reg-otp-${idx}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        style={{
                          width: '42px',
                          height: '48px',
                          textAlign: 'center',
                          fontSize: '1.3rem',
                          fontWeight: 800,
                          borderRadius: '8px',
                          border: '1.5px solid var(--ifm-color-primary)',
                          backgroundColor: 'var(--ifm-color-emphasis-100)',
                          color: 'var(--ifm-font-color-base)',
                          outline: 'none',
                        }}
                      />
                    ))}
                  </div>
                  <button
                    type="submit"
                    disabled={otpLoading || otpDigits.join('').length !== 6}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      backgroundColor: 'var(--ifm-color-emphasis-300)',
                      color: 'var(--ifm-font-color-base)',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 700,
                      cursor: otpLoading || otpDigits.join('').length !== 6 ? 'not-allowed' : 'pointer',
                      fontSize: '0.825rem',
                    }}
                  >
                    Submit 6-Digit Code
                  </button>
                </form>
              )}

              {/* Bottom Actions: Resend and Skip */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--ifm-color-emphasis-200)' }}>
                <button
                  type="button"
                  onClick={handleResendRegisterOtp}
                  disabled={resendCooldown > 0 || otpLoading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: resendCooldown > 0 ? 'var(--ifm-color-emphasis-500)' : 'var(--ifm-color-primary)',
                    fontSize: '0.82rem',
                    cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                    padding: 0,
                    fontWeight: 600,
                  }}
                >
                  {resendCooldown > 0 ? `Resend email (${resendCooldown}s)` : '✉️ Resend Verification Email'}
                </button>

                <button
                  type="button"
                  onClick={() => { window.location.href = returnTo; }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--ifm-color-emphasis-600)',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  Skip for now ➔
                </button>
              </div>
            </div>
          ) : (
            /* 3. SIGN IN / CREATE ACCOUNT / FORGOT PASSWORD FORM */
            <>
              {/* Segmented Mode Selector */}
              {mode !== 'forgot' ? (
                <div style={{ display: 'flex', background: 'var(--ifm-color-emphasis-100)', borderRadius: '8px', padding: '4px', marginBottom: '1.5rem' }}>
                  <button
                    type="button"
                    onClick={() => { setMode('signin'); setError(''); setSuccessMsg(''); }}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      backgroundColor: mode === 'signin' ? 'var(--ifm-background-surface-color)' : 'transparent',
                      color: mode === 'signin' ? 'var(--ifm-color-primary)' : 'var(--ifm-color-emphasis-700)',
                      boxShadow: mode === 'signin' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      backgroundColor: mode === 'register' ? 'var(--ifm-background-surface-color)' : 'transparent',
                      color: mode === 'register' ? 'var(--ifm-color-primary)' : 'var(--ifm-color-emphasis-700)',
                      boxShadow: mode === 'register' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Create Account
                  </button>
                </div>
              ) : (
                <div style={{ marginBottom: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => { setMode('signin'); setError(''); setSuccessMsg(''); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--ifm-color-primary)',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      padding: 0,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    ← Back to Sign In
                  </button>
                </div>
              )}

              <h1 style={{ textAlign: 'center', marginBottom: '0.35rem', fontSize: '1.5rem' }}>
                {mode === 'signin'
                  ? 'Welcome Back 🚀'
                  : mode === 'register'
                  ? 'Join Knowledge Base 🚀'
                  : 'Reset Your Password 🔑'}
              </h1>
              <p style={{ textAlign: 'center', color: 'var(--ifm-color-emphasis-600)', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
                {mode === 'signin'
                  ? 'Sign in to sync your progress, scores, and mission rank.'
                  : mode === 'register'
                  ? 'Create an account with email verification and streak sync.'
                  : 'Enter your email address and we will send you a link to reset your password.'}
              </p>

              {/* Google Sign-In button for signin / register */}
              {mode !== 'forgot' && (
                <>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <FirebaseGoogleLoginButton
                      mode={mode === 'signin' ? 'signin' : 'register'}
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0', color: 'var(--ifm-color-emphasis-500)', fontSize: '0.8rem' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--ifm-color-emphasis-300)' }} />
                    <span style={{ padding: '0 10px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>OR EMAIL</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--ifm-color-emphasis-300)' }} />
                  </div>
                </>
              )}

              <form onSubmit={handleSubmit}>
                {mode === 'register' && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="name" style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem' }}>Full Name</label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.7rem',
                        borderRadius: '6px',
                        border: '1px solid var(--ifm-color-emphasis-300)',
                        backgroundColor: 'var(--ifm-color-emphasis-100)',
                        color: 'var(--ifm-font-color-base)',
                      }}
                      placeholder="John Doe"
                    />
                  </div>
                )}

                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="email" style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem' }}>Email Address</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.7rem',
                      borderRadius: '6px',
                      border: '1px solid var(--ifm-color-emphasis-300)',
                      backgroundColor: 'var(--ifm-color-emphasis-100)',
                      color: 'var(--ifm-font-color-base)',
                    }}
                    placeholder="you@example.com"
                    required
                  />
                </div>

                {mode !== 'forgot' && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <label htmlFor="password" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Password</label>
                      {mode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => { setMode('forgot'); setError(''); setSuccessMsg(''); }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--ifm-color-primary)',
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            padding: 0,
                            fontWeight: 600,
                          }}
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.7rem',
                        borderRadius: '6px',
                        border: '1px solid var(--ifm-color-emphasis-300)',
                        backgroundColor: 'var(--ifm-color-emphasis-100)',
                        color: 'var(--ifm-font-color-base)',
                      }}
                      placeholder={mode === 'register' ? 'At least 6 characters' : 'Enter your password'}
                      required
                    />
                  </div>
                )}

                {error && (
                  <div style={{ backgroundColor: 'var(--ifm-color-danger-contrast-background)', color: 'var(--ifm-color-danger-contrast-foreground)', padding: '0.75rem', borderRadius: '6px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                    {error}
                  </div>
                )}

                {successMsg && (
                  <div style={{ backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#34d399', padding: '0.75rem', borderRadius: '6px', marginBottom: '1.25rem', fontSize: '0.85rem', fontWeight: 600 }}>
                    {successMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: 'var(--ifm-color-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: loading ? 0.7 : 1,
                    marginBottom: mode === 'forgot' ? '0.75rem' : 0,
                  }}
                >
                  {loading
                    ? mode === 'register'
                      ? 'Creating Account...'
                      : mode === 'forgot'
                      ? 'Sending Reset Link...'
                      : 'Signing In...'
                    : mode === 'register'
                    ? 'Create Account & Verify'
                    : mode === 'forgot'
                    ? 'Send Password Reset Link ✉️'
                    : 'Sign In'}
                </button>

                {mode === 'signin' && (
                  <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.82rem', color: 'var(--ifm-color-emphasis-600)' }}>
                    Forgot your password?{' '}
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setError(''); setSuccessMsg(''); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--ifm-color-primary)',
                        cursor: 'pointer',
                        padding: 0,
                        fontWeight: 600,
                        textDecoration: 'underline',
                      }}
                    >
                      Reset it here
                    </button>
                  </div>
                )}

                {mode === 'forgot' && (
                  <button
                    type="button"
                    onClick={() => { setMode('signin'); setError(''); setSuccessMsg(''); }}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      background: 'transparent',
                      border: '1px solid var(--ifm-color-emphasis-300)',
                      color: 'var(--ifm-font-color-base)',
                      borderRadius: '6px',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    Back to Sign In
                  </button>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
