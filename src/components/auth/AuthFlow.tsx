import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowLeft, KeyRound, CheckCircle2, XCircle, FlaskConical } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { validatePassword, isPasswordValid } from '../../utils/validation';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { AuthView } from '../../types';

function PasswordStrength({ password }: { password: string }) {
  const v = validatePassword(password);
  const rules = [
    { label: 'At least 8 characters', met: v.minLength },
    { label: 'One uppercase letter', met: v.hasUppercase },
    { label: 'One lowercase letter', met: v.hasLowercase },
    { label: 'One number', met: v.hasNumber },
    { label: 'One special character', met: v.hasSpecialChar },
  ];
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1">
      {rules.map((r) => (
        <div key={r.label} className="flex items-center gap-1.5 text-xs">
          {r.met ? (
            <CheckCircle2 size={13} className="text-green-500 shrink-0" />
          ) : (
            <XCircle size={13} className="text-neutral-300 dark:text-neutral-600 shrink-0" />
          )}
          <span className={r.met ? 'text-green-600 dark:text-green-400' : 'text-neutral-400 dark:text-neutral-500'}>
            {r.label}
          </span>
        </div>
      ))}
    </div>
  );
}

const pageVariants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export function AuthFlow() {
  const {
    currentView, isLoading, error, successMessage, setView,
    signIn, signUp, verifyEmail, forgotPassword, verifyResetCode, resetPassword,
    clearMessages,
  } = useAuthStore();

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4 py-8">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-neutral-900 dark:bg-white mb-4">
            <span className="text-white dark:text-neutral-900 font-bold text-lg">R</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Ram's Notes
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Your personal knowledge base
          </p>
        </motion.div>

        <motion.div
          className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-8"
          layout
        >
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 text-sm"
              >
                {successMessage}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              {currentView === 'signin' && <SignInForm />}
              {currentView === 'signup' && <SignUpForm />}
              {currentView === 'email-verification' && <EmailVerificationForm />}
              {currentView === 'forgot-password' && <ForgotPasswordForm />}
              {currentView === 'forgot-password-code' && <ForgotPasswordCodeForm />}
              {currentView === 'new-password' && <NewPasswordForm />}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* <p className="text-center text-xs text-neutral-400 dark:text-neutral-600 mt-6">
          Demo: sivaram@gmail.com / Sivaram@123
        </p> */}
      </div>
    </div>
  );
}

function SignInForm() {
  const { signIn, isLoading, setView, clearMessages } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showDemo, setShowDemo] = useState(false);
  const demoEmail = 'demo@ramnotes.app';
  const demoPassword = 'Demo@2026';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-1">Welcome back</h2>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Sign in to your account</p>
      <Input
        label="Email"
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        icon={<Mail size={16} />}
        required
      />
      <Input
        label="Password"
        type="password"
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        icon={<Lock size={16} />}
        required
      />
      <div className="flex justify-end">
        <button
          type="button"
          className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
          onClick={() => { clearMessages(); setView('forgot-password'); }}
        >
          Forgot password?
        </button>
      </div>
      <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
        Sign In
      </Button>
      <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40 p-3.5">
        <button
          type="button"
          onClick={() => setShowDemo((prev) => !prev)}
          className="w-full flex items-center justify-between text-left"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-neutral-800 dark:text-neutral-100">
            <FlaskConical size={14} />
            Demo user login
          </span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {showDemo ? 'Hide' : 'Show'}
          </span>
        </button>
        {showDemo && (
          <div className="mt-3 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-3">
            <p className="text-xs text-neutral-600 dark:text-neutral-300">
              Email: <span className="font-medium text-neutral-800 dark:text-neutral-100">{demoEmail}</span>
            </p>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1">
              Password: <span className="font-medium text-neutral-800 dark:text-neutral-100">{demoPassword}</span>
            </p>
            <button
              type="button"
              onClick={() => {
                setEmail(demoEmail);
                setPassword(demoPassword);
              }}
              className="mt-3 w-full px-3 py-2 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              Use demo credentials
            </button>
          </div>
        )}
      </div>
      <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
        Don't have an account?{' '}
        <button
          type="button"
          className="text-neutral-900 dark:text-white font-medium hover:underline"
          onClick={() => { clearMessages(); setView('signup'); }}
        >
          Sign Up
        </button>
      </p>
    </form>
  );
}

