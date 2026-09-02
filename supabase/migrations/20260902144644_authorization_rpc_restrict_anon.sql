revoke all on function public.current_user_is_active() from anon;
revoke all on function public.current_user_has_role(public.staff_role) from anon;
revoke all on function public.current_user_has_capability(text) from anon;

grant execute on function public.current_user_is_active() to authenticated;
grant execute on function public.current_user_has_role(public.staff_role) to authenticated;
grant execute on function public.current_user_has_capability(text) to authenticated;
