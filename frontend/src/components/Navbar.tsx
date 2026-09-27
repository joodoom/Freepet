'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, LogOut, Plus, Home, PawPrint, MessageSquare, Repeat, X, Menu, Shield, Sun, Moon, UserCircle } from 'lucide-react';
import { authAPI, User as UserType, messagesAPI, mediaUrl } from '@/lib/api';

interface SavedAccount {
  token: string;
  user: UserType;
}

function UserAvatar({ user, className }: { user: UserType; className?: string }) {
  if (user.avatar_url) {
    return <img src={mediaUrl(user.avatar_url)} alt="" className={`${className ?? ''} rounded-full object-cover flex-shrink-0`} />;
  }
  return <User className={className} />;
}

export default function Navbar() {
  const [user, setUser] = useState<UserType | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const router = useRouter();

  useEffect(() => {
    const t = localStorage.getItem('fripet-theme');
    const isLight = t
      ? t === 'light'
      : window.matchMedia?.('(prefers-color-scheme: light)').matches ?? false;
    setTheme(isLight ? 'light' : 'dark');
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('light', next === 'light');
    localStorage.setItem('fripet-theme', next);
    setTheme(next);
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
    const accounts = localStorage.getItem('savedAccounts');
    if (accounts) setSavedAccounts(JSON.parse(accounts));

    const syncUser = () => {
      const fresh = localStorage.getItem('user');
      if (fresh) setUser(JSON.parse(fresh));
    };
    window.addEventListener('user-updated', syncUser);

    // Возвращаем позицию скролла после перезагрузки при смене аккаунта,
    // чтобы список/страница не «уезжали» наверх.
    const restoreY = sessionStorage.getItem('fripet-scroll-restore');
    if (restoreY !== null) {
      sessionStorage.removeItem('fripet-scroll-restore');
      const y = parseInt(restoreY, 10);
      if (!Number.isNaN(y) && y > 0) {
        const restore = () => window.scrollTo(0, y);
        requestAnimationFrame(restore);
        window.setTimeout(restore, 350);
      }
    }

    return () => window.removeEventListener('user-updated', syncUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try { const res = await messagesAPI.getUnreadCount(); setUnreadCount(res.data.count); } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsMenuOpen(false);
    setMobileMenuOpen(false);
    router.push('/login');
  };

  const addAnotherAccount = () => {
    if (!user) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const exists = savedAccounts.find(a => a.user.id === user.id);
    if (!exists) {
      const updated = [...savedAccounts, { token, user }];
      localStorage.setItem('savedAccounts', JSON.stringify(updated));
    }
    localStorage.setItem('addingAccount', 'true');
    setIsMenuOpen(false);
    setMobileMenuOpen(false);
    router.push('/login');
  };

  const switchAccount = (account: SavedAccount) => {
    try {
      sessionStorage.setItem('fripet-scroll-restore', String(window.scrollY));
    } catch {}
    localStorage.setItem('token', account.token);
    localStorage.setItem('user', JSON.stringify(account.user));
    localStorage.removeItem('addingAccount');
    setUser(account.user);
    setShowSwitcher(false);
    setIsMenuOpen(false);
    setMobileMenuOpen(false);
    window.location.reload();
  };

  const removeSavedAccount = (userId: number) => {
    const updated = savedAccounts.filter(a => a.user.id !== userId);
    setSavedAccounts(updated);
    localStorage.setItem('savedAccounts', JSON.stringify(updated));
  };

  return (
    <nav className="topbar sticky top-0 z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-[4.5rem]">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3 min-h-11" aria-label="ФРИПЕТ — на главную">
              <span className="brand-mark" aria-hidden="true">
                <PawPrint className="h-6 w-6" />
              </span>
              <span className="leading-tight">
                <span className="display-title block text-xl tracking-tight">ФРИПЕТ</span>
                <span className="lede block text-[11px] uppercase tracking-[0.18em]">Дом для животных</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="h-11 w-11 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              onClick={() => { setMobileMenuOpen(!mobileMenuOpen); setIsMenuOpen(false); }}
              className="h-11 w-11 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          <div className="hidden md:flex items-center gap-1.5">
            <Link href="/" className="nav-pill">
              <Home className="h-5 w-5" />
              <span>Главная</span>
            </Link>

            {user ? (
              <>
                <Link href="/add" className="btn btn-primary ml-1 px-5 py-2 text-sm">
                  <Plus className="h-5 w-5" />
                  <span>Добавить</span>
                </Link>

                <Link href="/chat" className="nav-pill relative">
                  <MessageSquare className="h-5 w-5" />
                  <span className="hidden sm:inline">Чат</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>

                <div className="relative">
                  <button onClick={() => { setIsMenuOpen(!isMenuOpen); setShowSwitcher(false); }} className="nav-pill" aria-label="Профиль">
                    <span className="rounded-full border border-white/20 p-0.5">
                      <UserAvatar user={user} className="h-7 w-7" />
                    </span>
                    <span className="max-w-36 truncate">{user.username}</span>
                  </button>

                  {isMenuOpen && (
                    <div className="absolute right-0 mt-3 w-64 glass rounded-2xl shadow-2xl py-2 z-50 border border-white/10">
                      <Link href="/account" className="block px-5 py-2.5 text-slate-300 hover:bg-white/10 transition-colors" onClick={() => setIsMenuOpen(false)}>
                        Личный кабинет
                      </Link>
                      <Link href="/my-bookings" className="block px-5 py-2.5 text-slate-300 hover:bg-white/10 transition-colors" onClick={() => setIsMenuOpen(false)}>
                        Мои бронирования
                      </Link>
                      {user.is_admin && (
                        <Link href="/admin" className="block px-5 py-2.5 text-primary-300 font-semibold hover:bg-white/10 transition-colors" onClick={() => setIsMenuOpen(false)}>
                          Админ панель
                        </Link>
                      )}
                      <hr className="my-2 border-white/10" />
                      <button onClick={addAnotherAccount} className="w-full text-left px-5 py-2.5 text-slate-300 hover:bg-white/10 flex items-center space-x-2 transition-colors">
                        <Plus className="h-4 w-4" />
                        <span>Добавить аккаунт</span>
                      </button>
                      {savedAccounts.length > 0 && (
                        <button onClick={() => setShowSwitcher(true)} className="w-full text-left px-5 py-2.5 text-slate-300 hover:bg-white/10 flex items-center space-x-2 transition-colors">
                          <Repeat className="h-4 w-4" />
                          <span>Переключить</span>
                        </button>
                      )}
                      <hr className="my-2 border-white/10" />
                      <button onClick={handleLogout} className="w-full text-left px-5 py-2.5 text-red-300 hover:bg-red-500/10 flex items-center space-x-2 transition-colors">
                        <LogOut className="h-4 w-4" />
                        <span>Выйти</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="nav-pill px-5 font-semibold">
                  Войти
                </Link>
                <Link href="/login?mode=register" className="btn btn-leaf px-5 py-2 text-sm">
                  Регистрация
                </Link>
              </>
            )}

            <button
              onClick={toggleTheme}
              className="h-11 w-11 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
              title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden pb-4 pt-2">
            <div className="surface-soft flex flex-col gap-1 p-2">
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center space-x-2 px-3 py-3 rounded-xl text-slate-300 hover:bg-white/10 transition-colors">
                <Home className="h-5 w-5 text-primary-300" />
                <span className="font-medium">Главная</span>
              </Link>
              {user ? (
                <>
                  <div className="flex items-center space-x-3 px-3 py-3">
                    <UserAvatar user={user} className="h-11 w-11 border border-white/20 text-primary-300" />
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{user.username}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                  </div>
                  <Link href="/add" onClick={() => setMobileMenuOpen(false)} className="flex items-center space-x-2 px-3 py-3 rounded-xl text-slate-300 hover:bg-white/10 transition-colors">
                    <Plus className="h-5 w-5 text-primary-300" />
                    <span className="font-medium">Добавить питомца</span>
                  </Link>
                  <Link href="/chat" onClick={() => setMobileMenuOpen(false)} className="flex items-center space-x-2 px-3 py-3 rounded-xl text-slate-300 hover:bg-white/10 transition-colors">
                    <MessageSquare className="h-5 w-5 text-green-400" />
                    <span className="font-medium">Чат</span>
                    {unreadCount > 0 && <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 ml-auto">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                  </Link>
                  <Link href="/my-bookings" onClick={() => setMobileMenuOpen(false)} className="flex items-center space-x-2 px-3 py-3 rounded-xl text-slate-300 hover:bg-white/10 transition-colors">
                    <User className="h-5 w-5 text-slate-400" />
                    <span className="font-medium">Мои бронирования</span>
                  </Link>
                  <Link href="/account" onClick={() => setMobileMenuOpen(false)} className="flex items-center space-x-2 px-3 py-3 rounded-xl text-slate-300 hover:bg-white/10 transition-colors">
                    <UserCircle className="h-5 w-5 text-slate-400" />
                    <span className="font-medium">Личный кабинет</span>
                  </Link>
                  {user.is_admin && (
                    <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center space-x-2 px-3 py-3 rounded-xl text-slate-300 hover:bg-white/10 transition-colors">
                      <Shield className="h-5 w-5 text-primary-300" />
                      <span className="font-medium">Админ панель</span>
                    </Link>
                  )}
                  <hr className="my-1 border-white/10" />
                  <button onClick={addAnotherAccount} className="flex items-center space-x-2 px-3 py-3 rounded-xl text-left text-slate-300 hover:bg-white/10 transition-colors">
                    <Plus className="h-5 w-5 text-slate-400" />
                    <span>Добавить аккаунт</span>
                  </button>
                  {savedAccounts.length > 0 && (
                    <button onClick={() => { setShowSwitcher(true); setMobileMenuOpen(false); }} className="flex items-center space-x-2 px-3 py-3 rounded-xl text-left text-slate-300 hover:bg-white/10 transition-colors">
                      <Repeat className="h-5 w-5 text-slate-400" />
                      <span>Переключить</span>
                    </button>
                  )}
                  <hr className="my-1 border-white/10" />
                  <button onClick={handleLogout} className="flex items-center space-x-2 px-3 py-3 rounded-xl text-left text-red-300 hover:bg-red-500/10 transition-colors">
                    <LogOut className="h-5 w-5" />
                    <span>Выйти</span>
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-ghost px-3 py-3 font-semibold">
                    Войти
                  </Link>
                  <Link href="/login?mode=register" onClick={() => setMobileMenuOpen(false)} className="btn btn-leaf px-3 py-3 font-semibold">
                    Регистрация
                  </Link>
                </>
              )}

              <button
                onClick={() => { toggleTheme(); setMobileMenuOpen(false); }}
                className="flex items-center space-x-2 px-3 py-3 rounded-xl text-left text-slate-300 hover:bg-white/10 transition-colors"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-300" /> : <Moon className="h-5 w-5 text-primary-300" />}
                <span>{theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {showSwitcher && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => setShowSwitcher(false)}>
          <div className="modal-panel w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h3 className="display-title text-lg">Выберите аккаунт</h3>
              <button onClick={() => setShowSwitcher(false)} className="h-11 w-11 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-2 max-h-80 overflow-y-auto">
              {user && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-primary-500/10 border border-primary-500/30">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 bg-primary-500/20 rounded-full flex items-center justify-center">
                      <UserAvatar user={user} className="h-11 w-11 text-primary-300" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{user.username}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                    <span className="text-xs text-primary-300 font-semibold">Текущий</span>
                  </div>
                </div>
              )}
              {savedAccounts.filter(a => a.user.id !== user?.id).map((account) => (
                <div key={account.user.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors">
                  <button onClick={() => switchAccount(account)} className="flex items-center space-x-3 flex-1 text-left">
                    <div className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center">
                      <UserAvatar user={account.user} className="h-11 w-11 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{account.user.username}</p>
                      <p className="text-xs text-slate-400">{account.user.email}</p>
                    </div>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); removeSavedAccount(account.user.id); }} className="text-slate-500 hover:text-red-300 p-1">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
