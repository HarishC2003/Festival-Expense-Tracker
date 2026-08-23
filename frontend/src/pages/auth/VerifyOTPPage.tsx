import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

interface LocationState {
  userId: string;
  email: string;
  name: string;
}

export const VerifyOTPPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const state = location.state as LocationState | null;

  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));

  // Redirect if no state passed
  useEffect(() => {
    if (!state?.userId) {
      navigate('/register');
    }
  }, [state, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // only digits
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // keep only last digit
    setOtp(newOtp);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: state?.userId, code }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Verification failed');

      setSuccess(data.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.message);
      // Shake the inputs on error
      setOtp(Array(6).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || !state) return;
    setResending(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: state.userId, email: state.email, name: state.name }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to resend');

      setCanResend(false);
      setCountdown(60);
      setOtp(Array(6).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="w-[420px]">
          <CardHeader className="space-y-1 text-center">
            {/* Icon */}
            <div className="mx-auto mb-2 w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <span className="text-3xl">📧</span>
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
              Check your email
            </CardTitle>
            <CardDescription className="text-sm">
              We sent a 6-digit code to{' '}
              <span className="font-semibold text-foreground">{state?.email}</span>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Error / Success */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm font-medium text-destructive text-center bg-destructive/10 rounded-lg p-3"
              >
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm font-medium text-green-500 text-center bg-green-500/10 rounded-lg p-3"
              >
                ✅ {success}
              </motion.div>
            )}

            {/* OTP Input Boxes */}
            <div className="flex gap-3 justify-center" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <motion.input
                  key={index}
                  ref={el => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(index, e.target.value)}
                  onKeyDown={e => handleKeyDown(index, e)}
                  className={`
                    w-12 h-14 text-center text-2xl font-bold rounded-lg border-2 bg-background
                    transition-all duration-200 outline-none
                    ${digit ? 'border-amber-500 text-amber-500' : 'border-border text-foreground'}
                    focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20
                  `}
                  whileFocus={{ scale: 1.05 }}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {/* Verify Button */}
            <Button
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold"
              onClick={handleVerify}
              disabled={loading || otp.join('').length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </Button>

            {/* Resend */}
            <div className="text-center text-sm text-muted-foreground">
              Didn't receive the code?{' '}
              {canResend ? (
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="text-amber-500 hover:underline font-medium disabled:opacity-50"
                >
                  {resending ? 'Sending...' : 'Resend code'}
                </button>
              ) : (
                <span className="text-muted-foreground">
                  Resend in <span className="text-amber-500 font-medium tabular-nums">{countdown}s</span>
                </span>
              )}
            </div>

            <div className="text-center text-xs text-muted-foreground">
              <Link to="/register" className="hover:text-primary transition-colors">
                ← Back to Register
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
