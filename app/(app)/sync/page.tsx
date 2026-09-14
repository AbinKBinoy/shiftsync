import CalendarSync from '@/components/dashboard/CalendarSync';
import InviteCode from '@/components/dashboard/InviteCode';
import { getDashboardContext } from '@/lib/department';

export default async function SyncPage() {
  const { department } = await getDashboardContext();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
        <h2 className="text-sm font-medium text-zinc-300">Invite code</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Share this with teammates so they can join.
        </p>
        <div className="mt-3">
          <InviteCode code={department.invite_code} />
        </div>
      </section>

      <CalendarSync />
    </div>
  );
}
