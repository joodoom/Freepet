'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { petsAPI, bookingsAPI, messagesAPI, Pet, User, mediaUrl } from '@/lib/api';
import PetMap from '@/components/PetMap';
import SpeciesIcon from '@/components/SpeciesIcon';
import {
  Calendar,
  MapPin,
  Heart,
  Shield,
  AlertTriangle,
  User as UserIcon,
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  Flag,
  X,
} from 'lucide-react';
import { PageShell, SurfaceCard, SurfaceSoft, ActionButton, AlertBox, ToneBadge } from '@/components/ui';

export default function PetDetailPage() {
  const router = useRouter();
  const params = useParams();
  const petId = Number(params.id);

  const [pet, setPet] = useState<Pet | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reportUserModal, setReportUserModal] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportComment, setReportComment] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    fetchPet();
  }, [petId]);

  const fetchPet = async () => {
    setLoading(true);
    try {
      const response = await petsAPI.get(petId);
      setPet(response.data);
    } catch (err) {
      console.error('Ошибка загрузки питомца:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setBookingLoading(true);
    setError('');
    setSuccess('');

    try {
      await bookingsAPI.create(petId);
      setSuccess('Питомец успешно забронирован!');
      fetchPet();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при бронировании');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleReportUser = async () => {
    if (!reportReason || !reportUserModal) return;
    try {
      await messagesAPI.reportUser({
        reported_user_id: reportUserModal,
        reason: reportReason,
        comment: reportComment || undefined,
      });
      setReportUserModal(null);
      setReportReason('');
      setReportComment('');
      setSuccess('Жалоба отправлена');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при отправке жалобы');
    }
  };

  const isUnknown =
    pet?.species === 'Неизвестно' ||
    !pet?.breed ||
    pet.breed.trim() === '' ||
    pet.breed.toLowerCase().includes('неизвестн');

  const getStatusBadge = () => {
    if (!pet) return null;

    switch (pet.status) {
      case 'available':
        return (
          <ToneBadge tone="leaf">
            <CheckCircle className="h-4 w-4" />
            Доступен
          </ToneBadge>
        );
      case 'booked':
        return (
          <ToneBadge tone="amber">
            <Clock className="h-4 w-4" />
            Забронирован
          </ToneBadge>
        );
      case 'transferred':
        return (
          <ToneBadge tone="neutral">
            <CheckCircle className="h-4 w-4" />
            Передан
          </ToneBadge>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-screen items-center justify-center px-4">
          <SurfaceCard className="flex items-center gap-3 px-7 py-5">
            <Loader2 className="h-8 w-8 animate-spin text-primary-300" />
            <span className="font-semibold text-white">Загружаем анкету…</span>
          </SurfaceCard>
        </div>
      </PageShell>
    );
  }

  if (!pet) {
    return (
      <PageShell>
        <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
          <SurfaceCard className="max-w-md px-8 py-12">
            <XCircle className="mx-auto mb-4 h-16 w-16 text-red-300" />
            <h2 className="display-title text-2xl">Питомец не найден</h2>
            <button
              onClick={() => router.push('/')}
              className="mt-4 font-bold text-primary-300 transition-colors hover:text-primary-200"
            >
              Вернуться на главную
            </button>
          </SurfaceCard>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <button
          onClick={() => router.back()}
          className="btn btn-ghost mb-6 px-5 py-2 text-sm"
        >
          <ArrowLeft className="h-5 w-5" />
          Назад
        </button>

        <SurfaceCard className="overflow-hidden">
          <div className="grid lg:grid-cols-[1.05fr_1fr]">
            <div className="relative min-h-[320px] bg-gradient-to-br from-primary-500/20 via-[#2a1a0d] to-green-900/20 sm:min-h-[420px] lg:min-h-full">
              {pet.image_url ? (
                <img
                  src={mediaUrl(pet.image_url)}
                  alt={pet.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <SpeciesIcon species={pet.species} className="h-32 w-32 text-primary-300 sm:h-40 sm:w-40" />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/60 to-transparent" aria-hidden="true" />
              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                <span className="badge badge-neutral backdrop-blur-sm">{pet.species}</span>
                {getStatusBadge()}
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <p className="eyebrow">Анкета питомца</p>
              <h1 className="display-title mt-2 break-words text-3xl sm:text-4xl">{pet.name}</h1>

              {isUnknown && (
                <div className="mt-4">
                  <AlertBox tone="warning">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <div>
                      <p className="font-bold">Неизвестная порода</p>
                      <p className="mt-1 text-sm opacity-90">
                        Порода, состояние здоровья и характер неизвестны или указаны приблизительно и могут быть неточными. Перед принятием решения уточняйте детали у владельца.
                      </p>
                    </div>
                  </AlertBox>
                </div>
              )}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {pet.breed && (
                  <SurfaceSoft className="p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Порода</p>
                    <p className="mt-1 font-semibold text-white">{pet.breed}</p>
                  </SurfaceSoft>
                )}

                {pet.character && (
                  <SurfaceSoft className="p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Характер</p>
                    <p className="mt-1 font-semibold text-white">{pet.character}</p>
                  </SurfaceSoft>
                )}

                {pet.city && (
                  <SurfaceSoft className="p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Город</p>
                    <p className="mt-1 inline-flex items-center font-semibold text-white">
                      <MapPin className="mr-1.5 h-4 w-4 text-primary-300" />
                      {pet.city}
                    </p>
                  </SurfaceSoft>
                )}

                {!isUnknown && pet.age !== null && (
                  <SurfaceSoft className="p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Возраст</p>
                    <p className="mt-1 inline-flex items-center font-semibold text-white">
                      <Calendar className="mr-1.5 h-4 w-4 text-slate-400" />
                      {pet.age} {pet.age === 1 ? 'год' : pet.age < 5 ? 'года' : 'лет'}
                    </p>
                  </SurfaceSoft>
                )}
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-400">Описание</h3>
                <p className="mt-2 whitespace-pre-wrap leading-relaxed text-slate-200">{pet.description}</p>
              </div>

              {pet.vaccination_info && (
                <div className="alert alert-success mt-5">
                  <Shield className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="font-bold">Прививки</p>
                    <p className="mt-1 text-sm opacity-90">{pet.vaccination_info}</p>
                  </div>
                </div>
              )}

              {pet.health_issues && (
                <div className="alert alert-warning mt-4">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="font-bold">Здоровье{isUnknown ? ' (приблизительно)' : ''}</p>
                    <p className="mt-1 text-sm opacity-90">{pet.health_issues}</p>
                  </div>
                </div>
              )}

              {pet.city && process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY && (
                <div className="mt-6">
                  <h3 className="mb-2 inline-flex items-center text-sm font-bold uppercase tracking-[0.16em] text-slate-400">
                    <MapPin className="mr-1 h-4 w-4 text-primary-300" />
                    Где находится
                  </h3>
                  <PetMap pet={pet} />
                </div>
              )}

              {pet.owner && user && user.id !== pet.owner.id && (
                <div className="mb-5 mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4 text-slate-300">
                  <div className="flex min-w-0 items-center">
                    <UserIcon className="mr-2 h-5 w-5 flex-shrink-0 text-slate-400" />
                    <span className="truncate">Добавил: {pet.owner.username}</span>
                  </div>
                  <button
                    onClick={() => setReportUserModal(pet.owner!.id)}
                    className="inline-flex items-center gap-1 whitespace-nowrap text-sm text-slate-400 transition-colors hover:text-red-300"
                  >
                    <Flag className="h-4 w-4" />
                    <span>Пожаловаться</span>
                  </button>
                </div>
              )}
              {pet.owner && user && user.id === pet.owner.id && (
                <div className="mb-5 mt-6 flex items-center border-t border-white/10 pt-4 text-slate-300">
                  <UserIcon className="mr-2 h-5 w-5 text-slate-400" />
                  <span>Добавил: {pet.owner.username}</span>
                </div>
              )}

              {error && (
                <div className="mb-4">
                  <AlertBox tone="danger"><span className="text-sm">{error}</span></AlertBox>
                </div>
              )}

              {success && (
                <div className="mb-4">
                  <AlertBox tone="success"><span className="text-sm">{success}</span></AlertBox>
                </div>
              )}

              {pet.status === 'available' && pet.moderation_status === 'approved' && (
                <ActionButton
                  onClick={handleBooking}
                  disabled={bookingLoading || (user?.id === pet.user_id)}
                  variant="primary"
                  className="w-full py-3"
                >
                  {bookingLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Бронирование...</span>
                    </>
                  ) : user?.id === pet.user_id ? (
                    <span>Это ваш питомец</span>
                  ) : (
                    <>
                      <Heart className="h-5 w-5" />
                      <span>Забронировать</span>
                    </>
                  )}
                </ActionButton>
              )}

              {user && user.id !== pet.user_id && (
                <button
                  onClick={() => router.push(`/chat?user=${pet.user_id}`)}
                  className="btn btn-leaf mt-3 w-full py-3"
                >
                  <MessageSquare className="h-5 w-5" />
                  <span>Написать владельцу</span>
                </button>
              )}

              {pet.status === 'booked' && (
                <div className="py-3 text-center text-slate-400">
                  Питомец уже забронирован
                </div>
              )}

              {pet.moderation_status === 'pending' && (
                <div className="py-3 text-center text-amber-300">
                  Ожидает модерации
                </div>
              )}

              {pet.moderation_status === 'rejected' && (
                <div className="py-3 text-center text-red-300">
                  Анкета отклонена модерацией
                  {pet.rejection_reason && (
                    <p className="mt-1 text-sm opacity-80">{pet.rejection_reason}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </SurfaceCard>
      </div>

      {reportUserModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="modal-panel w-full max-w-sm">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <h3 className="display-title text-lg">Пожаловаться на пользователя</h3>
              <button
                onClick={() => { setReportUserModal(null); setReportReason(''); setReportComment(''); }}
                className="flex h-11 w-11 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Закрыть жалобу"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 p-5">
              <div className="space-y-1">
                {['Спам', 'Оскорбления', 'Мошенничество', 'Неприемлемое поведение', 'Другое'].map((r) => (
                  <label key={r} className="flex cursor-pointer items-center space-x-2 rounded-xl px-2 py-2 transition-colors hover:bg-white/5">
                    <input
                      type="radio"
                      name="report_reason"
                      value={r}
                      checked={reportReason === r}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="h-4 w-4 text-primary-400 focus:ring-primary-400"
                    />
                    <span className="text-sm text-slate-300">{r}</span>
                  </label>
                ))}
              </div>
              <textarea
                value={reportComment}
                onChange={(e) => setReportComment(e.target.value)}
                className="field resize-none text-sm"
                rows={2}
                placeholder="Комментарий (необязательно)"
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-white/10 p-5">
              <button
                onClick={() => { setReportUserModal(null); setReportReason(''); setReportComment(''); }}
                className="btn btn-ghost px-4 py-2 text-sm"
              >
                Отмена
              </button>
              <button
                onClick={handleReportUser}
                disabled={!reportReason}
                className="btn bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-500 disabled:opacity-50"
              >
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
