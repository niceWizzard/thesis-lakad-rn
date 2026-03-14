create type "public"."unverified_types" as enum ('Pasalubong Center', 'Accomodation');

drop function if exists "public"."get_places_with_stats"();

alter table "public"."places" add column "unverified_type" public.unverified_types;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_place_by_id(place_id_input bigint)
 RETURNS TABLE(id bigint, name text, municipality public.municipality, district public.district, latitude double precision, longitude double precision, description text, image_url text, image_credits text, gmaps_rating real, type public.phacto_type, updated_at timestamp with time zone, created_at timestamp with time zone, deleted_at timestamp with time zone, creation_type public."LandmarkCreationType", is_verified boolean, average_rating double precision, review_count bigint, opening_hours jsonb)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  WITH review_stats AS (
    SELECT 
      r.place_id,
      AVG(r.rating)::float8 as avg_r,
      COUNT(r.id)::bigint as count_r
    FROM reviews r
    WHERE r.place_id = place_id_input
    GROUP BY r.place_id
  ),
  hours_agg AS (
    SELECT 
      oh.place_id,
      -- Removed the oh.id reference to fix Error 42703
      jsonb_agg(oh.*) as hours 
    FROM opening_hours oh
    WHERE oh.place_id = place_id_input
    GROUP BY oh.place_id
  )
  SELECT 
    p.id,
    p.name::text,
    p.municipality,
    p.district,
    p.latitude::float8,
    p.longitude::float8,
    p.description::text,
    p.image_url::text,
    p.image_credits::text,
    p.gmaps_rating::float4,
    p.type,
    p.unverified_type,
    p.updated_at,
    p.created_at,
    p.deleted_at,
    p.creation_type,
    p.is_verified,
    COALESCE(rs.avg_r, 0)::float8,
    COALESCE(rs.count_r, 0)::bigint,
    -- Safely returns [] even if no opening hours exist
    COALESCE(ha.hours, '[]'::jsonb) 
  FROM places p
  LEFT JOIN review_stats rs ON p.id = rs.place_id
  LEFT JOIN hours_agg ha ON p.id = ha.place_id
  WHERE p.id = place_id_input;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_places_with_stats()
 RETURNS TABLE(id bigint, name text, municipality public.municipality, district public.district, latitude double precision, longitude double precision, description text, image_url text, image_credits text, gmaps_rating real, type public.phacto_type, unverified_type public.unverified_types, updated_at timestamp with time zone, created_at timestamp with time zone, deleted_at timestamp with time zone, creation_type public."LandmarkCreationType", is_verified boolean, average_rating double precision, review_count bigint, opening_hours jsonb)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  WITH review_stats AS (
    SELECT 
      r.place_id,
      AVG(r.rating)::float8 as avg_r,
      COUNT(r.id)::bigint as count_r
    FROM reviews r
    GROUP BY r.place_id
  ),
  hours_agg AS (
    SELECT 
      oh.place_id,
      -- 2. Removed 'ORDER BY oh.id' because it doesn't exist
      jsonb_agg(oh.*) as hours 
    FROM opening_hours oh
    GROUP BY oh.place_id
  )
  SELECT 
    p.id,
    p.name::text,
    p.municipality,
    p.district,
    p.latitude::float8,
    p.longitude::float8,
    p.description::text,
    p.image_url::text,
    p.image_credits::text,
    p.gmaps_rating::float4,
    p.type,
    p.unverified_type,
    p.updated_at,
    p.created_at,
    p.deleted_at,
    p.creation_type,
    p.is_verified,     -- 3. Included in the selection
    COALESCE(rs.avg_r, 0)::float8,
    COALESCE(rs.count_r, 0)::bigint,
    COALESCE(ha.hours, '[]'::jsonb)
  FROM places p
  LEFT JOIN review_stats rs ON p.id = rs.place_id
  LEFT JOIN hours_agg ha ON p.id = ha.place_id
  WHERE p.deleted_at IS NULL;
END;
$function$
;


