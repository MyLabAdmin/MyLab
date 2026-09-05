create or replace function private.get_knowledge_review_detail(
  p_knowledge_item_version_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_knowledge_item_id uuid;
  v_laboratory_test_id uuid;
  v_laboratory_test_version_id uuid;
  v_version_number integer;
  v_title text;
  v_subtitle text;
  v_summary text;
  v_content text;
  v_pre_test_preparation text;
  v_test_code text;
  v_loinc_code text;
  v_category_id uuid;
  v_primary_category_id uuid;
  v_item_type text;
begin
  perform private.authorize_knowledge_reviewer();

  select
    ki.id,
    ki.item_type,
    kiv.title,
    kiv.subtitle,
    kiv.summary,
    kiv.content,
    kiv.pre_test_preparation,
    kiv.version_number
  into
    v_knowledge_item_id,
    v_item_type,
    v_title,
    v_subtitle,
    v_summary,
    v_content,
    v_pre_test_preparation,
    v_version_number
  from public.knowledge_item_versions kiv
  join public.knowledge_items ki on ki.id = kiv.knowledge_item_id
  where kiv.id = p_knowledge_item_version_id
    and kiv.status = 'draft'
    and kiv.review_status = 'pending_review'
    and ki.status <> 'archived';

  if v_knowledge_item_id is null then
    raise exception 'Knowledge review version not found or not readable'
      using errcode = 'P0002';
  end if;

  if v_item_type = 'laboratory_test' then
    select
      lt.id,
      lt.test_code,
      lt.loinc_code,
      ltv.id
    into
      v_laboratory_test_id,
      v_test_code,
      v_loinc_code,
      v_laboratory_test_version_id
    from public.laboratory_tests lt
    join public.laboratory_test_versions ltv
      on ltv.laboratory_test_id = lt.id
     and ltv.knowledge_item_version_id = p_knowledge_item_version_id
    where lt.knowledge_item_id = v_knowledge_item_id
    limit 1;

    select kic.category_id
    into v_category_id
    from public.knowledge_item_categories kic
    where kic.knowledge_item_id = v_knowledge_item_id
    order by kic.created_at desc
    limit 1;

    select parent.id
    into v_primary_category_id
    from public.knowledge_categories parent
    join public.knowledge_categories child
      on child.parent_id = parent.id
    where child.id = v_category_id
      and parent.parent_id is null
    limit 1;

    return jsonb_build_object(
      'knowledge_item_id', v_knowledge_item_id,
      'knowledge_item_version_id', p_knowledge_item_version_id,
      'item_type', v_item_type,
      'laboratory_test_id', v_laboratory_test_id,
      'laboratory_test_version_id', v_laboratory_test_version_id,
      'version_number', v_version_number,
      'title', v_title,
      'subtitle', v_subtitle,
      'summary', v_summary,
      'content', v_content,
      'pre_test_preparation', v_pre_test_preparation,
      'test_code', v_test_code,
      'loinc_code', v_loinc_code,
      'category_id', v_category_id,
      'primary_category_id', v_primary_category_id,
      'specimens', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'specimen_type', ts.specimen_type,
            'container', ts.container,
            'handling_instructions', ts.handling_instructions
          ) order by ts.created_at, ts.id
        )
        from public.test_specimens ts
        where ts.laboratory_test_version_id = v_laboratory_test_version_id
      ), '[]'::jsonb),
      'methods', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'method_name', tm.method_name,
            'description', tm.description
          ) order by tm.created_at, tm.id
        )
        from public.test_methods tm
        where tm.laboratory_test_version_id = v_laboratory_test_version_id
      ), '[]'::jsonb),
      'interpretations', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'condition', ti.condition,
            'interpretation', ti.interpretation,
            'clinical_significance', ti.clinical_significance,
            'notes', ti.notes
          ) order by ti.created_at, ti.id
        )
        from public.test_interpretations ti
        where ti.laboratory_test_version_id = v_laboratory_test_version_id
      ), '[]'::jsonb),
      'reference_ranges', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'specimen_type', trr.specimen_type,
            'method_name', trr.method_name,
            'population_label', trr.population_label,
            'age_min', trr.age_min,
            'age_max', trr.age_max,
            'age_unit', trr.age_unit,
            'sex', trr.sex,
            'lower_value', trr.lower_value,
            'upper_value', trr.upper_value,
            'unit', trr.unit,
            'notes', trr.notes
          ) order by trr.created_at, trr.id
        )
        from public.test_reference_ranges trr
        where trr.laboratory_test_version_id = v_laboratory_test_version_id
      ), '[]'::jsonb)
    );
  end if;

  return jsonb_build_object(
    'knowledge_item_id', v_knowledge_item_id,
    'knowledge_item_version_id', p_knowledge_item_version_id,
    'item_type', v_item_type,
    'laboratory_test_id', null,
    'laboratory_test_version_id', null,
    'version_number', v_version_number,
    'title', v_title,
    'subtitle', v_subtitle,
    'summary', v_summary,
    'content', v_content,
    'pre_test_preparation', v_pre_test_preparation,
    'test_code', null,
    'loinc_code', null,
    'category_id', null,
    'primary_category_id', null,
    'specimens', '[]'::jsonb,
    'methods', '[]'::jsonb,
    'interpretations', '[]'::jsonb,
    'reference_ranges', '[]'::jsonb
  );
end;
$function$;

create or replace function public.get_knowledge_review_detail(
  p_knowledge_item_version_id uuid
)
returns jsonb
language sql
stable
set search_path = ''
as $function$
  select private.get_knowledge_review_detail(p_knowledge_item_version_id);
$function$;

revoke all on function public.get_knowledge_review_detail(uuid) from public;
revoke all on function public.get_knowledge_review_detail(uuid) from anon;
grant execute on function public.get_knowledge_review_detail(uuid) to authenticated;
grant execute on function public.get_knowledge_review_detail(uuid) to service_role;
