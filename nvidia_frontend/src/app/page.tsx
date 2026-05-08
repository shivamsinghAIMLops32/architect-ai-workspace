import { redirect } from 'next/navigation';

/**
 * Root route — immediately redirect to the login page.
 * Once auth is implemented with middleware, this will redirect to
 * /dashboard for authenticated users or /login for guests.
 */
export default function RootPage() {
  redirect('/login');
}
