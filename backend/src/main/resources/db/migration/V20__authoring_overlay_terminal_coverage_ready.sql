update spline_authoring_overlay
set status = 'READY',
    updated_at = now()
where status = 'DISCOVERED_PARTIAL'
  and discovery_coverage ?& array['label','states','events','actions']
  and coalesce(discovery_coverage->>'label', '') in ('EXPOSED','NOT_FOUND','NOT_EXPOSED')
  and coalesce(discovery_coverage->>'states', '') in ('EXPOSED','CONFIRMED_EMPTY','NOT_EXPOSED')
  and coalesce(discovery_coverage->>'events', '') in ('EXPOSED','CONFIRMED_EMPTY','NOT_EXPOSED')
  and coalesce(discovery_coverage->>'actions', '') in ('EXPOSED','CONFIRMED_EMPTY','NOT_EXPOSED');