function SignUpForm() {
  const { signUp, isLoading, setView, clearMessages } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState('');

  const v = useMemo(() => validatePassword(password), [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (!isPasswordValid(v)) {
      setLocalError('Password does not meet all requirements.');
      return;
    }
    if (password !== confirm) {
      setLocalError('Passwords do not match.');
      return;
    }
    await signUp(name, email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-1">Create account</h2>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Get started with Ram's Notes</p>
      {localError && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
          {localError}
        </div>
      )}
      <Input label="Full Name" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} icon={<User size={16} />} required />
      <Input label="Email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail size={16} />} required />
      <div>
        <Input label="Password" type="password" placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} icon={<Lock size={16} />} required />
        <PasswordStrength password={password} />
      </div>
      <Input label="Confirm Password" type="password" placeholder="Confirm your password" value={confirm} onChange={(e) => setConfirm(e.target.value)} icon={<Lock size={16} />} required />
      <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
        Create Account
      </Button>
      <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
        Already have an account?{' '}
        <button type="button" className="text-neutral-900 dark:text-white font-medium hover:underline" onClick={() => { clearMessages(); setView('signin'); }}>
          Sign In
        </button>
      </p>
    </form>
  );
}

function EmailVerificationForm() {
  const { verifyEmail, isLoading, setView, clearMessages } = useAuthStore();
  const [code, setCode] = useState('');

  return (
    <form onSubmit={(e) => { e.preventDefault(); verifyEmail(code); }} className="space-y-4">
      <button type="button" className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 mb-2" onClick={() => { clearMessages(); setView('signup'); }}>
        <ArrowLeft size={14} /> Back
      </button>
      <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-1">Verify your email</h2>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Enter the 6-digit code sent to your email</p>
      <Input label="Verification Code" placeholder="000000" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} icon={<KeyRound size={16} />} maxLength={6} required />
      <Button type="submit" isLoading={isLoading} className="w-full" size="lg">Verify Email</Button>
    </form>
  );
}

function ForgotPasswordForm() {
  const { forgotPassword, isLoading, setView, clearMessages } = useAuthStore();
  const [email, setEmail] = useState('');

  return (
    <form onSubmit={(e) => { e.preventDefault(); forgotPassword(email); }} className="space-y-4">
      <button type="button" className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 mb-2" onClick={() => { clearMessages(); setView('signin'); }}>
        <ArrowLeft size={14} /> Back
      </button>
      <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-1">Forgot password</h2>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Enter your email to receive a reset code</p>
      <Input label="Email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail size={16} />} required />
      <Button type="submit" isLoading={isLoading} className="w-full" size="lg">Send Reset Code</Button>
    </form>
  );
}

function ForgotPasswordCodeForm() {
  const { verifyResetCode, isLoading, setView, clearMessages } = useAuthStore();
  const [code, setCode] = useState('');

  return (
    <form onSubmit={(e) => { e.preventDefault(); verifyResetCode(code); }} className="space-y-4">
      <button type="button" className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 mb-2" onClick={() => { clearMessages(); setView('forgot-password'); }}>
        <ArrowLeft size={14} /> Back
      </button>
      <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-1">Enter reset code</h2>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Enter the 6-digit code sent to your email</p>
      <Input label="Reset Code" placeholder="000000" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} icon={<KeyRound size={16} />} maxLength={6} required />
      <Button type="submit" isLoading={isLoading} className="w-full" size="lg">Verify Code</Button>
    </form>
  );
}

function NewPasswordForm() {
  const { resetPassword, isLoading, setView, clearMessages } = useAuthStore();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState('');

  const v = useMemo(() => validatePassword(password), [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (!isPasswordValid(v)) { setLocalError('Password does not meet all requirements.'); return; }
    if (password !== confirm) { setLocalError('Passwords do not match.'); return; }
    await resetPassword(password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <button type="button" className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 mb-2" onClick={() => { clearMessages(); setView('forgot-password-code'); }}>
        <ArrowLeft size={14} /> Back
      </button>
      <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-1">Set new password</h2>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Create a strong password for your account</p>
      {localError && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">{localError}</div>
      )}
      <div>
        <Input label="New Password" type="password" placeholder="Enter new password" value={password} onChange={(e) => setPassword(e.target.value)} icon={<Lock size={16} />} required />
        <PasswordStrength password={password} />
      </div>
      <Input label="Confirm Password" type="password" placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} icon={<Lock size={16} />} required />
      <Button type="submit" isLoading={isLoading} className="w-full" size="lg">Reset Password</Button>
    </form>
  );
}
