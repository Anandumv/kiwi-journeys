import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { processPaidReservation } from "@/lib/payment-reconciliation";
import { processEmailJobs } from "@/lib/email-jobs";
import { formatNZD } from "@/lib/money";

export const dynamic = "force-dynamic";
export default async function OperationsPage({ searchParams }: {
  searchParams: Promise<{ result?: string }>;
}) {
  if (!(await getCurrentAdmin())) redirect("/admin/login");
  const { result } = await searchParams;
  const [issues, jobs, issueCount, jobCount] = await Promise.all([
    prisma.paymentIssue.findMany({ where: { resolvedAt: null }, orderBy: { createdAt: "asc" }, take: 50 }),
    prisma.emailJob.findMany({ where: { sentAt: null }, orderBy: { createdAt: "asc" }, take: 50 }),
    prisma.paymentIssue.count({ where: { resolvedAt: null } }),
    prisma.emailJob.count({ where: { sentAt: null } }),
  ]);
  async function retryPayment(form: FormData) {
    "use server";
    if (!(await getCurrentAdmin())) redirect("/admin/login");
    const id = String(form.get("paymentIntentId") || "");
    const issue = await prisma.paymentIssue.findUnique({ where: { paymentIntentId: id } });
    if (!issue || issue.resolvedAt) redirect("/admin/operations");
    let outcome = "payment-failed";
    try {
      if (!isStripeConfigured()) throw new Error("Payment service unavailable");
      const payment = await getStripe().paymentIntents.retrieve(id, { expand: ["latest_charge"] });
      if (payment.status !== "succeeded" || payment.metadata.reservationId !== issue.reservationId) {
        throw new Error("Payment is not eligible for booking");
      }
      const charge = payment.latest_charge;
      if (!charge || typeof charge === "string") throw new Error("Charge state unavailable");
      if (charge.refunded) {
        await prisma.paymentIssue.update({ where: { paymentIntentId: id },
          data: { resolvedAt: new Date(), reason: "Full refund verified with Stripe." } });
        outcome = "refund-verified";
      } else {
        if (charge.amount_refunded > 0) throw new Error("Review partial refund before retrying");
        await processPaidReservation({ id, reservationId: issue.reservationId,
          amountReceived: payment.amount_received, currency: payment.currency });
        outcome = "payment-completed";
      }
    } catch { /* The issue stays open for operator review. */ }
    revalidatePath("/admin/operations");
    redirect(`/admin/operations?result=${outcome}`);
  }
  async function retryEmails() {
    "use server";
    if (!(await getCurrentAdmin())) redirect("/admin/login");
    const delivery = await processEmailJobs();
    revalidatePath("/admin/operations");
    redirect(`/admin/operations?result=${delivery.unavailable ? "email-unavailable" : "emails-checked"}`);
  }
  const messages: Record<string, string> = {
    "refund-verified": "Stripe confirmed that the payment was fully refunded. The issue is resolved.",
    "payment-completed": "The payment has been matched to a confirmed booking.",
    "payment-failed": "The booking could not be completed. The payment remains open for review.",
    "email-unavailable": "Email delivery is not configured. Pending emails have been preserved.",
    "emails-checked": "Due emails were checked. Review any remaining failures below.",
  };
  return <main className="mx-auto w-full max-w-6xl space-y-8 p-4 sm:p-8">
    <header><h1 className="font-serif text-3xl text-brand-900">Operations</h1>
      <p className="mt-2 text-foreground/70">Payments that need attention and booking emails awaiting delivery.</p></header>
    {result && messages[result] && <p role="status" className="rounded-lg border bg-white p-4">{messages[result]}</p>}
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Payments requiring review ({issueCount})</h2>
      <p className="text-sm text-foreground/70">Retry checks the payment with Stripe and attempts booking again, or closes the issue if a full refund is verified. It does not charge the customer. If inventory cannot be restored, review the payment in Stripe and arrange a refund.</p>
      {!issues.length && <p className="rounded-xl bg-white p-5">No payments awaiting review.</p>}
      {issues.map(issue => <article key={issue.paymentIntentId} className="space-y-3 rounded-xl border bg-white p-5">
        <p className="break-all font-mono text-sm">{issue.paymentIntentId}</p>
        <p>{issue.currency.toUpperCase() === "NZD" ? formatNZD(issue.amountCents) : `${issue.amountCents} minor units ${issue.currency.toUpperCase()}`}</p>
        <p className="text-sm">{issue.reason}</p>
        <form action={retryPayment}><input type="hidden" name="paymentIntentId" value={issue.paymentIntentId}/>
          <button className="rounded-lg bg-brand-800 px-4 py-2 text-sm text-white">Retry booking</button></form>
      </article>)}
      {issueCount > issues.length && <p>Showing the oldest 50 of {issueCount} unresolved payments.</p>}
    </section>
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Email delivery ({jobCount} pending)</h2>
        <form action={retryEmails}><button className="rounded-lg border bg-white px-4 py-2 text-sm">Process due emails</button></form></div>
      <p className="text-sm text-foreground/70">Automatic delivery requires the deliver-emails scheduler. After eight attempts or 23 hours from the first attempt, check the provider delivery log before sending manually to avoid duplicates.</p>
      {!jobs.length && <p className="rounded-xl bg-white p-5">No emails awaiting delivery.</p>}
      {jobs.map(job => {
        const review = job.attempts >= 8 || (job.firstAttemptAt && Date.now() - job.firstAttemptAt.getTime() >= 23 * 3600_000);
        return <article key={job.id} className="rounded-xl border bg-white p-5">
          <p className="font-medium">{job.subject}</p><p className="break-all text-sm text-foreground/70">{job.recipient}</p>
          <p className="mt-2 text-sm">{review ? "Manual review required" : job.lockedUntil && job.lockedUntil > new Date() ? "Delivery in progress" : "Awaiting delivery"} · {job.attempts} attempts</p>
          {job.lastError && <p className="mt-1 text-sm text-red-700">{job.lastError}</p>}
        </article>;
      })}
      {jobCount > jobs.length && <p>Showing the oldest 50 of {jobCount} pending emails.</p>}
    </section>
    <Link href="/admin/bookings" className="text-brand-800 underline">View bookings</Link>
  </main>;
}
