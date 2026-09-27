'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { petsAPI, User } from '@/lib/api';
import { BREED_OPTIONS } from '@/lib/breeds';
import { suggestCities } from '@/lib/cities';
import LocationModal from '@/components/LocationModal';
import { Upload, X, AlertCircle, CheckCircle, Loader2, AlertTriangle, MapPin, Camera, ClipboardList, HeartHandshake } from 'lucide-react';
import { PageShell, Field, TextInput, TextArea, SelectField, ActionButton, AlertBox, SurfaceCard } from '@/components/ui';

export default function AddPetPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    species: '',
    breed: '',
    character: '',
    city: '',
    age: '',
    description: '',
    vaccination_info: '',
    health_issues: '',
  });
  const [customBreed, setCustomBreed] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [locationOpen, setLocationOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [cityActive, setCityActive] = useState(0);

  const citySuggestions = suggestCities(formData.city);
  const showCitySuggestions = cityOpen && formData.city.trim().length > 0 && citySuggestions.length > 0;

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!savedUser || !token) {
      router.push('/login');
      return;
    }
    const u = JSON.parse(savedUser) as User;
    setUser(u);
    if (u.city) {
      setFormData((prev) => (prev.city ? prev : { ...prev, city: u.city! }));
    }
  }, [router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange(e);
    setCityActive(0);
    setCityOpen(true);
  };

  const handleCitySelect = (city: string) => {
    setFormData((prev) => ({ ...prev, city }));
    setCityOpen(false);
  };

  const handleCityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && showCitySuggestions) {
      e.preventDefault();
      setCityActive((prev) => (prev + 1) % citySuggestions.length);
    } else if (e.key === 'ArrowUp' && showCitySuggestions) {
      e.preventDefault();
      setCityActive((prev) => (prev - 1 + citySuggestions.length) % citySuggestions.length);
    } else if (e.key === 'Enter' && showCitySuggestions) {
      e.preventDefault();
      handleCitySelect(citySuggestions[Math.min(cityActive, citySuggestions.length - 1)]);
    } else if (e.key === 'Escape') {
      setCityOpen(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Размер файла не должен превышать 5 МБ');
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Допустимые форматы: JPG, PNG, GIF, WebP');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name || !formData.species || !formData.description) {
      setError('Заполните обязательные поля');
      return;
    }

    if (formData.description.length < 10) {
      setError('Описание должно содержать минимум 10 символов');
      return;
    }

    setLoading(true);

    let breedValue = '';
    if (formData.breed === 'Другое') {
      breedValue = customBreed.trim();
    } else if (formData.species !== 'Неизвестно') {
      breedValue = formData.breed;
    }

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('species', formData.species);
      if (breedValue) submitData.append('breed', breedValue);
      if (formData.character) submitData.append('character', formData.character);
      if (formData.city) submitData.append('city', formData.city);
      if (formData.age) submitData.append('age', formData.age);
      submitData.append('description', formData.description);
      if (formData.vaccination_info) submitData.append('vaccination_info', formData.vaccination_info);
      if (formData.health_issues) submitData.append('health_issues', formData.health_issues);
      if (imageFile) submitData.append('image', imageFile);

      const response = await petsAPI.create(submitData);

      if (response.data.moderation_status === 'rejected') {
        setError(
          `Анкета отклонена модерацией: ${response.data.rejection_reason || 'Нарушение правил'}`
        );
      } else {
        setSuccess('Питомец успешно добавлен! Ожидает модерации...');
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при добавлении питомца');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-8 max-w-3xl">
          <span className="eyebrow">Новая анкета</span>
          <h1 className="display-title mt-3 text-3xl sm:text-4xl lg:text-[2.9rem]">Добавить питомца</h1>
          <p className="lede mt-3 max-w-2xl">
            Расскажите честную историю животного: чем подробнее анкета, тем быстрее находится заботливый дом.
          </p>
        </div>

        {error && (
          <div className="mb-5">
            <AlertBox tone="danger">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </AlertBox>
          </div>
        )}

        {success && (
          <div className="mb-5">
            <AlertBox tone="success">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <span>{success}</span>
            </AlertBox>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid items-start gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <SurfaceCard className="p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <span className="brand-mark" aria-hidden="true">
                  <Camera className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="display-title text-xl">Фотография и место</h2>
                  <p className="lede text-sm">Хорошее фото увеличивает доверие.</p>
                </div>
              </div>

              <div className="mt-5">
                <span className="field-label">Изображение питомца</span>
                <div className="flex items-center justify-center w-full">
                  {imagePreview ? (
                    <div className="relative w-full">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-56 w-full rounded-2xl border border-white/10 object-cover sm:h-72"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-colors hover:bg-red-400"
                        aria-label="Удалить изображение"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="surface-soft flex h-56 w-full cursor-pointer flex-col items-center justify-center border-2 border-dashed px-6 text-center transition-all duration-300 hover:border-primary-400/60 sm:h-72">
                      <Upload className="mb-2 h-12 w-12 text-slate-500" />
                      <p className="text-sm font-semibold text-slate-300">
                        Нажмите для загрузки изображения
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        JPG, PNG, GIF, WebP (макс. 5 МБ)
                      </p>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <Field label="Город / местоположение">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative flex-1">
                      <TextInput
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleCityInputChange}
                        onFocus={() => { setCityActive(0); setCityOpen(true); }}
                        onBlur={() => window.setTimeout(() => setCityOpen(false), 120)}
                        onKeyDown={handleCityKeyDown}
                        role="combobox"
                        aria-expanded={showCitySuggestions}
                        aria-autocomplete="list"
                        aria-activedescendant={showCitySuggestions ? `city-option-${cityActive}` : undefined}
                        autoComplete="off"
                        className="flex-1"
                        placeholder="Начните вводить: Мо…"
                      />
                      {showCitySuggestions && (
                        <ul
                          role="listbox"
                          className="absolute inset-x-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-2xl border border-white/10 bg-[#2a1a0d] p-1 shadow-2xl"
                        >
                          {citySuggestions.map((city, index) => (
                            <li key={city} role="option" id={`city-option-${index}`} aria-selected={index === cityActive}>
                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleCitySelect(city)}
                                onMouseEnter={() => setCityActive(index)}
                                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                                  index === cityActive
                                    ? 'bg-primary-500/20 text-white'
                                    : 'text-slate-300 hover:bg-white/5'
                                }`}
                              >
                                <MapPin className="h-4 w-4 flex-shrink-0 text-primary-300" />
                                <span className="truncate">{city}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setLocationOpen(true)}
                      className="btn btn-primary whitespace-nowrap px-5 py-2.5 text-sm"
                    >
                      <MapPin className="h-4 w-4" />
                      Определить
                    </button>
                  </div>
                </Field>
              </div>

              <div className="surface-soft mt-6 flex items-start gap-3 p-4">
                <HeartHandshake className="h-6 w-6 flex-shrink-0 text-primary-300" aria-hidden="true" />
                <p className="text-sm text-slate-300">
                  Укажите город честно: так анкета попадёт к людям рядом и передача пройдёт спокойнее.
                </p>
              </div>
            </SurfaceCard>

            <SurfaceCard className="p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/15 text-green-300" aria-hidden="true">
                  <ClipboardList className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="display-title text-xl">Характер и здоровье</h2>
                  <p className="lede text-sm">Подробности помогают избежать недопонимания.</p>
                </div>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Field label="Имя питомца *">
                  <TextInput
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Например: Барсик"
                    required
                  />
                </Field>

                <Field label="Вид животного *">
                  <SelectField
                    name="species"
                    value={formData.species}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Выберите вид</option>
                    <option value="Собака">Собака</option>
                    <option value="Кошка">Кошка</option>
                    <option value="Хомяк">Хомяк</option>
                    <option value="Попугай">Попугай</option>
                    <option value="Рыбка">Рыбка</option>
                    <option value="Черепаха">Черепаха</option>
                    <option value="Кролик">Кролик</option>
                    <option value="Другое">Другое</option>
                    <option value="Неизвестно">Неизвестно</option>
                  </SelectField>
                </Field>
              </div>

              {formData.species === 'Неизвестно' && (
                <div className="mt-5">
                  <AlertBox tone="warning">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm">
                      Это неизвестная порода или животное. Вид, порода, здоровье и характер неизвестны или указаны приблизительно. Указывайте только приблизительную информацию.
                    </p>
                  </AlertBox>
                </div>
              )}

              <div className="mt-5">
                <Field label={`Порода ${formData.species === 'Неизвестно' ? '(приблизительно)' : ''}`}>
                  {formData.species === 'Неизвестно' ? (
                    <TextInput
                      type="text"
                      value="Неизвестна"
                      disabled
                      className="text-slate-500"
                    />
                  ) : (
                    <>
                      <SelectField
                        name="breed"
                        value={formData.breed}
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, breed: e.target.value }));
                          setCustomBreed('');
                        }}
                      >
                        <option value="">Выберите породу</option>
                        {formData.species === 'Другое' ? null : (BREED_OPTIONS[formData.species] || []).map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                        <option value="Другое">Другое</option>
                      </SelectField>
                      {formData.breed === 'Другое' && (
                        <TextInput
                          type="text"
                          value={customBreed}
                          onChange={(e) => setCustomBreed(e.target.value)}
                          className="mt-2"
                          placeholder="Укажите породу вручную"
                        />
                      )}
                    </>
                  )}
                </Field>
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Field label={`Характер ${formData.species === 'Неизвестно' ? '(приблизительно)' : ''}`}>
                  <TextInput
                    type="text"
                    name="character"
                    value={formData.character}
                    onChange={handleInputChange}
                    placeholder="Например: добрый, активный, спокойный (или неизвестно)"
                  />
                </Field>

                <Field label="Возраст (лет)">
                  <TextInput
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                    max="100"
                  />
                </Field>
              </div>

              <div className="mt-5">
                <Field label="Описание *">
                  <TextArea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Расскажите о характере, привычках, особенностях питомца (минимум 10 символов)"
                    required
                    minLength={10}
                  />
                </Field>
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Field label="Информация о прививках">
                  <TextArea
                    name="vaccination_info"
                    value={formData.vaccination_info}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Какие прививки сделаны, когда последняя вакцинация"
                  />
                </Field>

                <Field label="Проблемы со здоровьем">
                  <TextArea
                    name="health_issues"
                    value={formData.health_issues}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Хронические заболевания, аллергии, особенности ухода"
                  />
                </Field>
              </div>

              <ActionButton type="submit" variant="primary" disabled={loading} className="mt-7 w-full py-3">
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Добавление...</span>
                  </>
                ) : (
                  <span>Добавить питомца</span>
                )}
              </ActionButton>
            </SurfaceCard>
          </div>
        </form>
      </div>
      <LocationModal
        open={locationOpen}
        onClose={() => setLocationOpen(false)}
        onSelect={(city) => {
          setLocationOpen(false);
          if (city) setFormData((prev) => ({ ...prev, city }));
        }}
        onAutoSelect={(city) => {
          if (city) setFormData((prev) => ({ ...prev, city }));
        }}
      />
    </PageShell>
  );
}
