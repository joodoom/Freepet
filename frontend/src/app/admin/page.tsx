'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminAPI, User as UserType, Pet, Complaint } from '@/lib/api';
import {
  Users, PawPrint, Calendar, Clock, CheckCircle, XCircle,
  Shield, Trash2, Loader2, BarChart3, Flag, Ban
} from 'lucide-react';
import { PageShell, SurfaceCard, StatTile, ToneBadge, EmptyState } from '@/components/ui';

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'pets' | 'users' | 'complaints'>('stats');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!savedUser || !token) {
      router.push('/login');
      return;
    }
    const userData = JSON.parse(savedUser);
    if (!userData.is_admin) {
      router.push('/');
      return;
    }
    setUser(userData);
    loadData();
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, petsRes, usersRes, complaintsRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getAllPets(),
        adminAPI.getAllUsers(),
        adminAPI.getComplaints(),
      ]);
      setStats(statsRes.data);
      setPets(petsRes.data);
      setUsers(usersRes.data);
      setComplaints(complaintsRes.data);
    } catch (err) {
      console.error('Ошибка загрузки данных:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (petId: number) => {
    setActionLoading(petId);
    try {
      await adminAPI.approvePet(petId);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (petId: number) => {
    setActionLoading(petId);
    try {
      await adminAPI.rejectPet(petId);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBlock = async (userId: number) => {
    try {
      await adminAPI.blockUser(userId);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnblock = async (userId: number) => {
    try {
      await adminAPI.unblockUser(userId);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePet = async (petId: number) => {
    if (!confirm('Удалить эту анкету?')) return;
    try {
      await adminAPI.deletePet(petId);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveComplaint = async (type: string, id: number) => {
    setActionLoading(id);
    try {
      await adminAPI.resolveComplaint(type, id);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBanFromComplaint = async (type: string, id: number) => {
    if (!confirm('Заблокировать пользователя?')) return;
    setActionLoading(id);
    try {
      await adminAPI.banFromComplaint(type, id);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-screen items-center justify-center px-4">
          <SurfaceCard className="flex items-center gap-3 px-7 py-5">
            <Loader2 className="h-8 w-8 animate-spin text-primary-300" />
            <span className="font-semibold text-white">Загружаем панель…</span>
          </SurfaceCard>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="brand-mark" aria-hidden="true">
            <Shield className="h-6 w-6" />
          </span>
          <div>
            <p className="eyebrow">Управление платформой</p>
            <h1 className="display-title mt-1 text-3xl sm:text-4xl">Админ панель</h1>
          </div>
        </div>

        <div className="surface-soft mb-8 flex gap-2 overflow-x-auto p-1.5">
          <button
            onClick={() => setActiveTab('stats')}
            aria-pressed={activeTab === 'stats'}
            className={`flex min-h-[44px] flex-shrink-0 items-center whitespace-nowrap rounded-full px-5 font-bold transition-all ${activeTab === 'stats' ? 'bg-primary-600 text-white shadow-neon-violet' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
          >
            <BarChart3 className="mr-1.5 h-4 w-4" /> Статистика
          </button>
          <button
            onClick={() => setActiveTab('pets')}
            aria-pressed={activeTab === 'pets'}
            className={`flex min-h-[44px] flex-shrink-0 items-center whitespace-nowrap rounded-full px-5 font-bold transition-all ${activeTab === 'pets' ? 'bg-primary-600 text-white shadow-neon-violet' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
          >
            <PawPrint className="mr-1.5 h-4 w-4" /> Анкеты ({pets.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            aria-pressed={activeTab === 'users'}
            className={`flex min-h-[44px] flex-shrink-0 items-center whitespace-nowrap rounded-full px-5 font-bold transition-all ${activeTab === 'users' ? 'bg-primary-600 text-white shadow-neon-violet' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
          >
            <Users className="mr-1.5 h-4 w-4" /> Пользователи ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('complaints')}
            aria-pressed={activeTab === 'complaints'}
            className={`relative flex min-h-[44px] flex-shrink-0 items-center whitespace-nowrap rounded-full px-5 font-bold transition-all ${activeTab === 'complaints' ? 'bg-red-600 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
          >
            <Flag className="mr-1.5 h-4 w-4" /> Жалобы
            {complaints.length > 0 && (
              <span className="absolute -right-1 -top-1 min-w-[20px] rounded-full bg-red-500 px-1.5 py-0.5 text-center text-xs font-bold text-white">
                {complaints.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'stats' && stats && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile icon={<Users className="h-6 w-6" />} value={stats.users} label="Пользователей" />
            <StatTile icon={<PawPrint className="h-6 w-6" />} value={stats.pets} label="Анкет" />
            <StatTile icon={<Calendar className="h-6 w-6" />} value={stats.bookings} label="Бронирований" />
            <StatTile icon={<Clock className="h-6 w-6" />} value={stats.pending_moderation} label="На модерации" />
          </div>
        )}

        {activeTab === 'pets' && (
          <SurfaceCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-bold text-slate-400">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-slate-400">Имя</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-slate-400">Вид</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-slate-400">Владелец</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-slate-400">Статус</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-slate-400">Модерация</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-slate-400">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {pets.map((pet) => (
                    <tr key={pet.id} className="transition-colors hover:bg-white/5">
                      <td className="px-4 py-3 text-sm text-slate-300">{pet.id}</td>
                      <td className="px-4 py-3 text-sm font-bold text-slate-200">{pet.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-300">{pet.species}</td>
                      <td className="px-4 py-3 text-sm text-slate-300">{pet.owner?.username || '—'}</td>
                      <td className="px-4 py-3 text-sm">
                        <ToneBadge tone={pet.status === 'available' ? 'leaf' : pet.status === 'booked' ? 'amber' : 'neutral'}>
                          {pet.status}
                        </ToneBadge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <ToneBadge tone={pet.moderation_status === 'approved' ? 'leaf' : pet.moderation_status === 'pending' ? 'amber' : 'rose'}>
                          {pet.moderation_status}
                        </ToneBadge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-wrap items-center gap-3">
                          {pet.moderation_status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(pet.id)}
                                disabled={actionLoading === pet.id}
                                className="inline-flex items-center gap-1 font-semibold text-green-300 transition-colors hover:text-green-200 disabled:opacity-50"
                              >
                                <CheckCircle className="h-4 w-4" /> Одобрить
                              </button>
                              <button
                                onClick={() => handleReject(pet.id)}
                                disabled={actionLoading === pet.id}
                                className="inline-flex items-center gap-1 font-semibold text-red-300 transition-colors hover:text-red-200 disabled:opacity-50"
                              >
                                <XCircle className="h-4 w-4" /> Отклонить
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeletePet(pet.id)}
                            className="inline-flex items-center gap-1 font-semibold text-red-400 transition-colors hover:text-red-300"
                            aria-label={`Удалить анкету ${pet.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SurfaceCard>
        )}

        {activeTab === 'users' && (
          <SurfaceCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-bold text-slate-400">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-slate-400">Имя</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-slate-400">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-slate-400">Верифицирован</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-slate-400">Статус</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-slate-400">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {users.map((u) => (
                    <tr key={u.id} className="transition-colors hover:bg-white/5">
                      <td className="px-4 py-3 text-sm text-slate-300">{u.id}</td>
                      <td className="px-4 py-3 text-sm font-bold text-slate-200">{u.username}</td>
                      <td className="px-4 py-3 text-sm text-slate-300">{u.email}</td>
                      <td className="px-4 py-3 text-sm">
                        {u.is_verified ? (
                          <CheckCircle className="h-4 w-4 text-green-300" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-300" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <ToneBadge tone={u.is_blocked ? 'rose' : 'leaf'}>
                          {u.is_blocked ? 'Заблокирован' : 'Активен'}
                        </ToneBadge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {!u.is_admin && (
                          u.is_blocked ? (
                            <button onClick={() => handleUnblock(u.id)} className="font-semibold text-green-300 transition-colors hover:text-green-200">
                              Разблокировать
                            </button>
                          ) : (
                            <button onClick={() => handleBlock(u.id)} className="font-semibold text-red-300 transition-colors hover:text-red-200">
                              Заблокировать
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SurfaceCard>
        )}

        {activeTab === 'complaints' && (
          <div className="space-y-4">
            {complaints.length === 0 ? (
              <EmptyState
                icon={<Flag className="h-8 w-8" aria-hidden="true" />}
                title="Нет активных жалоб"
                description="Все обращения пользователей рассмотрены."
              />
            ) : (
              complaints.map((c) => (
                <SurfaceCard key={`${c.type}-${c.id}`} className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <ToneBadge tone={c.type === 'message' ? 'amber' : 'rose'}>
                          {c.type === 'message' ? 'На сообщение' : 'На пользователя'}
                        </ToneBadge>
                        <span className="text-xs text-slate-400">
                          {new Date(c.created_at).toLocaleString('ru-RU')}
                        </span>
                      </div>
                      <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                        <span className="text-slate-400">От:</span>
                        <span className="font-bold text-slate-200">{c.reporter_username}</span>
                        <span className="text-slate-400">→</span>
                        <span className="text-slate-400">На:</span>
                        <span className="font-bold text-red-300">{c.target_username}</span>
                      </div>
                      <div className="mb-1 flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-slate-400">Причина:</span>
                        <span className="font-bold text-slate-200">{c.reason}</span>
                      </div>
                      {c.comment && (
                        <p className="mt-1 break-words text-sm italic text-slate-400">“{c.comment}”</p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:ml-4">
                      <button
                        onClick={() => handleResolveComplaint(c.type, c.id)}
                        disabled={actionLoading === c.id}
                        className="btn btn-leaf px-4 py-2 text-sm disabled:opacity-50"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Рассмотрена</span>
                      </button>
                      <button
                        onClick={() => handleBanFromComplaint(c.type, c.id)}
                        disabled={actionLoading === c.id}
                        className="btn bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-500 disabled:opacity-50"
                      >
                        <Ban className="h-4 w-4" />
                        <span>Забанить</span>
                      </button>
                    </div>
                  </div>
                </SurfaceCard>
              ))
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
