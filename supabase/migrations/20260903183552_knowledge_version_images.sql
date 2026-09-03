create table if not exists public.knowledge_version_images (
  id uuid primary key default extensions.gen_random_uuid(),

  knowledge_item_version_id uuid not null
    references public.knowledge_item_versions(id)
    on delete cascade,

  imagekit_file_id text not null,
  imagekit_url text not null,

  alt_text text,
  caption text,

  sort_order integer not null default 0,

  created_by uuid not null
    references auth.users(id),

  created_at timestamptz not null default now(),

  constraint knowledge_version_images_file_id_not_blank
    check (btrim(imagekit_file_id) <> ''),

  constraint knowledge_version_images_url_not_blank
    check (btrim(imagekit_url) <> ''),

  constraint knowledge_version_images_alt_text_not_blank
    check (alt_text is null or btrim(alt_text) <> ''),

  constraint knowledge_version_images_caption_not_blank
    check (caption is null or btrim(caption) <> ''),

  constraint knowledge_version_images_sort_order_non_negative
    check (sort_order >= 0)
);

create index if not exists knowledge_version_images_version_idx
  on public.knowledge_version_images (knowledge_item_version_id);

create index if not exists knowledge_version_images_created_by_idx
  on public.knowledge_version_images (created_by);

alter table public.knowledge_version_images
  enable row level security;

revoke all on table public.knowledge_version_images
  from anon;

revoke all on table public.knowledge_version_images
  from authenticated;

grant select on table public.knowledge_version_images
  to authenticated;

create policy "knowledge_version_images_select"
on public.knowledge_version_images
for select
to authenticated
using (
  (
    select private.current_user_is_active()
  )
  and exists (
    select 1
    from public.knowledge_item_versions v
    join public.knowledge_items i
      on i.id = v.knowledge_item_id
    where v.id = knowledge_version_images.knowledge_item_version_id
      and (
        i.status = 'published'
        or (
          select private.current_user_has_role('knowledge_manager'::public.staff_role)
        )
        or (
          select private.current_user_has_role('super_admin'::public.staff_role)
        )
      )
  )
);

comment on table public.knowledge_version_images is
  'ImageKit image metadata associated with a specific Knowledge version. Files are stored in ImageKit; this table stores the relationship and presentation metadata.';
