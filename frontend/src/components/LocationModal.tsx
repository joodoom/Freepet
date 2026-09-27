'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { X, MapPin, RefreshCw, Check } from 'lucide-react';
import { POPULAR_CITIES } from '@/lib/cities';
import { ActionButton } from '@/components/ui';

const MapPicker = dynamic(() => import('@/components/MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="surface-soft flex h-64 items-center justify-center">
      <span className="text-sm text-slate-500">Загрузка карты...</span>
    </div>
  ),
});

interface LocationModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (city: string, coords: [number, number] | null) => void;
  onAutoSelect?: (city: string, coords: [number, number] | null) => void;
}

export default function LocationModal({
  open,
  onClose,
  onSelect,
  onAutoSelect,
}: LocationModalProps) {
  const [mode, setMode] = useState<'pick' | 'map'>('pick');
  const [detectedCity, setDetectedCity] = useState<string | null>(null);
  const [chosenCoords, setChosenCoords] = useState<[number, number] | null>(null);

  if (!open) return null;

  const reset = () => {
    setMode('pick');
    setDetectedCity(null);
    setChosenCoords(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const openMap = () => {
    setMode('map');
    setDetectedCity(null);
    setChosenCoords(null);
  };

  const handleAutoDetect = (city: string, coords: [number, number] | null) => {
    setDetectedCity(city);
    setChosenCoords(coords);
    if (onAutoSelect) {
      // for add-pet: keep modal open so user can confirm manually
      return;
    }
    // for home: apply immediately
    onSelect(city, coords);
    handleClose();
  };

  const handleConfirmDetected = () => {
    if (detectedCity) {
      onSelect(detectedCity, chosenCoords);
      handleClose();
    }
  };

  const handlePickCity = (city: string) => {
    onSelect(city, null);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="modal-panel w-full max-w-lg p-6 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Локация</p>
            <h2 className="display-title mt-1 flex items-center text-2xl">
              <MapPin className="mr-2 h-5 w-5 text-primary-300" />
              Ваш город
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-11 w-11 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Закрыть выбор города"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {mode === 'pick' && (
          <>
            <p className="lede mt-3 text-sm">
              Выберите свой город из списка или определите местоположение автоматически.
            </p>

            <div className="mb-5 mt-4 flex flex-wrap gap-2">
              {POPULAR_CITIES.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => handlePickCity(city)}
                  className="btn btn-ghost min-h-11 px-4 py-2.5 text-sm"
                >
                  {city}
                </button>
              ))}
            </div>

            <div className="border-t border-white/10 pt-4">
              <ActionButton variant="primary" className="w-full py-3" onClick={openMap}>
                <RefreshCw className="h-5 w-5" />
                Определить местоположение
              </ActionButton>
            </div>
          </>
        )}

        {mode === 'map' && (
          <>
            {detectedCity ? (
              <div className="alert alert-success mb-4 mt-4">
                <Check className="h-4 w-4 flex-shrink-0" />
                <p className="text-sm">
                  Определён город: <span className="font-bold">{detectedCity}</span>
                </p>
              </div>
            ) : (
              <p className="lede mb-4 mt-4 text-sm">
                Кликните на карту в нужном месте (метку можно перетащить), затем нажмите «Подтвердить».
              </p>
            )}

            <div className="surface-soft overflow-hidden p-2">
              <MapPicker
                autoDetect
                onAutoSelect={handleAutoDetect}
                onManualSelect={handleAutoDetect}
              />
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              {detectedCity && (
                <ActionButton variant="leaf" onClick={handleConfirmDetected}>
                  Подтвердить
                </ActionButton>
              )}
              <ActionButton variant="ghost" onClick={handleClose}>
                Указать вручную
              </ActionButton>
              <ActionButton variant="ghost" onClick={() => setMode('pick')}>
                Выбрать из списка
              </ActionButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
