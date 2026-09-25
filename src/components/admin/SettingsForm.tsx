"use client";
import { useActionState, type ReactNode } from 'react';
import { saveSettings } from '@/app/admin/actions';
export function SettingsForm({ children }: { children: ReactNode }) {
  const [state, action, pending] = useActionState(saveSettings, { error: '' });
  return <form action={action} className="mt-6 max-w-3xl space-y-5">
    {children}
    {state.error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-800">{state.error}</p>}
    <button disabled={pending} className="rounded-full bg-brand-600 px-8 py-3 text-sm font-semibold text-white disabled:opacity-60">{pending ? 'Saving…' : 'Save settings'}</button>
  </form>;
}
