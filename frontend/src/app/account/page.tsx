'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { accountAPI, User, Booking, mediaUrl } from '@/lib/api';
import {
  Camera, MapPin, Mail, CalendarDays, BadgeCheck, Loader2,
  AlertCircle, CheckCircle, ShoppingBag, ArrowRightLeft, Save,
} from 'lucide-react';
import { PageShell, PageContainer, SurfaceCard, Field, TextInput, TextArea, ActionButton, AlertBox, ToneBadge, SegmentedTabs } from '@/components/ui';
import SpeciesIcon from '@/components/SpeciesIcon';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('ru-RU');
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ username: '', city: '', bio: '' });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [tab, setTab] = useState<'purchases' | 'deals'>('purchases');
  const [purchases, setPurchases] = useState<Booking[]>([]);
  const [deals, setDeals] = useState<Booking[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!savedUser || !token) {
      router.push('/login');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await accountAPI.getProfile();
        if (cancelled) return;
        setUser(res.data);
        setForm({
          username: res.data.username,
          city: res.data.city || '',
          bio: res.data.bio || '',
        });
      } catch {
        router.push('/login');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setHistoryLoading(true);
      try {
        const [p, d] = await Promise.all([
          accountAPI.getBookings(),
          accountAPI.getDeals(),
        ]);
        if (cancelled) return;
        setPurchases(p.data);
        setDeals(d.data);
      } catch (err: any) {
        if (!cancelled) setError(err.response?.data?.detail || 'Не удалось загрузить историю');
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const res = await accountAPI.updateProfile({
        username: form.username.trim(),
        city: form.city.trim(),
        bio: form.bio.trim(),
      });
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      window.dispatchEvent(new Event('user-updated'));
      setSuccess('Профиль сохранён');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setSuccess('');

    if (file.size > MAX_AVATAR_SIZE) {
      setError('Размер файла не должен превышать 5 МБ');
      return;
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Допустимые форматы: JPG, PNG, GIF, WebP');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);

    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await accountAPI.uploadAvatar(fd);
      setUser(res.data);
      setAvatarPreview(null);
      localStorage.setItem('user', JSON.stringify(res.data));
      window.dispatchEvent(new Event('user-updated'));
      setSuccess('Аватар обновлён');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка загрузки аватара');
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  const avatarSrc = avatarPreview || mediaUrl(user?.avatar_url);

  const currentTabBookings = tab === 'purchases' ? purchases : deals;
  const emptyText = tab === 'purchases'
    ? 'Вы пока не участвовали в сделках как покупатель'
    : 'На ваших питомцев пока не было бронирований';

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-screen items-center justify-center px-4">
          <SurfaceCard className="flex items-center gap-3 px-7 py-5">
            <Loader2 className="h-8 w-8 animate-spin text-primary-300" />
            <span className="font-semibold text-white">Загружаем профиль…</span>
          </SurfaceCard>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageContainer>
        <div className="space-y-6">
          {error && (
            <AlertBox tone="danger">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </AlertBox>
          )}
          {success && (
            <AlertBox tone="success">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <span>{success}</span>
            </AlertBox>
          )}

          <SurfaceCard className="p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="relative flex-shrink-0">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[1.75rem] border-2 border-primary-400/50 bg-white/10 sm:h-28 sm:w-28">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="Аватар" className="h-full w-full object-cover" />
                  ) : (
                    <SpeciesIcon iconKey="unknown" className="h-12 w-12 text-primary-300" />
                  )}
                </div>
                {avatarUploading ? (
                  <div className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary-600">
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-white shadow-neon-violet transition-colors hover:bg-primary-500"
                    title="Сменить аватар"
                    aria-label="Сменить аватар"
                  >
                    <Camera className="h-5 w-5" />
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="display-title break-words text-2xl sm:text-3xl">{user?.username}</h1>
                  {user?.is_verified && (
                    <ToneBadge tone="leaf">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Верифицирован
                    </ToneBadge>
                  )}
                </div>
                <p className="lede mt-1 break-words">{user?.bio || 'Пока нет описания'}</p>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" /> <span>{user?.email}</span>
                  </span>
                  {user?.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" /> <span>{user.city}</span>
                    </span>
                  )}
                  {user?.created_at && (
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-4 w-4" /> <span>С {formatDate(user.created_at)}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleSave} className="mt-8 space-y-5 border-t border-white/10 pt-6">
              <h2 className="display-title text-lg">Редактировать профиль</h2>

              <Field label="Имя пользователя" hint="Имя используется для входа и отображается в чате">
                <TextInput
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                  minLength={3}
                  maxLength={50}
                />
              </Field>

              <Field label="Город">
                <TextInput
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                  maxLength={100}
                  placeholder="Например: Москва"
                />
              </Field>

              <Field label="О себе">
                <TextArea
                  value={form.bio}
                  onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                  maxLength={1000}
                  rows={4}
                  placeholder="Расскажите о себе потенциальным собеседникам"
                />
              </Field>

              <ActionButton type="submit" variant="primary" disabled={saving} className="px-7">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>{saving ? 'Сохранение…' : 'Сохранить'}</span>
              </ActionButton>
            </form>
          </SurfaceCard>

          <SurfaceCard className="overflow-hidden">
            <div className="border-b border-white/10 p-4 sm:p-5">
              <SegmentedTabs<'purchases' | 'deals'>
                value={tab}
                onChange={setTab}
                options={[
                  { value: 'purchases', label: 'История покупок', icon: <ShoppingBag className="h-5 w-5" /> },
                  { value: 'deals', label: 'Проведённые сделки', icon: <ArrowRightLeft className="h-5 w-5" /> },
                ]}
              />
            </div>

            <div className="p-4 sm:p-6">
              {historyLoading ? (
                <div className="flex items-center justify-center gap-3 py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-300" />
                  <span className="font-semibold text-white">Загружаем историю…</span>
                </div>
              ) : currentTabBookings.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-slate-400">{emptyText}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentTabBookings.map((b) => {
                    const counterpart = tab === 'purchases'
                      ? { label: 'Продавец', name: b.pet?.owner?.username }
                      : { label: 'Покупатель', name: b.buyer?.username };
                    return (
                      <div
                        key={b.id}
                        className="surface-soft flex flex-col overflow-hidden sm:flex-row"
                      >
                        <div className="flex h-40 items-center justify-center bg-white/5 sm:h-auto sm:w-44">
                          {b.pet?.image_url ? (
                            <img
                              src={mediaUrl(b.pet.image_url)}
                              alt={b.pet.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <SpeciesIcon species={b.pet?.species} className="h-14 w-14 text-primary-300" />
                          )}
                        </div>
                        <div className="flex-1 p-4 sm:p-5">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="display-title break-words text-lg">
                                {b.pet?.name || 'Питомец удалён'}
                              </h3>
                              <p className="text-sm text-slate-400">{b.pet?.species || ''}</p>
                            </div>
                            <ToneBadge tone={b.status === 'active' ? 'leaf' : 'rose'}>
                              {b.status === 'active' ? 'Активно' : 'Отменено'}
                            </ToneBadge>
                          </div>

                          <div className="mt-3 space-y-1 text-sm text-slate-400">
                            <p>
                              {counterpart.label}: <span className="font-semibold text-slate-200">{counterpart.name || '—'}</span>
                            </p>
                            {b.pet?.city && (
                              <p className="inline-flex items-center">
                                <MapPin className="mr-1 h-4 w-4 text-green-300" />
                                {b.pet.city}
                              </p>
                            )}
                            <p>Дата: {formatDate(b.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </SurfaceCard>
        </div>
      </PageContainer>
    </PageShell>
  );
}
