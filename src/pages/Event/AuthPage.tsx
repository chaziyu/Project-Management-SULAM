import { useSignIn, useSignUp } from '@clerk/clerk-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { UserRole } from '../../types';

interface AuthPageProps {
  onLoginSuccess?: () => void;
}

/**
 * Authentication Page.
 * Handles Login, Sign Up, and Password Reset using Clerk APIs directly.
 * Provides a custom UI over Clerk's headless hooks.
 */

export const AuthPage: React.FC<AuthPageProps> = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.VOLUNTEER);

  // Verification State
  const [pendingVerification, setPendingVerification] = useState(false);
  const [pendingReset, setPendingReset] = useState(false);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Clerk Hooks
  const { isLoaded: isSignInLoaded, signIn, setActive } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();
  const navigate = useNavigate();

  // Handle Form Submit (Login or Sign Up)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!isSignInLoaded || !isSignUpLoaded) return;

    try {
      if (isForgot) {
        // --- STEP 1: REQUEST RESET CODE ---
        await signIn?.create({
          strategy: "reset_password_email_code",
          identifier: email,
        });
        setPendingReset(true);
        setLoading(false);
        return;
      }

      if (isLogin) {
        // --- CLERK LOGIN ---
        const result = await signIn.create({
          identifier: email,
          password,
        });

        if (result.status === "complete") {
          await setActive({ session: result.createdSessionId });
          navigate('/dashboard');
        } else {
          console.log(result);
          setError("Login incomplete. Check console for details.");
        }
      } else {
        // --- CLERK REGISTRATION ---
        const result = await signUp.create({
          emailAddress: email,
          password,
          firstName: name,
          unsafeMetadata: { role: role }
        });

        // Check for verification requirement
        if (result.status === "missing_requirements") {
          await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
          setPendingVerification(true);
        } else if (result.status === "complete") {
          await setSignUpActive({ session: result.createdSessionId });
          navigate('/dashboard');
        } else {
          console.error(result);
          setError("Something went wrong during sign up.");
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.errors?.[0]?.message || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle Verification Code Submit (Sign Up)
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!isSignUpLoaded) return;

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === 'complete') {
        await setSignUpActive({ session: completeSignUp.createdSessionId });
        navigate('/dashboard');
      } else {
        console.error(JSON.stringify(completeSignUp, null, 2));
        setError("Verification invalid or incomplete.");
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setError(err.errors?.[0]?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle Password Reset (Step 2)
  const handleResetVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!isSignInLoaded) return;

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password: newPassword,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        navigate('/dashboard');
      } else {
        console.error(result);
        setError("Reset failed. Code might be invalid.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.errors?.[0]?.message || 'Detailed reset failed');
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setError('');
    setEmail('');
    setPassword('');
    setName('');
    setIsForgot(false);
    setIsForgot(false);
    setPendingVerification(false);
    setPendingReset(false);
    setCode('');
    setNewPassword('');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-sm bg-white p-8 sm:p-10 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">

        {/* HEADER & TABS */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-100 text-primary-600 rounded-2xl mb-4 shadow-inner">
            <span className="text-2xl font-bold">U</span>
          </div>

          {!pendingVerification && !isForgot && (
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
              <button
                onClick={() => { setIsLogin(true); resetState(); }}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Login
              </button>
              <button
                onClick={() => { setIsLogin(false); resetState(); }}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Sign Up
              </button>
            </div>
          )}

          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {pendingVerification ? 'Check your Email' : (isForgot ? 'Reset Password' : (isLogin ? 'Welcome Back' : 'Join UMission'))}
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            {pendingVerification || pendingReset
              ? `We sent a code to ${email}`
              : (isForgot ? 'Enter your email to receive a reset link' : (isLogin ? 'Access your dashboard' : 'Connect with the campus community'))
            }
          </p>
        </div>

        {error && <div className="mb-4 text-red-600 text-xs text-center bg-red-50 p-3 rounded-xl border border-red-100">{error}</div>}

        {/* VERIFICATION FORM */}
        {/* VERIFICATION FORM */}
        {pendingVerification ? (
          <form className="space-y-4" onSubmit={handleVerify}>
            <input
              type="text"
              required
              className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all text-sm outline-none text-center tracking-widest text-lg font-bold"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-primary-200 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
            <button
              type="button"
              onClick={() => setPendingVerification(false)}
              className="w-full text-xs text-slate-400 hover:text-slate-600"
            >
              Back to Sign Up
            </button>
          </form>
        ) : pendingReset ? (
          /* RESET PASSWORD VERIFICATION FORM */
          <form className="space-y-4" onSubmit={handleResetVerify}>
            <div className="space-y-2">
              <p className="text-sm text-slate-600 text-center mb-4">
                Enter the code sent to your email and your new password.
              </p>
              <input
                type="text"
                required
                className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all text-sm outline-none text-center tracking-widest text-lg font-bold"
                placeholder="Code (e.g. 123456)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <input
                type="password"
                required
                className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all text-sm outline-none"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-primary-200 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70"
            >
              {loading ? 'Reseting...' : 'Set New Password'}
            </button>
            <button
              type="button"
              onClick={() => resetState()}
              className="w-full text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </form>
        ) : (
          /* LOGIN / SIGNUP FORM */
          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && !isForgot && (
              <input
                type="text"
                required
                className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all text-sm outline-none"
                placeholder="Full Name / Club Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}

            <input
              type="email"
              required
              className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all text-sm outline-none"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {!isForgot && (
              <div className="space-y-2">
                <input
                  type="password"
                  required
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all text-sm outline-none"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {isLogin && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => { resetState(); setIsForgot(true); }}
                      className="text-xs font-medium text-primary-600 hover:text-primary-700"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}
              </div>
            )}

            {!isLogin && !isForgot && (
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-1.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setRole(UserRole.VOLUNTEER)}
                  className={`h-9 text-xs font-bold rounded-lg transition-all ${role === UserRole.VOLUNTEER ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole(UserRole.ORGANIZER)}
                  className={`h-9 text-xs font-bold rounded-lg transition-all ${role === UserRole.ORGANIZER ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Club/Admin
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-primary-200 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 disabled:translate-y-0"
            >
              {loading ? 'Processing...' : (isForgot ? 'Send Reset Link' : (isLogin ? 'Access Campus Hub' : 'Create Account'))}
            </button>
          </form>
        )}

        {isForgot && (
          <div className="mt-8 text-center">
            <button
              onClick={() => { resetState(); setIsLogin(true); }}
              className="text-sm font-bold text-slate-700 hover:text-primary-600 transition-colors"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};