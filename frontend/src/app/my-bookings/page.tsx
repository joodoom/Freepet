'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { bookingsAPI, Booking, User, mediaUrl } from '@/lib/api';
import { Calendar, Heart, XCircle, Loader2, AlertCircle, MessageSquare, PawPrint, MapPin } from 'lucide-react';
import { PageShell, PageContainer, SurfaceCard, AlertBox, ActionButton, EmptyState } from '@/components/ui';
import SpeciesIcon from '@/components/SpeciesIcon';

export default function MyBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelingId, setCancelingId] = useState<number | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!savedUser || !token) {
      router.push('/login');
      return;
    }
    fetchBookings();
  }, [router]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await bookingsAPI.getMy();
      setBookings(response.data);
    } catch (err) {
      console.error('Ошибка загрузки бронирований:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId: number) => {
    setCancelingId(bookingId);
    setError('');

    try {
      await bookingsAPI.cancel(bookingId);
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при отмене бронирования');
    } finally {
      setCancelingId(null);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-screen items-center justify-center px-4">
          <SurfaceCard className="flex items-center gap-3 px-7 py-5">
            <Loader2 className="h-8 w-8 animate-spin text-primary-300" />
            <span className="font-semibold text-white">Загружаем бронирования…</span>
          </SurfaceCard>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageContainer>
        <div className="mb-8 max-w-2xl">
          <span className="eyebrow">Ваши заявки</span>
          <h1 className="display-title mt-3 text-3xl sm:text-4xl">Мои бронирования</h1>
          <p className="lede mt-3">Здесь живут питомцы, которых вы уже выбрали. Напишите владельцу и договоритесь о встрече.</p>
        </div>

        {error && (
          <div className="mb-5">
            <AlertBox tone="danger">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </AlertBox>
          </div>
        )}

        {bookings.length === 0 ? (
          <EmptyState
            icon={<Heart className="h-8 w-8" aria-hidden="true" />}
            title="У вас пока нет бронирований"
            description="Выберите питомца в каталоге — он появится здесь вместе с контактом владельца."
            action={
              <Link href="/" className="btn btn-primary px-7 py-3">
                Найти питомца
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <SurfaceCard
                key={booking.id}
                className="overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="flex h-48 items-center justify-center bg-gradient-to-br from-primary-500/20 via-[#2a1a0d] to-green-900/20 sm:h-auto sm:w-52">
                    {booking.pet?.image_url ? (
                      <img
                        src={mediaUrl(booking.pet.image_url)}
                        alt={booking.pet.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <SpeciesIcon species={booking.pet?.species} className="h-16 w-16 text-primary-300" />
                    )}
                  </div>

                  <div className="flex-1 p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="display-title break-words text-xl sm:text-2xl">
                          {booking.pet?.name || 'Неизвестный питомец'}
                        </h3>
                        <p className="mt-1 text-sm text-slate-400">
                          {booking.pet?.species}
                        </p>
                        {booking.pet?.city && (
                          <p className="mt-1 inline-flex items-center text-sm text-slate-300">
                            <MapPin className="mr-1 h-4 w-4 text-green-300" />
                            {booking.pet.city}
                          </p>
                        )}
                        {booking.pet?.age !== null && booking.pet?.age !== undefined && (
                          <p className="mt-2 inline-flex items-center text-sm text-slate-300">
                            <Calendar className="mr-1 h-4 w-4 text-slate-400" />
                            {booking.pet.age} лет
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleCancel(booking.id)}
                        disabled={cancelingId === booking.id}
                        className="flex h-11 w-11 items-center justify-center rounded-full text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200 disabled:opacity-50"
                        aria-label="Отменить бронирование"
                      >
                        {cancelingId === booking.id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <XCircle className="h-5 w-5" />
                        )}
                      </button>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                      <span className="inline-flex items-center text-sm text-slate-400">
                        <PawPrint className="mr-1.5 h-4 w-4 text-primary-300" />
                        Забронировано: {new Date(booking.created_at).toLocaleDateString('ru-RU')}
                      </span>

                      <div className="flex items-center gap-2">
                        <ActionButton
                          variant="leaf"
                          className="px-5 py-2 text-sm"
                          onClick={() => router.push(`/chat?user=${booking.pet?.user_id}`)}
                        >
                          <MessageSquare className="h-4 w-4" />
                          <span>Написать</span>
                        </ActionButton>
                        <Link
                          href={`/pet/${booking.pet_id}`}
                          className="btn btn-ghost px-5 py-2 text-sm"
                        >
                          Подробнее
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </SurfaceCard>
            ))}
          </div>
        )}
      </PageContainer>
    </PageShell>
  );
}
