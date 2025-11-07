'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn, calculateAgeFromDate } from '@/lib/utils';
import {
  HORSE_EDUCATION_LEVEL_OPTIONS,
  HORSE_SEX_OPTIONS,
  RIDING_STYLE_OPTIONS,
} from '@/lib/constants/horses';

export interface ClientHorse {
  id: string;
  name: string;
  breed: string | null;
  age: number | null;
  dateOfBirth?: string | null;
  typeOfRiding?: string | null;
  educationLevel?: string | null;
  behaviouralNotes?: string | null;
  lastDentalDate?: string | null;
  lastVaccinationDate?: string | null;
  lastSaddleFitDate?: string | null;
  lastWormingDate?: string | null;
  propertyName?: string | null;
  propertyAddress?: string | null;
  picNumber?: string | null;
  photoDataUrl?: string | null;
  color?: string | null;
  height?: string | null;
  sex?: string | null;
  notes: string | null;
  computedAge?: number | null;
}

interface ClientHorseManagerProps {
  initialHorses: ClientHorse[];
}

const DATE_FIELD_KEYS = [
  'lastDentalDate',
  'lastVaccinationDate',
  'lastSaddleFitDate',
  'lastWormingDate',
] as const;
type DateFieldKey = (typeof DATE_FIELD_KEYS)[number];

const DATE_FIELDS: Array<{ key: DateFieldKey; label: string }> = [
  { key: 'lastDentalDate', label: 'Last dental' },
  { key: 'lastVaccinationDate', label: 'Last vaccinations' },
  { key: 'lastSaddleFitDate', label: 'Last saddle fitting' },
  { key: 'lastWormingDate', label: 'Last worming' },
];

type HorseFormState = {
  [K in
    | 'name'
    | 'breed'
    | 'notes'
    | 'typeOfRiding'
    | 'educationLevel'
    | 'behaviouralNotes'
    | 'propertyName'
    | 'propertyAddress'
    | 'picNumber'
    | 'color'
    | 'height'
    | 'sex'
    | 'age']: string;
} & {
  dateOfBirth: string;
  photoDataUrl: string;
} & Record<DateFieldKey, string>;

function createEmptyForm(): HorseFormState {
  return {
    name: '',
    breed: '',
    notes: '',
    typeOfRiding: '',
    educationLevel: '',
    behaviouralNotes: '',
    dateOfBirth: '',
    propertyName: '',
    propertyAddress: '',
    picNumber: '',
    photoDataUrl: '',
    color: '',
    height: '',
    sex: '',
    age: '',
    lastDentalDate: '',
    lastVaccinationDate: '',
    lastSaddleFitDate: '',
    lastWormingDate: '',
  };
}

