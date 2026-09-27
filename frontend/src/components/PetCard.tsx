'use client';

import Link from 'next/link';
import { Pet, mediaUrl } from '@/lib/api';
import { Calendar, Heart, MapPin, Shield, AlertTriangle } from 'lucide-react';
import SpeciesIcon from '@/components/SpeciesIcon';
import { ToneBadge } from '@/components/ui';

interface PetCardProps {
  pet: Pet;
}

export default function PetCard({ pet }: PetCardProps) {
  const isUnknown =
    pet.species === 'Неизвестно' ||
    !pet.breed ||
    pet.breed.trim() === '' ||
    pet.breed.toLowerCase().includes('неизвестн');

  const getStatusBadge = () => {
    switch (pet.status) {
      case 'available':
        return <ToneBadge tone="leaf">Доступен</ToneBadge>;
      case 'booked':
        return <ToneBadge tone="amber">Забронирован</ToneBadge>;
      case 'transferred':
        return <ToneBadge tone="neutral">Передан</ToneBadge>;
      default:
        return null;
    }
  };

  const ageLabel = (age: number) =>
    age === 1 ? 'год' : age < 5 ? 'года' : 'лет';

  return (
    <Link href={`/pet/${pet.id}`} className="block h-full focus:outline-none" aria-label={`Анкета питомца ${pet.name}`}>
      <article className="group surface-card flex h-full cursor-pointer flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:border-primary-400/50 hover:shadow-neon-violet-lg">
        <div className="relative h-48 overflow-hidden sm:h-52">
          {pet.image_url ? (
            <img
              src={mediaUrl(pet.image_url)}
              alt={pet.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-500/25 via-primary-900/30 to-green-900/25 transition-transform duration-500 group-hover:scale-110" aria-hidden="true">
              <SpeciesIcon species={pet.species} className="h-16 w-16 text-primary-300" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 to-transparent" aria-hidden="true" />
          <span className="badge badge-neutral absolute left-3 top-3 backdrop-blur-sm">
            {pet.species}
          </span>
          <div className="absolute right-3 top-3">{getStatusBadge()}</div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          {isUnknown && (
            <div className="alert alert-warning mb-3 px-3 py-2 text-xs">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span className="font-semibold">Порода уточняется у владельца</span>
            </div>
          )}

          <div className="mb-1.5 flex items-start justify-between gap-3">
            <h3 className="display-title text-xl leading-tight">{pet.name}</h3>
            <Heart className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-300 transition-transform group-hover:scale-110 group-hover:text-primary-200" aria-hidden="true" />
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
            {pet.city && (
              <span className="inline-flex items-center">
                <MapPin className="mr-1.5 h-4 w-4 flex-shrink-0 text-green-300" />
                {pet.city}
              </span>
            )}
            {pet.breed && (
              <span className="truncate">
                <span className="text-slate-500">Порода: </span>{pet.breed}
              </span>
            )}
            {!isUnknown && pet.age !== null && (
              <span className="inline-flex items-center">
                <Calendar className="mr-1 h-4 w-4 flex-shrink-0 text-slate-500" />
                <span>{pet.age} {ageLabel(pet.age)}</span>
              </span>
            )}
          </div>

          {pet.character && (
            <p className="mt-2 text-sm text-slate-400">
              <span className="text-slate-500">Характер: </span>{pet.character}
            </p>
          )}

          <p className="mb-3 mt-2 flex-1 text-sm leading-relaxed text-slate-300 line-clamp-2">
            {pet.description}
          </p>

          {pet.vaccination_info && (
            <div className="mb-3 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-green-300">
              <Shield className="h-4 w-4 flex-shrink-0" />
              <span>Привит</span>
            </div>
          )}

          {pet.owner && (
            <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/10 pt-3 text-xs text-slate-500">
              <span className="truncate">Владелец: {pet.owner.username}</span>
              <span className="font-bold uppercase tracking-[0.14em] text-primary-300 transition-colors group-hover:text-primary-200">
                Анкета →
              </span>
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
