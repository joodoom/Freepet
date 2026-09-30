'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { petsAPI, authAPI, Pet, User } from '@/lib/api';
import PetCard from '@/components/PetCard';
import LocationModal from '@/components/LocationModal';
import { BREED_OPTIONS } from '@/lib/breeds';
import {
  Search, Filter, PawPrint, Loader2, HelpCircle, MapPin, X,
  Heart, MessageSquare, Home,
} from 'lucide-react';

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
    {
      icon: Search,
      title: 'Найдите друга',
      text: 'Выберите питомца по виду, породе и своему городу — рядом с вами уже кто-то ждёт хозяина.',
    },
    {
      icon: MessageSquare,
      title: 'Напишите владельцу',
      text: 'Свяжитесь через чат прямо на сайте, задайте вопросы о характере и здоровье питомца.',
    },
    {
      icon: Home,
      title: 'Передайте дом',
      text: 'Встретьтесь, познакомьтесь — и пусть у кого-то появится новая любящая семья.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-gray-900 to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ================= HERO ================= */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600/20 via-primary-500/5 to-green-600/10 border border-white/10 mb-8">
          {/* декоративные лапки */}
          <div className="absolute -right-6 -top-12 opacity-10 rotate-12 select-none pointer-events-none" aria-hidden="true">
            <PawPrint className="h-44 w-44 text-primary-400" />
          </div>
          <div className="absolute -left-12 -bottom-14 opacity-[0.07] -rotate-12 select-none pointer-events-none" aria-hidden="true">
            <PawPrint className="h-48 w-48 text-green-400" />
          </div>

          <div className="relative px-5 py-10 sm:px-10 sm:py-14">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-semibold uppercase tracking-wider mb-4">
              <Heart className="h-3.5 w-3.5" fill="currentColor" />
              Передай животному дом
            </span>

            <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight mb-3 text-gradient">
              Найди себе друга
            </h1>
            <p className="text-slate-300 text-base sm:text-lg max-w-xl">
              Тысячи питомцев ищут тёплые руки и доброе сердце.
              Возможно, ваш будущий лучший друг уже здесь — прямо в вашем городе.
            </p>

            {user && (
              <p className="mt-4 text-sm text-primary-300 flex items-center gap-1.5">
                <Heart className="h-4 w-4" fill="currentColor" />
                Привет, {user.username}! Рады видеть тебя снова
              </p>
            )}
          </div>
        </section>

        {/* ================= ПОИСК И ФИЛЬТРЫ ================= */}
        <section className="glass rounded-2xl p-4 sm:p-5 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input
                type="text"
                placeholder="Поиск по имени..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-primary-400 focus:shadow-neon-violet focus:outline-none transition-all duration-300"
              />
            </div>

            <div className="flex items-center space-x-2 w-full md:w-auto">
              <Filter className="h-5 w-5 text-slate-500 flex-shrink-0" />
              <select
                value={speciesFilter}
                onChange={(e) => handleSpeciesChange(e.target.value)}
                className="w-full md:w-auto flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-primary-400 focus:shadow-neon-violet focus:outline-none transition-all duration-300"
              >
                {speciesOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {speciesFilter && (
              <div className="flex items-center space-x-2 w-full md:w-auto">
                <Filter className="h-5 w-5 text-slate-500 flex-shrink-0" />
                <select
                  value={breedFilter}
                  onChange={(e) => setBreedFilter(e.target.value)}
                  className="w-full md:w-auto flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-primary-400 focus:shadow-neon-violet focus:outline-none transition-all duration-300"
                >
                  <option value="">Все породы</option>
                  {breedOptions[speciesFilter]?.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                  <option value="other">Другое</option>
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={() => setUnknownOnly(!unknownOnly)}
              className={`flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border transition-all w-full md:w-auto ${
                unknownOnly
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-white/5 text-amber-400 border-white/10 hover:bg-white/10'
              }`}
            >
              <HelpCircle className="h-5 w-5" />
              <span>Неизвестная порода</span>
            </button>

            <button
              type="button"
              onClick={handleMyCity}
              className={`flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border transition-all w-full md:w-auto ${
                cityFilter
                  ? 'bg-primary-500/20 text-primary-300 border-primary-500/40'
                  : 'bg-white/5 text-primary-400 border-white/10 hover:bg-white/10'
              }`}
            >
              <MapPin className="h-5 w-5" />
              <span className="truncate">{cityFilter ? user?.city || cityFilter : 'Мой город'}</span>
            </button>

            <button
              type="submit"
              className="flex items-center justify-center space-x-2 bg-primary-600 text-white px-7 py-2.5 rounded-xl hover:bg-primary-500 hover:shadow-neon-violet transition-all duration-300 w-full md:w-auto font-medium"
            >
              <Search className="h-5 w-5" />
              <span>Найти</span>
            </button>
          </form>
        </section>

        {/* ================= ПЛАШКИ-УВЕДОМЛЕНИЯ ================= */}
        {cityFilter && (
          <div className="mb-5 p-4 bg-primary-500/10 border border-primary-500/30 rounded-xl flex items-center space-x-3">
            <MapPin className="h-6 w-6 text-primary-400 flex-shrink-0" />
            <p className="text-sm text-slate-300 flex-1">
              Показываем анкеты из города: <span className="font-semibold text-white">{cityFilter}</span>
            </p>
            <button
              type="button"
              onClick={() => setCityFilter('')}
              className="text-primary-400 hover:text-primary-300 tap-target"
              aria-label="Сбросить город"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {unknownOnly && (
          <div className="mb-5 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start space-x-3">
            <HelpCircle className="h-6 w-6 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-400">Внимание: неизвестная порода</p>
              <p className="text-sm text-amber-400/80 mt-1">
                Порода, состояние здоровья и характер неизвестны или указаны приблизительно и могут быть неточными. Перед принятием решения уточняйте детали у владельца.
              </p>
            </div>
          </div>
        )}

        {/* ================= РЕЗУЛЬТАТЫ ================= */}
        {!loading && pets.length > 0 && (
          <div className="mb-4 px-1 text-sm text-slate-400 flex items-center gap-2">
            <PawPrint className="h-4 w-4 text-primary-400" />
            Найдено: <span className="font-semibold text-primary-300">{pets.length}</span> {pluralPets(pets.length)}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col justify-center items-center py-24 gap-4">
            <Loader2 className="h-10 w-10 text-primary-400 animate-spin" />
            <p className="text-slate-500 text-sm">Ищем питомцев...</p>
          </div>
        ) : pets.length === 0 ? (
          <div className="glass text-center py-16 px-6">
            <div className="w-20 h-20 rounded-full bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mx-auto mb-5">
              <PawPrint className="h-10 w-10 text-primary-400/70" />
            </div>
            <p className="text-slate-300 text-lg font-semibold mb-1">Пока нет доступных питомцев</p>
            <p className="text-slate-500 text-sm">
              Попробуйте изменить фильтры поиска или выбрать другой город
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
            {pets.map((pet) => (
              <PetCard key={pet.id} pet={pet} />
            ))}
          </div>
        )}

        {/* ================= КАК ЭТО РАБОТАЕТ ================= */}
        <section className="mt-14 mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <PawPrint className="h-7 w-7 text-primary-400" />
            Как это работает
          </h2>
          <p className="text-slate-400 mb-6">Три простых шага до нового друга</p>

          <div className="grid sm:grid-cols-3 gap-4">
            {steps.map((step, i) => (
              <div key={i} className="glass p-6 relative overflow-hidden group hover:border-primary-500/30 transition-colors">
                <span className="absolute -right-2 -top-4 text-6xl font-extrabold text-white/5 select-none" aria-hidden="true">
                  {i + 1}
                </span>
                <div className="w-12 h-12 rounded-xl bg-primary-500/15 border border-primary-500/30 flex items-center justify-center mb-4">
                  <step.icon className="h-6 w-6 text-primary-400" />
                </div>
                <h3 className="font-bold text-white text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ================= CTA ВНИЗУ ================= */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600/20 via-primary-500/10 to-green-600/20 border border-white/10 px-6 py-10 sm:px-10 text-center mb-4">
          <div className="absolute -left-8 -top-8 opacity-10 select-none pointer-events-none" aria-hidden="true">
            <PawPrint className="h-32 w-32 text-green-400 rotate-12" />
          </div>
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Готовы помочь питомцу?
            </h2>
            <p className="text-slate-300 max-w-lg mx-auto mb-6">
              Если у вас есть животное, которое ищет новый дом — разместите анкету.
              Возможно, его новая семья уже ищет его прямо сейчас.
            </p>
            <Link
              href="/add"
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-3.5 rounded-xl hover:bg-primary-500 hover:shadow-neon-violet transition-all duration-300 font-semibold"
            >
              <PawPrint className="h-5 w-5" />
              Разместить анкету
            </Link>
          </div>
        </section>

        <LocationModal
          open={cityModalOpen}
          onClose={() => setCityModalOpen(false)}
          onSelect={handleCitySelect}
          onAutoSelect={handleCitySelect}
        />
      </div>
    </div>
  );
}
