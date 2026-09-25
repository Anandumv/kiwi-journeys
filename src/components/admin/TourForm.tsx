"use client";
import { useActionState, type ReactNode } from 'react';
import { saveTour } from '@/app/admin/actions';
export function TourForm({ children }: { children: ReactNode }) {
  const [state, action, pending] = useActionState(saveTour, { error: '' });
  return <form action={action} className="mt-6 max-w-3xl space-y-5">
    {children}
    {state.error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-800">{state.error}</p>}
    <button disabled={pending} className="rounded-full bg-brand-600 px-8 py-3 text-sm font-semibold text-white disabled:opacity-60">{pending ? 'Saving…' : 'Save tour'}</button>
  </form>;
}
