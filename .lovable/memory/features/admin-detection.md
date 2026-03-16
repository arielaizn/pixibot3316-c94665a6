Admin detection system — DB-driven, no hardcoded emails

## Architecture
- Admin status stored in `user_roles` table (role = 'admin')
- DB functions: `is_admin(p_user_id)`, `is_admin_by_email(p_email)`, `ensure_admin_credits(p_user_id)`
- `ensure_admin_credits` sets user_credits to is_unlimited=true, plan_type=enterprise, plan_credits=80
- Edge functions use `checkIsAdmin()` helper that calls `is_admin` RPC — no hardcoded email arrays

## Initial Admins
- pixmindstudio3316@gmail.com
- aa046114609@gmail.com
- Both have admin role in user_roles + unlimited credits in user_credits

## Adding New Admins
- Insert into user_roles: `INSERT INTO user_roles (user_id, role) VALUES (uid, 'admin')`
- No code changes needed — DB-driven detection

## Edge Functions Using Admin Check
- pixi-handoff: calls is_admin + ensure_admin_credits
- pixi-whatsapp: checkIsAdmin() helper wraps is_admin RPC
- sumit-payment: not needed (payment bypass not implemented for admins)
