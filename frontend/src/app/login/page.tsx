'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { LogIn, UserPlus, AlertCircle, Loader2, PawPrint, ShieldCheck, MessagesSquare, HeartHandshake } from 'lucide-react';
import PasswordStrength from '@/components/PasswordStrength';
import SpeciesIcon from '@/components/SpeciesIcon';
import { PageShell, Field, TextInput, ActionButton, AlertBox, SegmentedTabs, SurfaceCard } from '@/components/ui';

const PRIMITIVES = [
  '123456', 'password', 'qwerty', 'abc123', 'letmein', 'admin',
  'welcome', 'monkey', 'master', 'dragon', 'login', 'princess',
  'football', 'shadow', 'sunshine', 'trustno1', 'iloveyou',
  '1234567', '12345678', '123456789', '12345', '1234',
  'passw0rd', 'password1', 'qwerty123', '1q2w3e4r', 'azerty',
];

function validatePassword(password: string): string | null {
  if (password.length < 6) return 'Пароль должен содержать минимум 6 символов';
  if (!/[A-Z]/.test(password)) return 'Пароль должен содержать хотя бы одну заглавную букву';
  if (!/[a-z]/.test(password)) return 'Пароль должен содержать хотя бы одну строчную букву';
  if (!/[0-9]/.test(password)) return 'Пароль должен содержать хотя бы одну цифру';
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) return 'Пароль должен содержать хотя бы один спецсимвол (!@#$%^&*...)';
  const lower = password.toLowerCase();
  if (PRIMITIVES.some(p => lower.includes(p))) return 'Пароль слишком простой. Используйте более сложный пароль';
  return null;
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [regForm, setRegForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [mailruDemo, setMailruDemo] = useState(false);

  useEffect(() => {
    setIsAdding(localStorage.getItem('addingAccount') === 'true');
    if (searchParams.get('mode') === 'register') {
      setMode('register');
    }
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.username || !formData.password) {
      setError('Заполните все поля');
      return;
    }
    setLoading(true);
    try {
      const response = await authAPI.login(formData);
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      const addingAccount = localStorage.getItem('addingAccount') === 'true';
      if (addingAccount) {
        const saved = localStorage.getItem('savedAccounts');
        const accounts: any[] = saved ? JSON.parse(saved) : [];
        const alreadyExists = accounts.find((a: any) => a.user.id === response.data.user.id);
        if (!alreadyExists) {
          accounts.push({ token: response.data.access_token, user: response.data.user });
        }
        localStorage.setItem('savedAccounts', JSON.stringify(accounts));
        localStorage.removeItem('addingAccount');
      }

      window.location.href = '/';
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при входе');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!regForm.username || !regForm.email || !regForm.password) {
      setError('Заполните все обязательные поля');
      return;
    }

    if (regForm.username.length < 3) {
      setError('Имя пользователя должно содержать минимум 3 символа');
      return;
    }

    const passwordError = validatePassword(regForm.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (regForm.password !== regForm.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.register({
        username: regForm.username,
        email: regForm.email,
        password: regForm.password,
      });
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      if (response.data.demo_code) {
        localStorage.setItem('demoCode', response.data.demo_code);
      }
      window.location.href = '/verify';
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при регистрации');
    } finally {
      setLoading(false);
    }
  };

  const handleMailruLogin = async () => {
    try {
      const response = await authAPI.getMailruAuth();
      if (response.data.mode === 'demo') setMailruDemo(true);
      window.location.href = response.data.auth_url;
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Ошибка авторизации через Mail.ru');
    }
  };

  const assurances = [
    { icon: ShieldCheck, title: 'Безопасная передача', text: 'Анкеты проходят модерацию.' },
    { icon: MessagesSquare, title: 'Прямой контакт', text: 'Общайтесь с владельцем в чате.' },
    { icon: HeartHandshake, title: 'Забота прежде всего', text: 'Помогаем найти надёжный дом.' },
  ];

  return (
    <PageShell>
      <div className="mx-auto grid max-w-6xl items-stretch gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-14">
        <SurfaceCard className="relative hidden overflow-hidden p-8 lg:block">
          <div className="pointer-events-none absolute -bottom-16 -right-16 text-primary-300 opacity-15" aria-hidden="true">
            <SpeciesIcon iconKey="unknown" className="h-48 w-48" />
          </div>
          <span className="eyebrow">Вход и регистрация</span>
          <h1 className="display-title mt-3 text-4xl">
            {isAdding ? 'Добавить аккаунт' : mode === 'register' ? 'Создайте тёплый профиль' : 'С возвращением в приют'}
          </h1>
          <p className="lede mt-3 max-w-md">
            Войдите, чтобы бронировать питомцев, переписываться с владельцами и вести историю ответственных передач.
          </p>
          <div className="mt-7 space-y-3">
            {assurances.map(({ icon: Icon, title, text }) => (
              <div key={title} className="surface-soft flex items-start gap-3 p-4">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-300">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-bold text-white">{title}</span>
                  <span className="block text-sm text-slate-400">{text}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="mt-7 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <PawPrint className="h-6 w-6 text-primary-300" aria-hidden="true" />
            <span className="text-sm text-slate-300">ФРИПЕТ соединяет животных и заботливых людей.</span>
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-6 sm:p-8">
          <div className="mb-6 text-center lg:hidden">
            <h1 className="display-title text-3xl">
              {isAdding ? 'Добавить аккаунт' : mode === 'register' ? 'Регистрация' : 'Вход в аккаунт'}
            </h1>
            <p className="lede mt-2 text-sm">
              {!isAdding && mode === 'login' && 'Войдите, чтобы продолжить заботу о питомцах.'}
              {!isAdding && mode === 'register' && 'Создайте профиль за одну минуту.'}
              {isAdding && 'Войдите в другой аккаунт для добавления.'}
            </p>
          </div>

          <div className="hidden lg:block">
            <h2 className="display-title text-2xl">
              {isAdding ? 'Добавить аккаунт' : mode === 'register' ? 'Регистрация' : 'Вход в аккаунт'}
            </h2>
            <p className="lede mt-2 text-sm">
              {!isAdding && mode === 'login' && (
                <span>
                  Нет аккаунта?{' '}
                  <button onClick={() => { setMode('register'); setError(''); }} className="font-bold text-primary-300 hover:text-primary-200">
                    Зарегистрируйтесь
                  </button>
                </span>
              )}
              {!isAdding && mode === 'register' && (
                <span>
                  Уже есть аккаунт?{' '}
                  <button onClick={() => { setMode('login'); setError(''); }} className="font-bold text-primary-300 hover:text-primary-200">
                    Войдите
                  </button>
                </span>
              )}
              {isAdding && <span>Войдите в другой аккаунт для добавления</span>}
            </p>
          </div>

          <div className="mt-6 lg:hidden">
            <p className="lede text-center text-sm">
              {!isAdding && mode === 'login' && (
                <span>
                  Нет аккаунта?{' '}
                  <button onClick={() => { setMode('register'); setError(''); }} className="font-bold text-primary-300 hover:text-primary-200">
                    Зарегистрируйтесь
                  </button>
                </span>
              )}
              {!isAdding && mode === 'register' && (
                <span>
                  Уже есть аккаунт?{' '}
                  <button onClick={() => { setMode('login'); setError(''); }} className="font-bold text-primary-300 hover:text-primary-200">
                    Войдите
                  </button>
                </span>
              )}
            </p>
          </div>

          {!isAdding && (
            <div className="mt-6">
              <SegmentedTabs<'login' | 'register'>
                value={mode}
                onChange={(next) => { setMode(next); setError(''); }}
                options={[
                  { value: 'login', label: 'Вход', icon: <LogIn className="h-4 w-4" /> },
                  { value: 'register', label: 'Регистрация', icon: <UserPlus className="h-4 w-4" /> },
                ]}
              />
            </div>
          )}

          {error && (
            <div className="mt-5">
              <AlertBox tone="danger">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </AlertBox>
            </div>
          )}

          {mode === 'register' && !isAdding ? (
            <form onSubmit={handleRegister} className="mt-6 space-y-5">
              <Field label="Имя пользователя *">
                <TextInput
                  type="text"
                  name="username"
                  value={regForm.username}
                  onChange={handleRegChange}
                  placeholder="Минимум 3 символа"
                  required
                  minLength={3}
                />
              </Field>

              <Field label="Email *">
                <TextInput
                  type="email"
                  name="email"
                  value={regForm.email}
                  onChange={handleRegChange}
                  placeholder="your@email.com"
                  required
                />
              </Field>

              <Field label="Пароль *">
                <TextInput
                  type="password"
                  name="password"
                  value={regForm.password}
                  onChange={handleRegChange}
                  placeholder="Минимум 6 символов"
                  required
                />
                <PasswordStrength password={regForm.password} />
              </Field>

              <Field label="Подтвердите пароль *">
                <TextInput
                  type="password"
                  name="confirmPassword"
                  value={regForm.confirmPassword}
                  onChange={handleRegChange}
                  placeholder="Повторите пароль"
                  required
                />
                {regForm.confirmPassword && regForm.password !== regForm.confirmPassword && (
                  <p className="mt-1 text-xs text-red-300">Пароли не совпадают</p>
                )}
                {regForm.confirmPassword && regForm.password === regForm.confirmPassword && (
                  <p className="mt-1 text-xs text-green-300">Пароли совпадают</p>
                )}
              </Field>

              <ActionButton type="submit" variant="leaf" disabled={loading} className="w-full py-3">
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Регистрация...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" />
                    <span>Зарегистрироваться</span>
                  </>
                )}
              </ActionButton>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <Field label="Имя пользователя">
                <TextInput
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Ваш логин"
                  required
                />
              </Field>

              <Field label="Пароль">
                <TextInput
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Ваш пароль"
                  required
                />
              </Field>

              <ActionButton type="submit" variant="primary" disabled={loading} className="w-full py-3">
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Вход...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    <span>{isAdding ? 'Добавить аккаунт' : 'Войти'}</span>
                  </>
                )}
              </ActionButton>
            </form>
          )}

          <div className="mt-7">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="surface-soft px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">или войдите через</span>
              </div>
            </div>

            <div className="mt-5">
              <button
                onClick={handleMailruLogin}
                className="btn w-full bg-[#005ff9] py-3 text-white shadow-[0_16px_36px_rgba(0,95,249,0.32)] transition-all hover:bg-[#0050d8]"
              >
                <svg className="h-7 w-7 flex-shrink-0" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                  <text x="8" y="34" fontFamily="Arial" fontWeight="bold" fontSize="32" fill="#FBBF24">@</text>
                </svg>
                <span className="font-bold tracking-wide">Mail.ru</span>
              </button>
              {mailruDemo && (
                <p className="mt-2 text-center text-xs text-slate-500">
                  Демо-режим: вход выполняется локально, без интернета
                </p>
              )}
            </div>
          </div>
        </SurfaceCard>
      </div>
    </PageShell>
  );
}
