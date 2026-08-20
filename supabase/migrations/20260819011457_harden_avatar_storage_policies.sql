drop policy if exists "avatars_select_own" on storage.objects;
drop policy if exists "avatars_insert_own" on storage.objects;
drop policy if exists "avatars_update_own" on storage.objects;
drop policy if exists "avatars_delete_own" on storage.objects;

create policy "avatars_select_own"
on storage.objects
as permissive
for select
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (
    select (auth.uid())::text as uid
  )
);

create policy "avatars_insert_own"
on storage.objects
as permissive
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (auth.uid())::text
);

create policy "avatars_update_own"
on storage.objects
as permissive
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (
    select (auth.uid())::text as uid
  )
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (
    select (auth.uid())::text as uid
  )
);

create policy "avatars_delete_own"
on storage.objects
as permissive
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (
    select (auth.uid())::text as uid
  )
);
