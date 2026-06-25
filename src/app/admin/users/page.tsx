import { prisma } from "@/lib/db";
import { createUser, deleteUser } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin Users" };

const input = "rounded-lg border border-ivory-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none";

export default async function AdminUsers() {
  const users = await prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } });
  return (
    <div className="p-8">
      <h1 className="font-serif text-3xl font-semibold text-brand-900">Admin Users</h1>

      <form action={createUser} className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-ivory-200 bg-white p-4">
        <label className="text-sm">Name<input name="name" className={`${input} mt-1 block`} /></label>
        <label className="text-sm">Email<input name="email" type="email" required className={`${input} mt-1 block`} /></label>
        <label className="text-sm">Password<input name="password" type="text" required className={`${input} mt-1 block`} /></label>
        <label className="text-sm">Role<input name="role" defaultValue="admin" className={`${input} mt-1 block w-28`} /></label>
        <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Add user</button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl border border-ivory-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-ivory text-left text-foreground/60"><tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3"></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-ivory-200">
                <td className="p-3">{u.name || "—"}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.role}</td>
                <td className="p-3 text-right">
                  <form action={deleteUser} className="inline">
                    <input type="hidden" name="id" value={u.id} />
                    <button className="text-red-600 hover:underline" disabled={users.length <= 1}>Delete</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-foreground/50">Passwords are hashed with bcrypt. The last remaining user cannot be deleted.</p>
    </div>
  );
}
