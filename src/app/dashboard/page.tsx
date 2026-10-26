import { redirect } from 'next/navigation';

/**
 * Migration note (F4):
 * Dashboard is migrated to TMdemy Home at '/'.
 * Any legacy accesses to '/dashboard' are permanently redirected to '/'.
 */
export default function DashboardLegacyRedirectPage() {
  redirect('/');
}
