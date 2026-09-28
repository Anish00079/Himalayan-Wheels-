# Online backend: Supabase

The React website stays on GitHub Pages. Supabase runs authentication and the shared PostgreSQL database online, so no personal computer or Express server needs to stay on. The code is ready; a Supabase project must be connected before real online accounts and shared bookings become active. Until then, the published site remains explicitly labelled as a browser demo.

## 1. Create the account and project

Open [Supabase](https://supabase.com/dashboard), sign in, and create a project named **Himalayan Wheels** on the **Free** plan. Save the database password privately; it is not needed in the website or this chat. Choose an available region near your users.

The account owner must complete sign-in. No hosting account or cloud database was created automatically for this project.

## 2. Initialize the database

In the project, open **SQL Editor → New query**. Copy the entire [setup.sql](../supabase/setup.sql) file, paste it into the editor and select **Run**. This creates six cars, customer profiles, booking tables, and protected booking functions. It can be rerun without deleting accounts, existing prices, or reservations.

Public users can read the fleet. Customers can read their own profile and bookings. Bookings and cancellations go through database functions that check the logged-in identity and calculate prices. Only owner accounts can retrieve all customer orders. Public registration always creates a customer; changing signup metadata cannot grant owner access.

## 3. Configure sign-in

In **Authentication → URL Configuration**, set both the Site URL and an allowed redirect URL to:

```text
https://anish00079.github.io/Himalayan-Wheels-/
```

Enable email/password sign-in. For this academic demo, you can disable **Confirm email** so registration works without an email delivery service. In that mode, email ownership is not verified. For verified public accounts, keep confirmation enabled and configure your own SMTP service. Supabase's default email service only sends to authorized project team addresses; the app handles a confirmation-required signup by showing an email confirmation message.

See [Supabase email delivery](https://supabase.com/docs/guides/auth/auth-smtp) and [redirect configuration](https://supabase.com/docs/guides/auth/redirect-urls).

## 4. Connect the website

From the Supabase project's **Connect** panel, copy the **Project URL** and **publishable key** (or the legacy `anon` key). These are public browser configuration values. Do not use a database password, secret key, or `service_role` key.

In the [GitHub repository variables](https://github.com/Anish00079/Himalayan-Wheels-/settings/variables/actions), create:

| Variable | Value |
| --- | --- |
| `SUPABASE_URL` | Project URL, such as `https://your-project.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | Public publishable key from Connect |

Open **Actions → Publish website → Run workflow**. The workflow automatically builds cloud mode when the URL is present. It rejects a missing or private key. After publishing, the browser-demo banner and demo login choices are removed; real signup/login and shared bookings use Supabase. The URL stays the same.

## 5. Enable your owner account

Create your account through the live website's **Sign in → User → Create an account** form. Then open the Supabase SQL Editor and run this query with **your exact account email**:

```sql
update public.profiles p
set role = 'owner'
from auth.users u
where p.id = u.id
  and lower(u.email) = lower('REPLACE_WITH_YOUR_OWNER_EMAIL')
returning p.id, p.name, p.role;
```

It must return exactly the intended account. Sign out of the website and use **Owner login**. Use a separate customer account to create test bookings. Never assign owner access from public signup metadata or a browser-side role selector.

## Verify after connecting

1. In one browser, create a customer account and book a car.
2. In a separate browser or private window, sign in as owner and check the order.
3. Cancel from the customer account and refresh the owner dashboard.
4. Confirm that a customer cannot open owner orders and that an overlapping booking is rejected.

These live-provider checks remain pending until a real project is connected. The SQL schema and row permissions have been executed in a disposable PostgreSQL-compatible test runtime; the frontend cloud build also passes. Those checks do not verify your Supabase project, email settings, or internet deployment.

Free projects may pause after one week of inactivity, according to [Supabase pricing](https://supabase.com/pricing). Resume a paused project from its dashboard. Browser-demo bookings are not transferred to the cloud database. The existing Express/SQLite backend is retained as an optional development alternative, not required for the hosted setup.
