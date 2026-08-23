import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  User,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  linkWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../../config/firebase';
import { sendOtpToUserEmail, verifyUserEmailOtp } from '../../services/emailVerificationService';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  isSuperAdmin?: boolean;
  isAdmin?: boolean;
  isPremium?: boolean;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  currentUser,
  isSuperAdmin,
  isAdmin,
  isPremium,
}: UserProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Profile Edit state
  const [displayName, setDisplayName] = useState(currentUser.displayName || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Auth Provider detection
  const providers = currentUser.providerData.map((p) => p.providerId);
  const hasGoogle = providers.includes('google.com');
  const hasPassword = providers.includes('password');

  // Add / Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password Reset Email state
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // OTP Email Verification state
  const [showOtpView, setShowOtpView] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMsg, setOtpMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isEmailVerified, setIsEmailVerified] = useState(currentUser.emailVerified);

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // Handle Display Name Update
  const handleUpdateDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setProfileMsg({ type: 'error', text: 'Display name cannot be blank.' });
      return;
    }
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      await updateProfile(currentUser, { displayName: displayName.trim() });
      setIsEditingName(false);
      setProfileMsg({ type: 'success', text: 'Profile name updated successfully!' });
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err?.message || 'Failed to update name.' });
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Add Password (for Google users)
  const handleAddPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setPasswordLoading(true);
    try {
      const cred = EmailAuthProvider.credential(currentUser.email!, newPassword);
      await linkWithCredential(currentUser, cred);
      setPasswordMsg({
        type: 'success',
        text: 'Password added! You can now sign in with both Google and your Email + Password.',
      });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      if (err?.code === 'auth/credential-already-in-use') {
        // Fallback to updatePassword if credential is already attached
        try {
          await updatePassword(currentUser, newPassword);
          setPasswordMsg({ type: 'success', text: 'Password set successfully!' });
          setNewPassword('');
          setConfirmPassword('');
        } catch (innerErr: any) {
          setPasswordMsg({ type: 'error', text: innerErr?.message || 'Failed to set password.' });
        }
      } else {
        setPasswordMsg({ type: 'error', text: err?.message || 'Failed to link password.' });
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle Update Password (for Email users)
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!currentPassword) {
      setPasswordMsg({ type: 'error', text: 'Please enter your current password.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPasswordLoading(true);
    try {
      // Re-authenticate first to ensure session freshness
      const cred = EmailAuthProvider.credential(currentUser.email!, currentPassword);
      await reauthenticateWithCredential(currentUser, cred);
      await updatePassword(currentUser, newPassword);
      setPasswordMsg({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      if (err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        setPasswordMsg({ type: 'error', text: 'Current password is incorrect.' });
      } else {
        setPasswordMsg({ type: 'error', text: err?.message || 'Failed to update password.' });
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle Send Password Reset Email
  const handleSendResetEmail = async () => {
    if (!currentUser.email) return;
    setResetLoading(true);
    setPasswordMsg(null);
    try {
      await sendPasswordResetEmail(auth, currentUser.email);
      setResetEmailSent(true);
      setPasswordMsg({
        type: 'success',
        text: `Password reset link sent to ${currentUser.email}. Please check your inbox.`,
      });
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err?.message || 'Failed to send reset email.' });
    } finally {
      setResetLoading(false);
    }
  };

  // Handle Trigger OTP Email
  const handleStartOtpFlow = async () => {
    setShowOtpView(true);
    setOtpMsg(null);
    setOtpDigits(['', '', '', '', '', '']);
    setOtpLoading(true);
    try {
      const res = await sendOtpToUserEmail(currentUser);
      if (res.success) {
        setResendCooldown(60);
        setOtpMsg({ type: 'success', text: res.message });
      } else {
        setOtpMsg({ type: 'error', text: res.message });
        if (res.cooldownRemaining) {
          setResendCooldown(res.cooldownRemaining);
        }
      }
    } catch (err: any) {
      setOtpMsg({ type: 'error', text: err?.message || 'Failed to initiate OTP code.' });
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle OTP Submit
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = otpDigits.join('');
    if (fullCode.length !== 6) {
      setOtpMsg({ type: 'error', text: 'Please enter all 6 digits of your OTP code.' });
      return;
    }

    setOtpLoading(true);
    setOtpMsg(null);
    try {
      const res = await verifyUserEmailOtp(currentUser, fullCode);
      if (res.success) {
        setIsEmailVerified(true);
        setOtpMsg({ type: 'success', text: res.message });
        setTimeout(() => {
          setShowOtpView(false);
        }, 1800);
      } else {
        setOtpMsg({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setOtpMsg({ type: 'error', text: err?.message || 'OTP verification failed.' });
    } finally {
      setOtpLoading(false);
    }
  };

  // Helper for 6-digit input auto-tabbing
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-digit-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-digit-${index - 1}`);
      prevInput?.focus();
    }
  };

  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999999,
        animation: 'fadeInDropdown 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#0d1117',
          border: '1.5px solid rgba(56, 189, 248, 0.4)',
          borderRadius: '16px',
          padding: '1.75rem',
          maxWidth: '520px',
          width: '92%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 30px rgba(56, 189, 248, 0.25)',
          color: '#ffffff',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>⚙️</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#ffffff', fontWeight: 800 }}>
                Account & Security Settings
              </h2>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Manage your credentials, password, and email verification</span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(255, 255, 255, 0.05)', padding: '4px', borderRadius: '10px', marginBottom: '1.25rem' }}>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              background: activeTab === 'profile' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              color: activeTab === 'profile' ? '#38bdf8' : '#94a3b8',
              borderBottom: activeTab === 'profile' ? '2px solid #38bdf8' : 'none',
              transition: 'all 0.2s',
            }}
          >
            👤 Profile & Email
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              background: activeTab === 'security' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              color: activeTab === 'security' ? '#38bdf8' : '#94a3b8',
              borderBottom: activeTab === 'security' ? '2px solid #38bdf8' : 'none',
              transition: 'all 0.2s',
            }}
          >
            🔐 Password & Auth
          </button>
        </div>

        {/* TAB 1: PROFILE & EMAIL VERIFICATION */}
        {activeTab === 'profile' && (
          <div>
            {/* User Details Card */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '1rem',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: '1.25rem',
              }}
            >
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'User'}
                  style={{ width: '54px', height: '54px', borderRadius: '50%', border: '2px solid #38bdf8', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                  }}
                >
                  {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#ffffff' }}>
                    {currentUser.displayName || 'Learner'}
                  </span>
                  {isSuperAdmin ? (
                    <span style={{ fontSize: '10px', background: '#ef4444', color: '#fff', padding: '2px 6px', borderRadius: '6px', fontWeight: 800 }}>
                      Super Admin
                    </span>
                  ) : isAdmin ? (
                    <span style={{ fontSize: '10px', background: '#f59e0b', color: '#fff', padding: '2px 6px', borderRadius: '6px', fontWeight: 800 }}>
                      Admin
                    </span>
                  ) : isPremium ? (
                    <span style={{ fontSize: '10px', background: '#38bdf8', color: '#000', padding: '2px 6px', borderRadius: '6px', fontWeight: 800 }}>
                      Premium
                    </span>
                  ) : null}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '2px' }}>
                  {currentUser.email}
                </div>
              </div>
            </div>

            {/* Email Verification Status & OTP Trigger */}
            <div
              style={{
                padding: '1rem',
                borderRadius: '12px',
                background: isEmailVerified ? 'rgba(52, 211, 153, 0.08)' : 'rgba(251, 146, 60, 0.08)',
                border: isEmailVerified ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(251, 146, 60, 0.3)',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isEmailVerified ? 0 : '10px' }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: isEmailVerified ? '#34d399' : '#fb923c', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isEmailVerified ? '✅ Email Address Verified' : '⚠️ Email Not Verified'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                    {isEmailVerified
                      ? 'Your email is confirmed. You will receive critical security alerts and updates.'
                      : 'Verify your email via a 6-digit OTP code to protect your account.'}
                  </div>
                </div>

                {!isEmailVerified && !showOtpView && (
                  <button
                    type="button"
                    onClick={handleStartOtpFlow}
                    disabled={otpLoading}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(249, 115, 22, 0.35)',
                    }}
                  >
                    {otpLoading ? 'Sending...' : 'Verify Email (OTP)'}
                  </button>
                )}
              </div>

              {/* OTP Verification Sub-View */}
              {showOtpView && !isEmailVerified && (
                <form onSubmit={handleVerifyOtp} style={{ marginTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '12px' }}>
                  <div style={{ fontSize: '0.82rem', color: '#e2e8f0', marginBottom: '8px', fontWeight: 600 }}>
                    Enter the 6-digit OTP code sent to <strong>{currentUser.email}</strong>:
                  </div>

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '12px' }}>
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-digit-${idx}`}
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
                          border: '1.5px solid rgba(56, 189, 248, 0.5)',
                          background: '#161b22',
                          color: '#ffffff',
                          outline: 'none',
                        }}
                      />
                    ))}
                  </div>

                  {otpMsg && (
                    <div
                      style={{
                        fontSize: '0.8rem',
                        color: otpMsg.type === 'success' ? '#34d399' : '#ef4444',
                        marginBottom: '10px',
                        textAlign: 'center',
                        fontWeight: 600,
                      }}
                    >
                      {otpMsg.text}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      disabled={resendCooldown > 0 || otpLoading}
                      onClick={handleStartOtpFlow}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '8px',
                        background: 'transparent',
                        border: '1px solid #30363d',
                        color: resendCooldown > 0 ? '#64748b' : '#38bdf8',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : 'Resend Code'}
                    </button>
                    <button
                      type="submit"
                      disabled={otpLoading || otpDigits.join('').length !== 6}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: otpLoading || otpDigits.join('').length !== 6 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {otpLoading ? 'Verifying...' : 'Verify OTP 🚀'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Display Name Editor */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                Display Name
              </div>
              {isEditingName ? (
                <form onSubmit={handleUpdateDisplayName} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name..."
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #30363d',
                      background: '#161b22',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                    }}
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={savingProfile}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      background: '#38bdf8',
                      color: '#000',
                      border: 'none',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {savingProfile ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDisplayName(currentUser.displayName || '');
                      setIsEditingName(false);
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'transparent',
                      border: '1px solid #30363d',
                      color: '#94a3b8',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid #30363d' }}>
                  <span style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 600 }}>{currentUser.displayName || 'No display name set'}</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#38bdf8',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    ✏️ Edit
                  </button>
                </div>
              )}
            </div>

            {profileMsg && (
              <div
                style={{
                  fontSize: '0.8rem',
                  color: profileMsg.type === 'success' ? '#34d399' : '#ef4444',
                  marginBottom: '1rem',
                  fontWeight: 600,
                }}
              >
                {profileMsg.text}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PASSWORD & AUTH MANAGEMENT */}
        {activeTab === 'security' && (
          <div>
            {/* Connected Sign-In Methods */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
                Connected Sign-In Methods
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {hasGoogle && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}
                  >
                    🌐 Google Sign-In Connected
                  </span>
                )}
                {hasPassword ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: 'rgba(52, 211, 153, 0.1)',
                      border: '1px solid rgba(52, 211, 153, 0.3)',
                      color: '#34d399',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}
                  >
                    🔑 Email & Password Active
                  </span>
                ) : (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: 'rgba(251, 191, 36, 0.1)',
                      border: '1px solid rgba(251, 191, 36, 0.3)',
                      color: '#fbbf24',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}
                  >
                    ℹ️ No Password Set (Google SSO Only)
                  </span>
                )}
              </div>
            </div>

            {/* CASE 1: Google user wanting to ADD a password */}
            {!hasPassword && (
              <div
                style={{
                  padding: '1.2rem',
                  borderRadius: '12px',
                  background: 'rgba(56, 189, 248, 0.05)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#38bdf8', marginBottom: '4px' }}>
                  🔑 Add Account Password
                </div>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem', lineHeight: 1.4 }}>
                  You signed in via Google. Add a password to enable logging in directly with your email (<strong>{currentUser.email}</strong>) and password.
                </p>

                <form onSubmit={handleAddPassword}>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters..."
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #30363d',
                        background: '#161b22',
                        color: '#ffffff',
                        fontSize: '0.9rem',
                      }}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password..."
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #30363d',
                        background: '#161b22',
                        color: '#ffffff',
                        fontSize: '0.9rem',
                      }}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={passwordLoading}
                    style={{
                      width: '100%',
                      padding: '9px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: passwordLoading ? 'not-allowed' : 'pointer',
                      boxShadow: '0 2px 10px rgba(56, 189, 248, 0.3)',
                    }}
                  >
                    {passwordLoading ? 'Adding Password...' : 'Link & Set Password 🔒'}
                  </button>
                </form>
              </div>
            )}

            {/* CASE 2: User already has password - UPDATE PASSWORD */}
            {hasPassword && (
              <div
                style={{
                  padding: '1.2rem',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
                  🔄 Update Password
                </div>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem' }}>
                  Enter your current password followed by your new password.
                </p>

                <form onSubmit={handleUpdatePassword}>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password..."
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #30363d',
                        background: '#161b22',
                        color: '#ffffff',
                        fontSize: '0.9rem',
                      }}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters..."
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #30363d',
                        background: '#161b22',
                        color: '#ffffff',
                        fontSize: '0.9rem',
                      }}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password..."
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #30363d',
                        background: '#161b22',
                        color: '#ffffff',
                        fontSize: '0.9rem',
                      }}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={passwordLoading}
                    style={{
                      width: '100%',
                      padding: '9px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: passwordLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {passwordLoading ? 'Updating Password...' : 'Update Password 🔐'}
                  </button>
                </form>
              </div>
            )}

            {passwordMsg && (
              <div
                style={{
                  fontSize: '0.82rem',
                  color: passwordMsg.type === 'success' ? '#34d399' : '#ef4444',
                  marginBottom: '1.25rem',
                  fontWeight: 600,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: passwordMsg.type === 'success' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: passwordMsg.type === 'success' ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                {passwordMsg.text}
              </div>
            )}

            {/* Password Reset Section */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
                  Forgot or Need Reset Link?
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Send a password reset email link to {currentUser.email}
                </div>
              </div>
              <button
                type="button"
                onClick={handleSendResetEmail}
                disabled={resetLoading}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  color: '#38bdf8',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: resetLoading ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {resetLoading ? 'Sending...' : 'Send Reset Link ✉️'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
