do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'knowledge_items',
    'knowledge_item_versions',
    'knowledge_item_categories',
    'knowledge_references',
    'laboratory_tests',
    'laboratory_procedures',
    'laboratory_equipment'
  ] loop
    execute format(
      'revoke insert, update, delete, truncate, references, trigger on table public.%I from anon',
      v_table
    );

    execute format(
      'revoke insert, update, delete, truncate, references, trigger on table public.%I from authenticated',
      v_table
    );
  end loop;
end $$;

revoke insert, update, delete, truncate, references, trigger
on table public.knowledge_version_images
from anon;

revoke insert, update, delete, truncate, references, trigger
on table public.knowledge_version_images
from authenticated;

grant select on table public.knowledge_items to authenticated;
grant select on table public.knowledge_item_versions to authenticated;
grant select on table public.knowledge_item_categories to authenticated;
grant select on table public.knowledge_references to authenticated;
grant select on table public.laboratory_tests to authenticated;
grant select on table public.laboratory_procedures to authenticated;
grant select on table public.laboratory_equipment to authenticated;
grant select on table public.knowledge_version_images to authenticated;
