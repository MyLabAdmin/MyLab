alter function public.current_user_is_active()
set search_path = '';

alter function public.current_user_has_role(public.staff_role)
set search_path = '';

alter function public.current_user_has_capability(text)
set search_path = '';
