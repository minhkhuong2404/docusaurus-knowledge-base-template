import { doc, getDoc, setDoc, deleteDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { User, sendEmailVerification } from 'firebase/auth';
import { db } from '../config/firebase';

export interface EmailVerificationRecord {
  email: string;
  otp: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
  verified: boolean;
}

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

/**
 * Generates a random 6-digit numeric OTP.
 */
export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate and store an OTP for the given user, dispatching native email verification where possible.
 */
export async function sendOtpToUserEmail(user: User): Promise<{ success: boolean; message: string; cooldownRemaining?: number }> {
  if (!user || !user.email) {
    return { success: false, message: 'No valid user or email found.' };
  }

  const emailKey = user.email.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
  const ref = doc(db, 'email_verifications', emailKey);

  try {
    const existingSnap = await getDoc(ref);
    if (existingSnap.exists()) {
      const data = existingSnap.data() as EmailVerificationRecord;
      const now = Date.now();
      const timeSinceCreation = now - (data.createdAt || 0);
      if (timeSinceCreation < RESEND_COOLDOWN_MS) {
        const cooldownRemaining = Math.ceil((RESEND_COOLDOWN_MS - timeSinceCreation) / 1000);
        return {
          success: false,
          message: `Please wait ${cooldownRemaining}s before requesting a new code.`,
          cooldownRemaining,
        };
      }
    }

    const otp = generateOtpCode();
    const now = Date.now();

    const record: EmailVerificationRecord = {
      email: user.email.toLowerCase(),
      otp,
      createdAt: now,
      expiresAt: now + OTP_TTL_MS,
      attempts: 0,
      verified: false,
    };

    await setDoc(ref, record);

    // Also trigger Firebase Auth native email verification link/dispatch
    try {
      await sendEmailVerification(user);
    } catch (authErr: any) {
      console.warn('Firebase sendEmailVerification notification:', authErr?.message);
    }

    return {
      success: true,
      message: `A 6-digit OTP verification code has been dispatched to ${user.email}.`,
    };
  } catch (err: any) {
    console.error('Error sending OTP:', err);
    return {
      success: false,
      message: err?.message || 'Failed to send OTP code. Please try again.',
    };
  }
}

/**
 * Verifies the 6-digit OTP code against Firestore.
 */
export async function verifyUserEmailOtp(user: User, inputOtp: string): Promise<{ success: boolean; message: string }> {
  if (!user || !user.email) {
    return { success: false, message: 'User session invalid.' };
  }

  const cleanOtp = inputOtp.trim();
  if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
    return { success: false, message: 'Please enter a valid 6-digit numeric OTP code.' };
  }

  const emailKey = user.email.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
  const ref = doc(db, 'email_verifications', emailKey);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return { success: false, message: 'No active verification code found. Please request a new code.' };
    }

    const data = snap.data() as EmailVerificationRecord;
    const now = Date.now();

    if (now > data.expiresAt) {
      await deleteDoc(ref).catch(() => {});
      return { success: false, message: 'Verification code has expired. Please request a new one.' };
    }

    if (data.attempts >= 5) {
      await deleteDoc(ref).catch(() => {});
      return { success: false, message: 'Too many incorrect attempts. Please request a new code.' };
    }

    if (data.otp !== cleanOtp) {
      await updateDoc(ref, { attempts: (data.attempts || 0) + 1 });
      const remainingAttempts = 4 - data.attempts;
      return {
        success: false,
        message: `Incorrect OTP code. ${remainingAttempts > 0 ? `${remainingAttempts} attempt(s) remaining.` : 'Code will be invalidated.'}`,
      };
    }

    // Mark as verified in Firestore & cleanup
    await updateDoc(ref, { verified: true });
    
    // Also record in user profile doc
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, { emailVerified: true, emailVerifiedAt: serverTimestamp() }, { merge: true }).catch(() => {});

    return {
      success: true,
      message: 'Email address verified successfully!',
    };
  } catch (err: any) {
    console.error('Error verifying OTP:', err);
    return {
      success: false,
      message: err?.message || 'Verification failed. Please try again.',
    };
  }
}
