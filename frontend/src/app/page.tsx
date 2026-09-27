'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { petsAPI, authAPI, Pet, User } from '@/lib/api';
import PetCard from '@/components/PetCard';
import SpeciesIcon from '@/components/SpeciesIcon';
import LocationModal from '@/components/LocationModal';
import { BREED_OPTIONS } from '@/lib/breeds';
import { Search, PawPrint, Loader2, HelpCircle, MapPin, X, HeartHandshake, ShieldCheck, MessagesSquare } from 'lucide-react';
import { PageShell, PageContainer, SurfaceCard, SurfaceSoft, Field, TextInput, SelectField, ActionButton, AlertBox, ToneBadge } from '@/components/ui';

export default function HomePage() {
  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('');
  const [breedFilter, setBreedFilter] = useState('');
  const [unknownOnly, setUnknownOnly] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [cityFilter, setCityFilter] = useState('');
  const [cityModalOpen, setCityModalOpen] = useState(false);

  const speciesOptions = [
    { value: '', label: 'Все виды' },
    { value: 'Собака', label: 'Собаки' },
    { value: 'Кошка', label: 'Кошки' },
    { value: 'Хомяк', label: 'Хомяки' },
    { value: 'Попугай', label: 'Попугаи' },
    { value: 'Рыбка', label: 'Рыбки' },
    { value: 'Черепаха', label: 'Черепахи' },
    { value: 'Кролик', label: 'Кролики' },
  ];

  const breedOptions = BREED_OPTIONS;

  const pluralPets = (n: number) => {
    const s = n % 10;
    const t = n % 100;
    if (t >= 11 && t <= 14) return 'питомцев';
    if (s === 1) return 'питомец';
    if (s >= 2 && s <= 4) return 'питомца';
    return 'питомцев';
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      setUser(u);
      if (u.city) setCityFilter(u.city);
    }
  }, []);

  useEffect(() => {
    fetchPets();
  }, [speciesFilter, breedFilter, unknownOnly, cityFilter]);

  const fetchPets = async () => {
    setLoading(true);
    try {
      const params: { species?: string; breed?: string; search?: string; city?: string; is_unknown?: boolean; other_breed?: boolean } = {};
      if (speciesFilter) params.species = speciesFilter;
      if (unknownOnly) params.is_unknown = true;
      else if (breedFilter === 'other') params.other_breed = true;
      else if (breedFilter) params.breed = breedFilter;
      if (cityFilter) params.city = cityFilter;
      if (search) params.search = search;

      const response = await petsAPI.list(params);
      setPets(response.data);
    } catch (error) {
      console.error('Ошибка загрузки питомцев:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeciesChange = (value: string) => {
    setSpeciesFilter(value);
    setBreedFilter('');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPets();
  };

  const handleMyCity = () => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      router.push('/login');
      return;
    }
    const u = JSON.parse(savedUser);
    setUser(u);
    setCityModalOpen(true);
  };

  const handleCitySelect = async (city: string) => {
    setCityModalOpen(false);
    try {
      const res = await authAPI.updateCity(city);
      if (res.data && res.data.city) {
        localStorage.setItem('user', JSON.stringify(res.data));
        setUser(res.data);
        setCityFilter(res.data.city);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push('/login');
        return;
      }
      setCityFilter(city);
    }
  };

  const steps = [
    { icon: Search, title: 'Найдите', text: 'Выберите вид, породу и город.' },
    { icon: MessagesSquare, title: 'Свяжитесь', text: 'Напишите владельцу в чате.' },
    { icon: HeartHandshake, title: 'Передайте', text: 'Договоритесь о заботливом доме.' },
  ];

  return (
    <PageShell>
      <PageContainer wide>
        <SurfaceCard className="relative mb-8 overflow-hidden p-6 sm:p-10">
          <div className="pointer-events-none absolute -right-10 -top-10 text-primary-300 opacity-15" aria-hidden="true">
            <SpeciesIcon iconKey="unknown" className="h-40 w-40 sm:h-48 sm:w-48" />
          </div>
          <div className="relative grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <span className="eyebrow">ФРИПЕТ · передача животных</span>
              <h1 className="display-title mt-3 text-4xl sm:text-5xl">
                Найди себе <span className="text-primary-200">друга</span>
              </h1>
              <p className="lede mt-4 max-w-xl text-base sm:text-lg">
                Платформа для тех, кто хочет найти верного друга для себя или своей семьи. Проверенные анкеты, живое общение и ответственная передача.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="#catalog" className="btn btn-primary px-7 py-3">
                  Смотреть каталог
                </a>
                <Link href="/add" className="btn btn-ghost px-7 py-3">
                  Добавить питомца
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <ToneBadge tone="leaf">
                  <ShieldCheck className="h-3.5 w-3.5" /> Модерация анкет
                </ToneBadge>
                <ToneBadge tone="amber">
                  <MapPin className="h-3.5 w-3.5" /> Поиск по городу
                </ToneBadge>
                <ToneBadge tone="neutral">
                  <HeartHandshake className="h-3.5 w-3.5" /> Ответственная передача
                </ToneBadge>
              </div>
            </div>

            <SurfaceSoft className="p-6">
              <div className="flex items-center gap-4">
                <span className="brand-mark" aria-hidden="true">
                  <PawPrint className="h-7 w-7" />
                </span>
                <div>
                  <p className="eyebrow">Сейчас в приюте</p>
                  <p className="display-title mt-1 text-3xl">
                    {loading ? '…' : pets.length} {loading ? '' : pluralPets(pets.length)}
                  </p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {steps.map(({ icon: Icon, title, text }) => (
                  <div key={title} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-300">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block font-bold text-white">{title}</span>
                      <span className="block text-sm text-slate-400">{text}</span>
                    </span>
                  </div>
                ))}
              </div>
            </SurfaceSoft>
          </div>
        </SurfaceCard>

        <div id="catalog" className="grid items-start gap-6 lg:grid-cols-[330px_1fr]">
          <SurfaceCard className="p-6 lg:sticky lg:top-24">
            <p className="eyebrow">Фильтры</p>
            <h2 className="display-title mt-2 text-2xl">Подберите питомца</h2>
            <form onSubmit={handleSearch} className="mt-5 space-y-4">
              <Field label="Поиск по имени">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <TextInput
                    type="text"
                    placeholder="Например: Барсик"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="field-has-icon"
                  />
                </div>
              </Field>

              <Field label="Вид животного">
                <SelectField value={speciesFilter} onChange={(e) => handleSpeciesChange(e.target.value)}>
                  {speciesOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectField>
              </Field>

              {speciesFilter && (
                <Field label="Порода">
                  <SelectField value={breedFilter} onChange={(e) => setBreedFilter(e.target.value)}>
                    <option value="">Все породы</option>
                    {breedOptions[speciesFilter]?.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                    <option value="other">Другое</option>
                  </SelectField>
                </Field>
              )}

              <button
                type="button"
                onClick={() => setUnknownOnly(!unknownOnly)}
                aria-pressed={unknownOnly}
                className={`btn w-full px-4 py-2.5 text-sm ${unknownOnly ? 'btn-primary' : 'btn-ghost'}`}
              >
                <HelpCircle className="h-5 w-5" />
                <span>Неизвестная порода</span>
              </button>

              <button
                type="button"
                onClick={handleMyCity}
                className={`btn w-full px-4 py-2.5 text-sm ${cityFilter ? 'btn-primary' : 'btn-ghost'}`}
              >
                <MapPin className="h-5 w-5" />
                <span className="truncate">{cityFilter ? user?.city || cityFilter : 'Мой город'}</span>
                {cityFilter && <X className="h-4 w-4 flex-shrink-0" onClick={(e) => { e.stopPropagation(); setCityFilter(''); }} />}
              </button>

              <ActionButton type="submit" variant="primary" className="w-full py-3">
                Найти
              </ActionButton>
            </form>
          </SurfaceCard>

          <div className="min-w-0">
            {cityFilter && (
              <div className="alert alert-success mb-4">
                <MapPin className="h-5 w-5 flex-shrink-0" />
                <p className="flex-1 text-sm">
                  Показываем анкеты из города: <span className="font-bold text-white">{cityFilter}</span>
                </p>
                <button
                  type="button"
                  onClick={() => setCityFilter('')}
                  className="text-primary-300 transition-colors hover:text-primary-200"
                  aria-label="Очистить город"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}

            {unknownOnly && (
              <div className="mb-4">
                <AlertBox tone="warning">
                <HelpCircle className="h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="font-bold">ВНИМАНИЕ: неизвестная порода</p>
                  <p className="mt-1 text-sm opacity-90">
                    Порода, состояние здоровья и характер неизвестны или указаны приблизительно и могут быть неточными. Перед принятием решения уточняйте детали у владельца.
                  </p>
                </div>
              </AlertBox>
              </div>
            )}

            {!loading && pets.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 px-1 text-sm text-slate-400">
                <span>
                  Найдено: <span className="font-bold text-primary-200">{pets.length}</span> {pluralPets(pets.length)}
                </span>
                {cityFilter && <span>Город: {cityFilter}</span>}
              </div>
            )}

            {loading ? (
              <SurfaceCard className="flex items-center justify-center gap-3 py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary-300" />
                <span className="font-semibold text-white">Ищем питомцев…</span>
              </SurfaceCard>
            ) : pets.length === 0 ? (
              <SurfaceCard className="px-6 py-20 text-center">
                <PawPrint className="mx-auto mb-4 h-14 w-14 text-slate-500" />
                <h2 className="display-title text-2xl">Пока нет доступных питомцев</h2>
                <p className="lede mx-auto mt-2 max-w-md text-sm">Попробуйте изменить фильтры или добавьте первую анкету.</p>
              </SurfaceCard>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-2 2xl:grid-cols-3">
                {pets.map((pet) => (
                  <PetCard key={pet.id} pet={pet} />
                ))}
              </div>
            )}
          </div>
        </div>

        <LocationModal
          open={cityModalOpen}
          onClose={() => setCityModalOpen(false)}
          onSelect={handleCitySelect}
          onAutoSelect={handleCitySelect}
        />
      </PageContainer>
    </PageShell>
  );
}
