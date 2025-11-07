'use client';

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TravelSearchResult {
  id: string;
  practitionerId: string;
  practitionerName: string;
  practitionerEmail: string | null;
  title: string;
  description: string | null;
  locationName: string;
  start: string;
  end: string;
  isRecurring: boolean;
  weekday: number | null;
}

interface PractitionerOption {
  id: string;
  name: string | null;
  email: string | null;
}

interface TravelSearchProps {
  practiceTimezone: string;
  practitioners: PractitionerOption[];
  initialResults: TravelSearchResult[];
}

const weekDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatWithTimezone(value: string, timezone: string, options?: Intl.DateTimeFormatOptions) {
  try {
    return new Intl.DateTimeFormat('en-AU', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: timezone,
      ...options,
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function TravelSearch({ practiceTimezone, practitioners, initialResults }: TravelSearchProps) {
  const [query, setQuery] = useState('');
  const [practitionerId, setPractitionerId] = useState<string>('all');
  const [from, setFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState(() => {
    const end = new Date();
    end.setDate(end.getDate() + 7);
    return end.toISOString().slice(0, 10);
  });
  const [results, setResults] = useState(initialResults);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const hasFilters = useMemo(
    () => query.trim().length > 0 || practitionerId !== 'all' || from !== '' || to !== '',
    [query, practitionerId, from, to],
  );

  async function runSearch(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('query', query.trim());
      if (practitionerId !== 'all') params.set('practitionerId', practitionerId);
      if (from) params.set('from', new Date(from + 'T00:00').toISOString());
      if (to) params.set('to', new Date(to + 'T23:59').toISOString());
      const res = await fetch('/api/travel/search?' + params.toString(), { cache: 'no-store' });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? 'Unable to search travel plans');
      }
      const data = await res.json();
      setResults(
        (data.items ?? []).map((item: any) => ({
          id: item.id,
          practitionerId: item.practitioner.id,
          practitionerName: item.practitioner.name ?? item.practitioner.email ?? 'Practitioner',
          practitionerEmail: item.practitioner.email,
          title: item.title,
          description: item.description ?? null,
          locationName: item.locationName,
          start: item.start,
          end: item.end,
          isRecurring: item.isRecurring,
          weekday: item.weekday,
        })),
      );
    } catch (error: any) {
      setMessage(error.message ?? 'Unable to search travel plans');
    } finally {
      setLoading(false);
    }
  }

  function resetFilters() {
    setQuery('');
    setPractitionerId('all');
    const now = new Date();
    setFrom(now.toISOString().slice(0, 10));
    const later = new Date();
    later.setDate(later.getDate() + 7);
    setTo(later.toISOString().slice(0, 10));
    setResults(initialResults);
    setMessage(null);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={runSearch} className="grid gap-4 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2 sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">Search by location or title</label>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Stable 1, Farrier, On-site..."
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">From</label>
          <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">To</label>
          <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">Practitioner</label>
          <Select value={practitionerId} onValueChange={setPractitionerId}>
            <SelectTrigger>
              <SelectValue placeholder="All practitioners" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All practitioners</SelectItem>
              {practitioners.map((practitioner) => (
                <SelectItem key={practitioner.id} value={practitioner.id}>
                  {practitioner.name ?? practitioner.email ?? 'Team member'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 sm:col-span-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'Searching…' : 'Search travel plans'}
          </Button>
          {hasFilters ? (
            <Button type="button" variant="ghost" onClick={resetFilters} disabled={loading}>
              Reset
            </Button>
          ) : null}
        </div>
      </form>

      {message ? <p className="text-sm text-destructive">{message}</p> : null}

      <div className="space-y-3">
        {results.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No travel plans match your filters. Adjust the date range or try another location.
          </p>
        ) : (
          results.map((result) => (
            <div key={result.id} className="rounded-lg border bg-card p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-base font-semibold text-foreground">{result.title}</p>
                  <p className="text-sm text-muted-foreground">{result.locationName}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{formatWithTimezone(result.start, practiceTimezone)}</p>
                  <p>{formatWithTimezone(result.end, practiceTimezone)}</p>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                <p>
                  {result.practitionerName}
                  {result.practitionerEmail ? ` • ${result.practitionerEmail}` : ''}
                </p>
                {result.isRecurring ? (
                  <p>Repeats weekly on {weekDayNames[result.weekday ?? 0]}</p>
                ) : null}
              </div>
              {result.description ? (
                <p className="mt-2 text-sm text-muted-foreground">{result.description}</p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
