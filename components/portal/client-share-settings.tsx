'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';

interface PractitionerInfo {
  id: string;
  name: string | null;
  email: string | null;
}

interface SharePreference {
  practitionerId: string;
  shareProfile: boolean;
  shareHorses: boolean;
}

interface ClientShareSettingsProps {
  practitioners: PractitionerInfo[];
  defaults: {
    shareProfileWithPractitioners: boolean;
    shareHorsesWithPractitioners: boolean;
  };
  initialOverrides: SharePreference[];
}

export function ClientShareSettings({
  practitioners,
  defaults,
  initialOverrides,
}: ClientShareSettingsProps) {
  const overrideMap = useMemo(
    () => new Map(initialOverrides.map((item) => [item.practitionerId, item])),
    [initialOverrides],
  );
  const [preferences, setPreferences] = useState<SharePreference[]>(
    practitioners.map((practitioner) => {
      const override = overrideMap.get(practitioner.id);
      return {
        practitionerId: practitioner.id,
        shareProfile: override?.shareProfile ?? defaults.shareProfileWithPractitioners,
        shareHorses: override?.shareHorses ?? defaults.shareHorsesWithPractitioners,
      };
    }),
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function updatePreference(
    practitionerId: string,
    updates: Partial<Pick<SharePreference, 'shareProfile' | 'shareHorses'>>,
  ) {
    setPreferences((prev) =>
      prev.map((pref) =>
        pref.practitionerId === practitionerId ? { ...pref, ...updates } : pref,
      ),
    );
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/portal/shares', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: preferences.map((pref) => ({
            practitionerId: pref.practitionerId,
            shareProfile: pref.shareProfile,
            shareHorses: pref.shareHorses,
          })),
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? 'Unable to update sharing preferences');
      }
      setMessage('Sharing preferences updated.');
    } catch (error: any) {
      setMessage(error.message ?? 'Unable to update preferences');
    } finally {
      setSaving(false);
    }
  }

  if (practitioners.length === 0) {
    return <p className="text-sm text-muted-foreground">No practitioners found yet.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">How sharing works</p>
        <p className="mt-1">
          Defaults from your profile apply to everyone. Adjust individual practitioners below to
          share more or less information than your default preference.
        </p>
      </div>
      <div className="space-y-3">
        {practitioners.map((practitioner) => {
          const pref = preferences.find((item) => item.practitionerId === practitioner.id)!;
          return (
            <div key={practitioner.id} className="rounded-lg border bg-card p-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-foreground">
                  {practitioner.name ?? practitioner.email ?? 'Practitioner'}
                </span>
                <span className="text-xs text-muted-foreground">{practitioner.email}</span>
              </div>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={pref.shareProfile}
                    onChange={(event) =>
                      updatePreference(practitioner.id, { shareProfile: event.target.checked })
                    }
                  />
                  Share profile
                </label>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={pref.shareHorses}
                    onChange={(event) =>
                      updatePreference(practitioner.id, { shareHorses: event.target.checked })
                    }
                  />
                  Share horse details
                </label>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save preferences'}
        </Button>
        {message ? (
          <p className="text-sm text-muted-foreground">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
