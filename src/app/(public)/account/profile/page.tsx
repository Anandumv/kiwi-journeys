"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Profile = {
  country?: string | null;
  travelStyle?: string[];
  groupType?: string | null;
  ageGroup?: string | null;
  isCruisePassenger?: boolean;
  referralSource?: string | null;
  marketingConsent?: boolean;
};

const TRAVEL_STYLES = [
  { key: "wildlife", label: "Wildlife & nature" },
  { key: "adventure", label: "Adventure" },
  { key: "wine-food", label: "Wine & food" },
  { key: "scenic", label: "Scenic" },
  { key: "family", label: "Family" },
];

const GROUP_TYPES = ["solo", "couple", "family", "friends", "corporate"];
const AGE_GROUPS = ["18-25", "26-35", "36-50", "51-65", "65+"];
const REFERRAL_SOURCES = [
  { key: "google", label: "Google search" },
  { key: "tripadvisor", label: "TripAdvisor" },
  { key: "instagram", label: "Instagram / social" },
  { key: "friend", label: "Friend or family" },
  { key: "cruise", label: "Cruise line / ship" },
  { key: "hotel", label: "Hotel concierge" },
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/account/profile")
      .then((r) => r.json())
      .then((d) => { setProfile(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function toggleStyle(key: string) {
    const current = profile.travelStyle ?? [];
    setProfile((p) => ({
      ...p,
      travelStyle: current.includes(key) ? current.filter((s) => s !== key) : [...current, key],
    }));
    setSaved(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const d = await res.json();
      if (!res.ok) setError(d.error || "Could not save profile.");
      else setSaved(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const field = "w-full rounded-lg border border-brand-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none";

  if (loading) {
    return <div className="mx-auto max-w-lg px-4 py-20 text-center text-sm text-foreground/40">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <Link href="/account/bookings" className="text-sm text-brand-600 hover:underline">
        ← My bookings
      </Link>

      <h1 className="mt-6 font-serif text-3xl font-semibold text-brand-900">Travel preferences</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Help us personalise your experience and send you relevant offers.
      </p>

      <form onSubmit={save} className="mt-8 space-y-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-800">Country</label>
          <input
            className={field}
            placeholder="e.g. Australia"
            value={profile.country ?? ""}
            onChange={(e) => { setProfile((p) => ({ ...p, country: e.target.value })); setSaved(false); }}
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-brand-800">Travel style (select all that apply)</p>
          <div className="flex flex-wrap gap-2">
            {TRAVEL_STYLES.map((s) => {
              const active = (profile.travelStyle ?? []).includes(s.key);
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => toggleStyle(s.key)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                    active
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-brand-200 text-foreground/70 hover:border-brand-400"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-brand-800">Who do you usually travel with?</p>
          <div className="flex flex-wrap gap-2">
            {GROUP_TYPES.map((g) => {
              const active = profile.groupType === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => { setProfile((p) => ({ ...p, groupType: active ? null : g })); setSaved(false); }}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium capitalize transition ${
                    active
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-brand-200 text-foreground/70 hover:border-brand-400"
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-brand-800">Age group</p>
          <div className="flex flex-wrap gap-2">
            {AGE_GROUPS.map((a) => {
              const active = profile.ageGroup === a;
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => { setProfile((p) => ({ ...p, ageGroup: active ? null : a })); setSaved(false); }}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                    active
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-brand-200 text-foreground/70 hover:border-brand-400"
                  }`}
                >
                  {a}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-800">How did you hear about us?</label>
          <select
            className={field}
            value={profile.referralSource ?? ""}
            onChange={(e) => { setProfile((p) => ({ ...p, referralSource: e.target.value || null })); setSaved(false); }}
          >
            <option value="">Select one…</option>
            {REFERRAL_SOURCES.map((r) => (
              <option key={r.key} value={r.key}>{r.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-3 rounded-xl border border-brand-100 bg-brand-50/50 p-4">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-brand-300 text-brand-600"
              checked={profile.isCruisePassenger ?? false}
              onChange={(e) => { setProfile((p) => ({ ...p, isCruisePassenger: e.target.checked })); setSaved(false); }}
            />
            <span className="text-sm text-foreground/70">I am arriving on a cruise ship</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-brand-300 text-brand-600"
              checked={profile.marketingConsent ?? false}
              onChange={(e) => { setProfile((p) => ({ ...p, marketingConsent: e.target.checked })); setSaved(false); }}
            />
            <span className="text-sm text-foreground/70">
              Send me travel inspiration and tour news (unsubscribe any time)
            </span>
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-brand-600 px-7 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save preferences"}
          </button>
          {saved && <span className="text-sm text-teal-700">Preferences saved!</span>}
        </div>
      </form>
    </div>
  );
}