export function ClientHorseManager({ initialHorses }: ClientHorseManagerProps) {
  const [horses, setHorses] = useState<ClientHorse[]>(initialHorses);
  const [form, setForm] = useState(createEmptyForm);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState(createEmptyForm);
  const [busy, setBusy] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [editingPhotoPreview, setEditingPhotoPreview] = useState<string | null>(null);
  const computedFormAge = form.dateOfBirth ? calculateAgeFromDate(form.dateOfBirth) : null;
  const computedEditingAge = editingForm.dateOfBirth ? calculateAgeFromDate(editingForm.dateOfBirth) : null;

  async function refreshHorses() {
    const res = await fetch('/api/portal/horses', { cache: 'no-store' });
    if (res.ok) {
      const payload = (await res.json()) as { items: ClientHorse[] };
      setHorses(payload.items);
    }
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setMessage(null);
    try {
      const payload = buildPayload(form);
      const res = await fetch('/api/portal/horses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error ?? 'Unable to add horse');
      }
      setForm(createEmptyForm());
      setPhotoPreview(null);
      await refreshHorses();
      setMessage('Horse added.');
    } catch (error: any) {
      setMessage(error.message ?? 'Unable to add horse');
    } finally {
      setCreating(false);
    }
  }

  async function handleEditSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) return;
    setBusy(true);
    setMessage(null);
    try {
      const payload = buildPayload(editingForm);
      const res = await fetch(`/api/portal/horses/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error ?? 'Unable to update horse');
      }
      setEditingId(null);
      setEditingForm(createEmptyForm());
      setEditingPhotoPreview(null);
      await refreshHorses();
      setMessage('Horse updated.');
    } catch (error: any) {
      setMessage(error.message ?? 'Unable to update horse');
    } finally {
      setBusy(false);
    }
  }

  function handlePhotoChange(
    event: React.ChangeEvent<HTMLInputElement>,
    isEditing: boolean,
  ) {
    const file = event.target.files?.[0];
    if (!file) {
      if (isEditing) {
        setEditingPhotoPreview(null);
        setEditingForm((prev) => ({ ...prev, photoDataUrl: '' }));
      } else {
        setPhotoPreview(null);
        setForm((prev) => ({ ...prev, photoDataUrl: '' }));
      }
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result?.toString() ?? '';
      if (isEditing) {
        setEditingPhotoPreview(result);
        setEditingForm((prev) => ({ ...prev, photoDataUrl: result }));
      } else {
        setPhotoPreview(result);
        setForm((prev) => ({ ...prev, photoDataUrl: result }));
      }
    };
    reader.readAsDataURL(file);
  }

  function buildPayload(state: HorseFormState) {
    const payload: Record<string, any> = {
      name: state.name,
      breed: state.breed || undefined,
      notes: state.notes || undefined,
      typeOfRiding: state.typeOfRiding || undefined,
      educationLevel: state.educationLevel || undefined,
      behaviouralNotes: state.behaviouralNotes || undefined,
      propertyName: state.propertyName || undefined,
      propertyAddress: state.propertyAddress || undefined,
      picNumber: state.picNumber || undefined,
      photoDataUrl: state.photoDataUrl || undefined,
      color: state.color || undefined,
      height: state.height || undefined,
      sex: state.sex || undefined,
    };
    if (state.dateOfBirth) {
      payload.dateOfBirth = state.dateOfBirth;
    } else if (state.dateOfBirth === '') {
      payload.dateOfBirth = null;
    } else if (state.age) {
      const parsedAge = Number(state.age);
      if (!Number.isNaN(parsedAge)) {
        payload.age = parsedAge;
      }
    }
    DATE_FIELDS.forEach(({ key }) => {
      const value = state[key];
      if (value) {
        payload[key] = value;
      } else if (value === '') {
        payload[key] = null;
      }
    });
    return payload;
  }

  const enrichedHorses = useMemo(
    () =>
      horses.map((horse) => ({
        ...horse,
        computedAge: horse.dateOfBirth ? calculateAgeFromDate(horse.dateOfBirth) : horse.age,
      })),
    [horses],
  );

  async function handleDelete(id: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/portal/horses/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error ?? 'Unable to delete horse');
      }
      await refreshHorses();
      setMessage('Horse removed.');
    } catch (error: any) {
      setMessage(error.message ?? 'Unable to delete horse');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-card p-4">
        <h2 className="text-lg font-semibold text-foreground">Add a horse</h2>
        <p className="text-sm text-muted-foreground">Share details about your horse to help practitioners prepare.</p>
        <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={handleCreate}>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium text-muted-foreground">Name</label>
            <Input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Breed</label>
            <Input
              value={form.breed}
              onChange={(event) => setForm((prev) => ({ ...prev, breed: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Date of birth</label>
            <Input
              type="date"
              value={form.dateOfBirth}
              onChange={(event) => setForm((prev) => ({ ...prev, dateOfBirth: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Age</label>
            <Input
              type="number"
              min={0}
              max={60}
              value={
                form.dateOfBirth
                  ? computedFormAge != null
                    ? String(computedFormAge)
                    : ''
                  : form.age
              }
              disabled={!!form.dateOfBirth}
              onChange={(event) => setForm((prev) => ({ ...prev, age: event.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              {form.dateOfBirth
                ? 'Calculated from date of birth'
                : 'Provide an estimated age if the date of birth is unknown.'}
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Type of riding</label>
            <Select
              value={form.typeOfRiding}
              onValueChange={(value) => setForm((prev) => ({ ...prev, typeOfRiding: value === 'unset' ? '' : value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select discipline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unset">Not specified</SelectItem>
                {RIDING_STYLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Education level</label>
            <Select
              value={form.educationLevel}
              onValueChange={(value) => setForm((prev) => ({ ...prev, educationLevel: value === 'unset' ? '' : value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unset">Not specified</SelectItem>
                {HORSE_EDUCATION_LEVEL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium text-muted-foreground">Behavioural notes</label>
            <Textarea
              minRows={2}
              value={form.behaviouralNotes}
              onChange={(event) => setForm((prev) => ({ ...prev, behaviouralNotes: event.target.value }))}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium text-muted-foreground">Colour</label>
            <Input
              value={form.color}
              onChange={(event) => setForm((prev) => ({ ...prev, color: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Height</label>
            <Input
              value={form.height}
              placeholder="e.g. 15.2hh"
              onChange={(event) => setForm((prev) => ({ ...prev, height: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Sex</label>
            <Select
              value={form.sex || 'unset'}
              onValueChange={(value) => setForm((prev) => ({ ...prev, sex: value === 'unset' ? '' : value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select sex" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unset">Not specified</SelectItem>
                {HORSE_SEX_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium text-muted-foreground">Property name</label>
            <Input
              value={form.propertyName}
              onChange={(event) => setForm((prev) => ({ ...prev, propertyName: event.target.value }))}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium text-muted-foreground">Property address</label>
            <Input
              value={form.propertyAddress}
              onChange={(event) => setForm((prev) => ({ ...prev, propertyAddress: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">PIC number</label>
            <Input
              value={form.picNumber}
              onChange={(event) => setForm((prev) => ({ ...prev, picNumber: event.target.value }))}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium text-muted-foreground">Horse photo</label>
            <Input
              type="file"
              accept="image/*"
              onChange={(event) => handlePhotoChange(event, false)}
            />
            {photoPreview ? (
              <Image
                src={photoPreview}
                alt="Horse preview"
                width={128}
                height={128}
                className="h-32 w-32 rounded object-cover"
                unoptimized
              />
            ) : null}
          </div>
          {DATE_FIELDS.map(({ key, label }) => (
            <div key={key} className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">{label}</label>
              <Input
                type="date"
                value={form[key]}
                onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
              />
            </div>
          ))}
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium text-muted-foreground">Notes</label>
            <Textarea
              minRows={3}
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={creating}>
              {creating ? 'Saving…' : 'Add horse'}
            </Button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Your horses</h2>
        {enrichedHorses.length === 0 ? (
          <p className="text-sm text-muted-foreground">You have not added any horses yet.</p>
        ) : (
          <div className="space-y-3">
            {enrichedHorses.map((horse) => {
              const isEditing = editingId === horse.id;
              const ridingLabel =
                horse.typeOfRiding &&
                RIDING_STYLE_OPTIONS.find((option) => option.value === horse.typeOfRiding)?.label;
              const educationLabel =
                horse.educationLevel &&
                HORSE_EDUCATION_LEVEL_OPTIONS.find((option) => option.value === horse.educationLevel)?.label;
              return (
                <div key={horse.id} className="rounded-lg border bg-card p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-base font-semibold text-foreground">{horse.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {horse.breed ? `${horse.breed} • ` : ''}
                        {horse.computedAge != null ? `${horse.computedAge} yrs` : 'Age not set'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditingId(horse.id);
                          setEditingForm({
                            name: horse.name ?? '',
                            breed: horse.breed ?? '',
                            notes: horse.notes ?? '',
                            typeOfRiding: horse.typeOfRiding ?? '',
                            educationLevel: horse.educationLevel ?? '',
                            behaviouralNotes: horse.behaviouralNotes ?? '',
                            dateOfBirth: horse.dateOfBirth ? horse.dateOfBirth.slice(0, 10) : '',
                            propertyName: horse.propertyName ?? '',
                            propertyAddress: horse.propertyAddress ?? '',
                            picNumber: horse.picNumber ?? '',
                            photoDataUrl: horse.photoDataUrl ?? '',
                            color: horse.color ?? '',
                            height: horse.height ?? '',
                            sex: horse.sex ?? '',
                            age: horse.age != null ? horse.age.toString() : '',
                            lastDentalDate: horse.lastDentalDate ? horse.lastDentalDate.slice(0, 10) : '',
                            lastVaccinationDate: horse.lastVaccinationDate
                              ? horse.lastVaccinationDate.slice(0, 10)
                              : '',
                            lastSaddleFitDate: horse.lastSaddleFitDate ? horse.lastSaddleFitDate.slice(0, 10) : '',
                            lastWormingDate: horse.lastWormingDate ? horse.lastWormingDate.slice(0, 10) : '',
                          });
                          setEditingPhotoPreview(horse.photoDataUrl ?? null);
                        }}
                        disabled={busy}
                      >
                        Edit
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleDelete(horse.id)} disabled={busy}>
                        Remove
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-col gap-3 text-sm text-muted-foreground">
                    {horse.photoDataUrl ? (
                      <Image
                        src={horse.photoDataUrl}
                        alt={horse.name}
                        width={128}
                        height={128}
                        className="h-32 w-32 rounded object-cover"
                        unoptimized
                      />
                    ) : null}
                    <div className="flex flex-wrap gap-4">
                      {horse.propertyName ? <p>Property: {horse.propertyName}</p> : null}
                      {horse.propertyAddress ? <p>Address: {horse.propertyAddress}</p> : null}
                      {horse.picNumber ? <p>PIC: {horse.picNumber}</p> : null}
                      {horse.color ? <p>Colour: {horse.color}</p> : null}
                      {horse.height ? <p>Height: {horse.height}</p> : null}
                      {horse.sex ? (
                        <p>
                          Sex:{' '}
                          {HORSE_SEX_OPTIONS.find((option) => option.value === horse.sex)?.label ?? horse.sex}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-4">
                      {ridingLabel ? <p>Riding: {ridingLabel}</p> : null}
                      {educationLabel ? <p>Education: {educationLabel}</p> : null}
                    </div>
                    {horse.behaviouralNotes ? <p>Behaviour: {horse.behaviouralNotes}</p> : null}
                    {DATE_FIELDS.map(({ key, label }) =>
                      horse[key] ? (
                        <p key={key}>
                          {label}: {new Date(horse[key] as string).toLocaleDateString()}
                        </p>
                      ) : null,
                    )}
                    <p>{horse.notes ?? 'No notes provided.'}</p>
                  </div>
                  {isEditing ? (
                    <form className="mt-4 space-y-3 rounded-md border bg-background/60 p-4" onSubmit={handleEditSave}>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Name</label>
                          <Input
                            value={editingForm.name}
                            onChange={(event) => setEditingForm((prev) => ({ ...prev, name: event.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Breed</label>
                          <Input
                            value={editingForm.breed}
                            onChange={(event) => setEditingForm((prev) => ({ ...prev, breed: event.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Date of birth</label>
                          <Input
                            type="date"
                            value={editingForm.dateOfBirth}
                            onChange={(event) => setEditingForm((prev) => ({ ...prev, dateOfBirth: event.target.value }))}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Age</label>
                          <Input
                            type="number"
                            min={0}
                            max={60}
                            value={
                              editingForm.dateOfBirth
                                ? computedEditingAge != null
                                  ? String(computedEditingAge)
                                  : ''
                                : editingForm.age
                            }
                            disabled={!!editingForm.dateOfBirth}
                            onChange={(event) =>
                              setEditingForm((prev) => ({ ...prev, age: event.target.value }))
                            }
                          />
                          <p className="text-[10px] text-muted-foreground">
                            {editingForm.dateOfBirth
                              ? 'Calculated from date of birth'
                              : 'Provide an estimated age if the date of birth is unknown.'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Type of riding</label>
                          <Select
                            value={editingForm.typeOfRiding}
                            onValueChange={(value) =>
                              setEditingForm((prev) => ({ ...prev, typeOfRiding: value === 'unset' ? '' : value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select discipline" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unset">Not specified</SelectItem>
                              {RIDING_STYLE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Education level</label>
                          <Select
                            value={editingForm.educationLevel}
                            onValueChange={(value) =>
                              setEditingForm((prev) => ({ ...prev, educationLevel: value === 'unset' ? '' : value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unset">Not specified</SelectItem>
                              {HORSE_EDUCATION_LEVEL_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Behavioural notes</label>
                        <Textarea
                          minRows={2}
                          value={editingForm.behaviouralNotes}
                          onChange={(event) =>
                            setEditingForm((prev) => ({ ...prev, behaviouralNotes: event.target.value }))
                          }
                        />
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Colour</label>
                        <Input
                          value={editingForm.color}
                          onChange={(event) => setEditingForm((prev) => ({ ...prev, color: event.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Height</label>
                        <Input
                          value={editingForm.height}
                          placeholder="e.g. 15.2hh"
                          onChange={(event) => setEditingForm((prev) => ({ ...prev, height: event.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Sex</label>
                      <Select
                        value={editingForm.sex || 'unset'}
                        onValueChange={(value) =>
                          setEditingForm((prev) => ({ ...prev, sex: value === 'unset' ? '' : value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select sex" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unset">Not specified</SelectItem>
                          {HORSE_SEX_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Property name</label>
                        <Input
                          value={editingForm.propertyName}
                          onChange={(event) => setEditingForm((prev) => ({ ...prev, propertyName: event.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Property address</label>
                        <Input
                          value={editingForm.propertyAddress}
                          onChange={(event) =>
                            setEditingForm((prev) => ({ ...prev, propertyAddress: event.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">PIC number</label>
                        <Input
                          value={editingForm.picNumber}
                          onChange={(event) => setEditingForm((prev) => ({ ...prev, picNumber: event.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Horse photo</label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(event) => handlePhotoChange(event, true)}
                        />
                        {editingPhotoPreview ? (
                          <Image
                            src={editingPhotoPreview}
                            alt="Horse preview"
                            width={128}
                            height={128}
                            className="h-32 w-32 rounded object-cover"
                            unoptimized
                          />
                        ) : null}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {DATE_FIELDS.map(({ key, label }) => (
                          <div key={key} className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">{label}</label>
                            <Input
                              type="date"
                              value={editingForm[key]}
                              onChange={(event) => setEditingForm((prev) => ({ ...prev, [key]: event.target.value }))}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Notes</label>
                        <Textarea
                          minRows={3}
                          value={editingForm.notes}
                          onChange={(event) => setEditingForm((prev) => ({ ...prev, notes: event.target.value }))}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" disabled={busy}>
                          {busy ? 'Saving…' : 'Save'}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(null);
                            setEditingForm(createEmptyForm());
                            setEditingPhotoPreview(null);
                          }}
                          disabled={busy}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
        {message ? (
          <p className={cn('text-sm', message.includes('Unable') ? 'text-destructive' : 'text-muted-foreground')}>
            {message}
          </p>
        ) : null}
      </section>
    </div>
  );
}
