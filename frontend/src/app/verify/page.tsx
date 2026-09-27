'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, User } from '@/lib/api';
import {
  Mail, CheckCircle, AlertCircle, Loader2, RefreshCw,
  Edit3, Clock,
} from 'lucide-react';
import { PageShell, PageContainer, SurfaceCard, Field, TextInput, ActionButton, AlertBox } from '@/components/ui';

const CODE_TTL_SECONDS = 5 * 60;

export default function VerifyPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [code, setCode] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [showEmailEdit, setShowEmailEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [alreadyVerified, setAlreadyVerified] = useState(false);
  const [ttl, setTtl] = useState(CODE_TTL_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const [demoCode, setDemoCode] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('demoCode');
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!savedUser || !token) {
      router.push('/login');
      return;
    }
    const userData = JSON.parse(savedUser);
    setUser(userData);
    if (userData.is_verified) {
      setAlreadyVerified(true);
      setTimeout(() => { window.location.href = '/'; }, 2000);
    }
  }, [router]);

  useEffect(() => {
    if (ttl <= 0) {
      setCanResend(true);
      return;
    }
    setCanResend(false);
    const timer = setInterval(() => {
      setTtl((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [ttl]);

  const resetTtl = useCallback(() => {
    setTtl(CODE_TTL_SECONDS);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (code.length !== 9) {
      setError('Код должен содержать 9 символов (формат: XXXX-XXXX)');
      return;
    }

    setLoading(true);
    try {
      await authAPI.verifyEmail(code);
      localStorage.removeItem('demoCode');
      setDemoCode(null);
      setSuccess('Аккаунт успешно верифицирован!');
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        userData.is_verified = true;
        localStorage.setItem('user', JSON.stringify(userData));
      }
      setTimeout(() => { window.location.href = '/'; }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка верификации');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newEmail) {
      setError('Введите новый email');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.changeEmail(newEmail);
      const newCode = (res.data as any)?.demo_code;
      if (newCode) {
        localStorage.setItem('demoCode', newCode);
        setDemoCode(newCode);
      }
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        userData.email = newEmail;
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      }
      setShowEmailEdit(false);
      setSuccess(`Новый код отправлен на ${newEmail}`);
      setCode('');
      resetTtl();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка смены email');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError('');
    try {
      const res = await authAPI.resendCode();
      const newCode = (res.data as any)?.demo_code;
      if (newCode) {
        localStorage.setItem('demoCode', newCode);
        setDemoCode(newCode);
      }
      setSuccess('Новый код отправлен на ваш email');
      resetTtl();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка отправки кода');
    } finally {
      setResendLoading(false);
    }
  };

  if (alreadyVerified) {
    return (
      <PageShell>
        <div className="flex min-h-screen items-center justify-center px-4">
          <SurfaceCard className="max-w-md px-8 py-12 text-center">
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-300" />
            <h2 className="display-title text-2xl">Аккаунт уже верифицирован</h2>
            <p className="lede mt-2 text-sm">Перенаправление на главную...</p>
          </SurfaceCard>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageContainer>
        <div className="mx-auto max-w-xl">
          <div className="mb-7 text-center">
            <span className="brand-mark mx-auto" aria-hidden="true">
              <Mail className="h-6 w-6" />
            </span>
            <p className="eyebrow mt-4 justify-center">Подтверждение почты</p>
            <h1 className="display-title mt-2 text-3xl sm:text-4xl">Верификация по email</h1>
            <p className="lede mt-2 text-sm">
              Код отправлен на <span className="font-bold text-white">{user?.email}</span>
            </p>
          </div>

          <SurfaceCard className="p-6 sm:p-8">
            {error && (
              <div className="mb-4">
                <AlertBox tone="danger">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </AlertBox>
              </div>
            )}

            {success && (
              <div className="mb-4">
                <AlertBox tone="success">
                  <CheckCircle className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm">{success}</span>
                </AlertBox>
              </div>
            )}

            {demoCode && (
              <div className="surface-soft mb-5 border-2 border-dashed border-green-500/40 p-4 text-green-300">
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em]">
                  Режим демо — ваш код
                </p>
                <p className="my-1 text-center font-mono text-2xl font-bold tracking-[0.2em]">
                  {demoCode}
                </p>
                <p className="text-xs opacity-80">
                  Почта не настроена, поэтому код показан здесь. Действителен 5 минут.
                </p>
              </div>
            )}

            <form onSubmit={handleVerifyEmail} className="space-y-5">
              <Field label="Код верификации">
                <TextInput
                  type="text"
                  value={code}
                  onChange={(e) => {
                    let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    if (val.length > 4) val = val.slice(0, 4) + '-' + val.slice(4, 8);
                    setCode(val.slice(0, 9));
                  }}
                  className="py-3 text-center font-mono text-2xl tracking-[0.2em]"
                  placeholder="XXXX-XXXX"
                  maxLength={9}
                  autoFocus
                  required
                />
                <p className="mt-1 text-center text-xs text-slate-500">Формат: XXXX-XXXX (буквы и цифры)</p>
              </Field>

              <ActionButton type="submit" variant="leaf" disabled={loading || code.length !== 9} className="w-full py-3">
                {loading ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /><span>Проверка...</span></>
                ) : (
                  <span>Верифицировать</span>
                )}
              </ActionButton>
            </form>

            <div className="mt-5 space-y-2">
              {ttl > 0 && (
                <div className="flex items-center justify-center space-x-1 text-xs text-slate-500">
                  <Clock className="h-3 w-3" />
                  <span>Код действителен ещё {formatTime(ttl)}</span>
                </div>
              )}

              <button
                onClick={handleResend}
                disabled={resendLoading || !canResend}
                className="flex w-full items-center justify-center space-x-1 py-2 text-sm font-bold text-primary-300 transition-colors hover:text-primary-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {resendLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span>{canResend ? 'Отправить код повторно' : `Повторить через ${formatTime(ttl)}`}</span>
              </button>

              {!showEmailEdit ? (
                <button
                  onClick={() => setShowEmailEdit(true)}
                  className="flex w-full items-center justify-center space-x-1 py-2 text-sm font-semibold text-slate-400 transition-colors hover:text-white"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Указать другой email</span>
                </button>
              ) : (
                <form onSubmit={handleChangeEmail} className="space-y-2">
                  <TextInput
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="text-sm"
                    placeholder="Новый email"
                    required
                  />
                  <div className="flex gap-2">
                    <ActionButton type="submit" variant="primary" disabled={loading} className="flex-1 py-2 text-sm">
                      {loading ? 'Отправка...' : 'Отправить код'}
                    </ActionButton>
                    <button
                      type="button"
                      onClick={() => { setShowEmailEdit(false); setNewEmail(''); }}
                      className="btn btn-ghost px-4 py-2 text-sm"
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              )}
            </div>
          </SurfaceCard>
        </div>
      </PageContainer>
    </PageShell>
  );
}
