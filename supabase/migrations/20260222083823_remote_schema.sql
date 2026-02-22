


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."LandmarkCreationType" AS ENUM (
    'TOURIST_ATTRACTION',
    'COMMERCIAL',
    'PERSONAL'
);


ALTER TYPE "public"."LandmarkCreationType" OWNER TO "postgres";


CREATE TYPE "public"."district" AS ENUM (
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    'Lone'
);


ALTER TYPE "public"."district" OWNER TO "postgres";


CREATE TYPE "public"."landmark_category" AS ENUM (
    'Nature',
    'Landscape',
    'Water',
    'History',
    'Religious'
);


ALTER TYPE "public"."landmark_category" OWNER TO "postgres";


CREATE TYPE "public"."landmark_type" AS ENUM (
    'Caves',
    'Church',
    'Cultural Heritage',
    'Falls',
    'Farm',
    'Garden',
    'Historic Monuments',
    'Historical Cultural Attraction',
    'Historical Road/Trails',
    'Historical Site',
    'Landscape/Seascape',
    'Mall',
    'Monument',
    'Mountain/Hill/Highland',
    'Museum',
    'Natural Attraction',
    'Religious Site',
    'Restaurant',
    'River/Landscape',
    'Structures'
);


ALTER TYPE "public"."landmark_type" OWNER TO "postgres";


CREATE TYPE "public"."landmark_type2" AS ENUM (
    'Historical',
    'Landmark',
    'Nature',
    'Religious',
    'Museum',
    'Mall'
);


ALTER TYPE "public"."landmark_type2" OWNER TO "postgres";


CREATE TYPE "public"."municipality" AS ENUM (
    'Bulakan',
    'Calumpit',
    'Hagonoy',
    'Malolos',
    'Paombong',
    'Pulilan',
    'Baliwag',
    'Bustos',
    'Plaridel',
    'DRT',
    'San Ildefonso',
    'San Miguel',
    'San Rafael',
    'Marilao',
    'Meycauayan',
    'Obando',
    'Balagtas',
    'Bocaue',
    'Guiguinto',
    'Pandi',
    'Angat',
    'Norzagaray',
    'Santa Maria',
    'SJDM'
);


ALTER TYPE "public"."municipality" OWNER TO "postgres";


CREATE TYPE "public"."review_report_status" AS ENUM (
    'PENDING',
    'ACTION_TAKEN',
    'DISMISSED'
);


ALTER TYPE "public"."review_report_status" OWNER TO "postgres";


CREATE TYPE "public"."user_type" AS ENUM (
    'Regular',
    'Admin',
    'SuperAdmin'
);


ALTER TYPE "public"."user_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_full_itinerary"("p_name" "text", "p_distance" double precision, "p_place_list" "jsonb") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  new_itinerary_id BIGINT;
  v_user_id UUID := auth.uid(); 
BEGIN
  -- 1. Check if user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Insert the Itinerary
  INSERT INTO itinerary (name, user_id, distance)
  VALUES (p_name, v_user_id, p_distance)
  RETURNING id INTO new_itinerary_id;

  -- 3. Loop through the flat array and insert Stops with their order
  -- Using WITH ORDINALITY handles the sequence automatically
  INSERT INTO stops (itinerary_id, place_id, visit_order)
  SELECT 
    new_itinerary_id, 
    (elem#>>'{}')::BIGINT, 
    ord::INTEGER
  FROM jsonb_array_elements(p_place_list) WITH ORDINALITY AS t(elem, ord);

  RETURN new_itinerary_id;
END;
$$;


ALTER FUNCTION "public"."create_full_itinerary"("p_name" "text", "p_distance" double precision, "p_place_list" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_filterable_reviews"("place_id_input" bigint, "rating_filter" integer DEFAULT NULL::integer, "sort_column" "text" DEFAULT 'created_at'::"text", "sort_descending" boolean DEFAULT true, "page_number" integer DEFAULT 1, "page_size" integer DEFAULT 10, "ignore_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("id" bigint, "content" "text", "rating" real, "images" "text"[], "place_id" bigint, "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "user_id" "uuid", "author_name" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.content::text,
    r.rating::float4,
    r.images::text[],
    r.place_id,      
    r.created_at,
    r.updated_at,       
    r.user_id::uuid,
    p.full_name::text as author_name
  FROM reviews r -- Updated table name
  LEFT JOIN profiles p ON r.user_id = p.user_id
  WHERE r.place_id = place_id_input
    AND (ignore_user_id IS NULL OR r.user_id != ignore_user_id)
    AND (rating_filter IS NULL OR r.rating = rating_filter)
  ORDER BY 
    CASE WHEN sort_column = 'rating' AND sort_descending THEN r.rating END DESC,
    CASE WHEN sort_column = 'rating' AND NOT sort_descending THEN r.rating END ASC,
    CASE WHEN sort_column = 'created_at' AND sort_descending THEN r.created_at END DESC,
    CASE WHEN sort_column = 'created_at' AND NOT sort_descending THEN r.created_at END ASC,
    CASE WHEN sort_column = 'updated_at' AND sort_descending THEN r.updated_at END DESC,
    CASE WHEN sort_column = 'updated_at' AND NOT sort_descending THEN r.updated_at END ASC,
    r.id DESC
  LIMIT page_size
  OFFSET (page_number - 1) * page_size;
END;
$$;


ALTER FUNCTION "public"."get_filterable_reviews"("place_id_input" bigint, "rating_filter" integer, "sort_column" "text", "sort_descending" boolean, "page_number" integer, "page_size" integer, "ignore_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_places_with_stats"("target_id" bigint DEFAULT NULL::bigint) RETURNS TABLE("id" bigint, "name" "text", "municipality" "public"."municipality", "district" "public"."district", "latitude" double precision, "longitude" double precision, "description" "text", "image_url" "text", "image_credits" "text", "gmaps_rating" real, "type" "public"."landmark_type2", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "deleted_at" timestamp with time zone, "creation_type" "public"."LandmarkCreationType", "average_rating" double precision, "review_count" bigint, "opening_hours" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
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
      jsonb_agg(oh.*) as hours
    FROM opening_hours oh
    GROUP BY oh.place_id
  )
  SELECT 
    p.id,             -- Explicitly use 'p.' to avoid ambiguity
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
    p.updated_at,
    p.created_at,
    p.deleted_at,
    p.creation_type,
    COALESCE(rs.avg_r, 0)::float8,
    COALESCE(rs.count_r, 0)::bigint,
    COALESCE(ha.hours, '[]'::jsonb)
  FROM places p
  LEFT JOIN review_stats rs ON p.id = rs.place_id
  LEFT JOIN hours_agg ha ON p.id = ha.place_id
  WHERE (target_id IS NULL OR p.id = target_id) -- 'p.id' resolves ambiguity
    AND p.deleted_at IS NULL;
END;
$$;


ALTER FUNCTION "public"."get_places_with_stats"("target_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_recent_reviews_by_place"("place_id_input" bigint, "limit_input" integer DEFAULT 3) RETURNS TABLE("id" bigint, "place_id" bigint, "content" "text", "rating" real, "images" "text"[], "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "user_id" "uuid", "author_name" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,                       
    r.place_id,                 
    r.content::text,            
    r.rating::float4,           
    r.images::text[],           
    r.created_at,               
    r.updated_at,               
    r.user_id::uuid,            
    p.full_name::text           
  FROM reviews r
  LEFT JOIN profiles p ON r.user_id = p.user_id
  WHERE r.place_id = place_id_input -- Use the input parameter name
  ORDER BY r.created_at DESC        -- Explicitly use the table alias
  LIMIT limit_input;
END;
$$;


ALTER FUNCTION "public"."get_recent_reviews_by_place"("place_id_input" bigint, "limit_input" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_review_report_by_id"("p_report_id" bigint) RETURNS TABLE("id" bigint, "review_id" bigint, "reporter_id" "uuid", "reason" "text", "details" "text", "status" "public"."review_report_status", "created_at" timestamp with time zone, "review_content" "text", "review_rating" numeric, "review_images" "text"[], "place_name" "text", "reporter_name" "text", "reviewer_name" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rr.id,
    rr.review_id,
    rr.reporter_id,
    rr.reason,
    rr.details,
    rr.status,
    rr.created_at,
    r.content AS review_content,
    r.rating::NUMERIC AS review_rating,
    r.images AS review_images,
    p.name AS place_name,     -- Updated table/alias
    p_rep.full_name AS reporter_name,
    p_auth.full_name AS reviewer_name
  FROM review_reports rr
  LEFT JOIN reviews r ON rr.review_id = r.id         -- Updated table name
  LEFT JOIN places p ON r.place_id = p.id            -- Updated table/column names
  LEFT JOIN profiles p_rep ON rr.reporter_id = p_rep.user_id
  LEFT JOIN profiles p_auth ON r.user_id = p_auth.user_id
  WHERE rr.id = p_report_id;
END;
$$;


ALTER FUNCTION "public"."get_review_report_by_id"("p_report_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_review_reports"("p_status" "public"."review_report_status" DEFAULT NULL::"public"."review_report_status") RETURNS TABLE("id" bigint, "review_id" bigint, "reporter_id" "uuid", "reason" "text", "details" "text", "status" "public"."review_report_status", "created_at" timestamp with time zone, "review_content" "text", "review_rating" integer, "review_images" "text"[], "place_name" "text", "reporter_name" "text", "reviewer_name" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rr.id,
    rr.review_id,
    rr.reporter_id,
    rr.reason,
    rr.details,
    rr.status,
    rr.created_at,
    r.content AS review_content,
    r.rating::int AS review_rating,
    r.images AS review_images,
    p.name AS place_name,     -- Updated alias and column
    p_rep.full_name AS reporter_name,
    p_auth.full_name AS reviewer_name
  FROM review_reports rr
  LEFT JOIN reviews r ON rr.review_id = r.id         -- Updated table name
  LEFT JOIN places p ON r.place_id = p.id            -- Updated table/column names
  LEFT JOIN profiles p_rep ON rr.reporter_id = p_rep.user_id
  LEFT JOIN profiles p_auth ON r.user_id = p_auth.user_id
  WHERE (p_status IS NULL OR rr.status = p_status)
  ORDER BY rr.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_review_reports"("p_status" "public"."review_report_status") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "content" "text" NOT NULL,
    "user_id" "uuid",
    "place_id" bigint,
    "images" "text"[] NOT NULL,
    "rating" smallint
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_place_review"("place_id_input" bigint, "rating_input" integer, "content_input" "text", "images_input" "text"[]) RETURNS SETOF "public"."reviews"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  INSERT INTO public.reviews (
    place_id,
    rating,
    content,
    images,
    user_id
  )
  VALUES (
    place_id_input,
    rating_input,
    content_input,
    images_input,
    auth.uid() -- Automatically gets the ID from the JWT
  )
  RETURNING *; 
END;
$$;


ALTER FUNCTION "public"."submit_place_review"("place_id_input" bigint, "rating_input" integer, "content_input" "text", "images_input" "text"[]) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."distances" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "source" bigint NOT NULL,
    "destination" bigint NOT NULL,
    "distance" double precision NOT NULL
);


ALTER TABLE "public"."distances" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."itinerary" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "distance" double precision DEFAULT '0'::double precision NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."itinerary" OWNER TO "postgres";


ALTER TABLE "public"."itinerary" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."itinerary_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."reviews" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."landmark_reviews_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."opening_hours" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "place_id" bigint NOT NULL,
    "day_of_week" smallint DEFAULT '0'::smallint NOT NULL,
    "is_closed" boolean DEFAULT false NOT NULL,
    "opens_at" time with time zone,
    "closes_at" time with time zone
);


ALTER TABLE "public"."opening_hours" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."places" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "longitude" double precision NOT NULL,
    "latitude" double precision NOT NULL,
    "image_url" "text",
    "description" "text",
    "updated_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "gmaps_rating" real DEFAULT '0'::real NOT NULL,
    "district" "public"."district" NOT NULL,
    "municipality" "public"."municipality" NOT NULL,
    "deleted_at" timestamp with time zone,
    "creation_type" "public"."LandmarkCreationType" DEFAULT 'TOURIST_ATTRACTION'::"public"."LandmarkCreationType" NOT NULL,
    "type" "public"."landmark_type2" DEFAULT 'Landmark'::"public"."landmark_type2",
    "image_credits" "text",
    "is_verified" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."places" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stops" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "visited_at" timestamp with time zone,
    "itinerary_id" bigint NOT NULL,
    "place_id" bigint NOT NULL,
    "visit_order" integer DEFAULT 0 NOT NULL,
    "visit_duration" real DEFAULT '30'::real NOT NULL,
    CONSTRAINT "stops_visit_duration_check" CHECK ((("visit_duration" > (0)::double precision) AND ("visit_duration" < (1440)::double precision)))
);


ALTER TABLE "public"."stops" OWNER TO "postgres";


COMMENT ON COLUMN "public"."stops"."visit_duration" IS 'Number of minutes to stay in this stop';



ALTER TABLE "public"."stops" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."poi_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."places" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."point_of_interest_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" bigint NOT NULL,
    "user_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "full_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_type" "public"."user_type" DEFAULT 'Regular'::"public"."user_type" NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


ALTER TABLE "public"."profiles" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."profiles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."review_reports" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "reporter_id" "uuid",
    "review_id" bigint,
    "reason" "text" DEFAULT ''::"text" NOT NULL,
    "details" "text" DEFAULT ''::"text" NOT NULL,
    "status" "public"."review_report_status" DEFAULT 'PENDING'::"public"."review_report_status" NOT NULL
);


ALTER TABLE "public"."review_reports" OWNER TO "postgres";


ALTER TABLE "public"."review_reports" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."review_reports_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."distances"
    ADD CONSTRAINT "distances_pkey" PRIMARY KEY ("source", "destination");



ALTER TABLE ONLY "public"."itinerary"
    ADD CONSTRAINT "itinerary_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "landmark_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."opening_hours"
    ADD CONSTRAINT "opening_hours_pkey" PRIMARY KEY ("place_id", "day_of_week");



ALTER TABLE ONLY "public"."stops"
    ADD CONSTRAINT "poi_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."places"
    ADD CONSTRAINT "point_of_interest_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."review_reports"
    ADD CONSTRAINT "review_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."review_reports"
    ADD CONSTRAINT "unique_review_reporter" UNIQUE ("review_id", "reporter_id");



ALTER TABLE ONLY "public"."distances"
    ADD CONSTRAINT "distances_destination_fkey" FOREIGN KEY ("destination") REFERENCES "public"."places"("id");



ALTER TABLE ONLY "public"."distances"
    ADD CONSTRAINT "distances_source_fkey" FOREIGN KEY ("source") REFERENCES "public"."places"("id");



ALTER TABLE ONLY "public"."itinerary"
    ADD CONSTRAINT "itinerary_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."opening_hours"
    ADD CONSTRAINT "landmark_opening_hours_landmark_id_fkey" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "landmark_reviews_landmark_id_fkey" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "landmark_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stops"
    ADD CONSTRAINT "poi_itinerary_id_fkey" FOREIGN KEY ("itinerary_id") REFERENCES "public"."itinerary"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stops"
    ADD CONSTRAINT "poi_landmark_id_fkey" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."review_reports"
    ADD CONSTRAINT "review_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."review_reports"
    ADD CONSTRAINT "review_reports_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON UPDATE CASCADE ON DELETE CASCADE;



CREATE POLICY "Allow admins to delete reviews" ON "public"."reviews" FOR DELETE USING ((( SELECT "profiles_1"."user_type"
   FROM "public"."profiles" "profiles_1"
  WHERE ("profiles_1"."user_id" = "auth"."uid"())) <> 'Regular'::"public"."user_type"));



CREATE POLICY "Allow admins to update distances" ON "public"."distances" FOR UPDATE USING ((( SELECT "profiles_1"."user_type"
   FROM "public"."profiles" "profiles_1"
  WHERE ("profiles_1"."user_id" = "auth"."uid"())) <> 'Regular'::"public"."user_type"));



CREATE POLICY "Allow admins to update report status" ON "public"."review_reports" FOR UPDATE USING ((( SELECT "profiles_1"."user_type"
   FROM "public"."profiles" "profiles_1"
  WHERE ("profiles_1"."user_id" = "auth"."uid"())) <> 'Regular'::"public"."user_type"));



CREATE POLICY "Allow inserts for admins" ON "public"."distances" FOR INSERT WITH CHECK ((( SELECT "profiles_1"."user_type"
   FROM "public"."profiles" "profiles_1"
  WHERE ("profiles_1"."user_id" = "auth"."uid"())) <> 'Regular'::"public"."user_type"));



CREATE POLICY "Allow regular users to insert their own landmarks" ON "public"."places" FOR INSERT TO "authenticated" WITH CHECK (("creation_type" = 'PERSONAL'::"public"."LandmarkCreationType"));



CREATE POLICY "Allow update" ON "public"."opening_hours" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Allow update only to admins" ON "public"."places" FOR UPDATE TO "authenticated" USING ((( SELECT "profiles_1"."user_type"
   FROM "public"."profiles" "profiles_1"
  WHERE ("profiles_1"."user_id" = "auth"."uid"())) <> 'Regular'::"public"."user_type")) WITH CHECK (true);



CREATE POLICY "Allow users to update their itinerary only" ON "public"."stops" USING ((EXISTS ( SELECT 1
   FROM "public"."itinerary"
  WHERE (("itinerary"."id" = "stops"."itinerary_id") AND ("itinerary"."user_id" = "auth"."uid"())))));



CREATE POLICY "Allow users to update their reviews" ON "public"."reviews" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable admins to change status" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((( SELECT "profiles_1"."user_type"
   FROM "public"."profiles" "profiles_1"
  WHERE ("profiles_1"."user_id" = "auth"."uid"())) <> 'Regular'::"public"."user_type")) WITH CHECK (true);



CREATE POLICY "Enable delete for users based on reporter id" ON "public"."review_reports" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "reporter_id"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."itinerary" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."reviews" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable insert for admins only" ON "public"."places" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "profiles_1"."user_type"
   FROM "public"."profiles" "profiles_1"
  WHERE ("profiles_1"."user_id" = "auth"."uid"())) <> 'Regular'::"public"."user_type"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."itinerary" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."opening_hours" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."review_reports" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."reviews" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."stops" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for everyone" ON "public"."profiles" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."distances" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."itinerary" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable read access for all users" ON "public"."opening_hours" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."places" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."review_reports" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."reviews" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."stops" FOR SELECT USING (true);



CREATE POLICY "Enable update for itinerary owners" ON "public"."itinerary" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."distances" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."itinerary" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."opening_hours" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."places" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."review_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stops" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."create_full_itinerary"("p_name" "text", "p_distance" double precision, "p_place_list" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_full_itinerary"("p_name" "text", "p_distance" double precision, "p_place_list" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_full_itinerary"("p_name" "text", "p_distance" double precision, "p_place_list" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_filterable_reviews"("place_id_input" bigint, "rating_filter" integer, "sort_column" "text", "sort_descending" boolean, "page_number" integer, "page_size" integer, "ignore_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_filterable_reviews"("place_id_input" bigint, "rating_filter" integer, "sort_column" "text", "sort_descending" boolean, "page_number" integer, "page_size" integer, "ignore_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_filterable_reviews"("place_id_input" bigint, "rating_filter" integer, "sort_column" "text", "sort_descending" boolean, "page_number" integer, "page_size" integer, "ignore_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_places_with_stats"("target_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_places_with_stats"("target_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_places_with_stats"("target_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_recent_reviews_by_place"("place_id_input" bigint, "limit_input" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_recent_reviews_by_place"("place_id_input" bigint, "limit_input" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_recent_reviews_by_place"("place_id_input" bigint, "limit_input" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_review_report_by_id"("p_report_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_review_report_by_id"("p_report_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_review_report_by_id"("p_report_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_review_reports"("p_status" "public"."review_report_status") TO "anon";
GRANT ALL ON FUNCTION "public"."get_review_reports"("p_status" "public"."review_report_status") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_review_reports"("p_status" "public"."review_report_status") TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON FUNCTION "public"."submit_place_review"("place_id_input" bigint, "rating_input" integer, "content_input" "text", "images_input" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."submit_place_review"("place_id_input" bigint, "rating_input" integer, "content_input" "text", "images_input" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_place_review"("place_id_input" bigint, "rating_input" integer, "content_input" "text", "images_input" "text"[]) TO "service_role";


















GRANT ALL ON TABLE "public"."distances" TO "anon";
GRANT ALL ON TABLE "public"."distances" TO "authenticated";
GRANT ALL ON TABLE "public"."distances" TO "service_role";



GRANT ALL ON TABLE "public"."itinerary" TO "anon";
GRANT ALL ON TABLE "public"."itinerary" TO "authenticated";
GRANT ALL ON TABLE "public"."itinerary" TO "service_role";



GRANT ALL ON SEQUENCE "public"."itinerary_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."itinerary_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."itinerary_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."landmark_reviews_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."landmark_reviews_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."landmark_reviews_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."opening_hours" TO "anon";
GRANT ALL ON TABLE "public"."opening_hours" TO "authenticated";
GRANT ALL ON TABLE "public"."opening_hours" TO "service_role";



GRANT ALL ON TABLE "public"."places" TO "anon";
GRANT ALL ON TABLE "public"."places" TO "authenticated";
GRANT ALL ON TABLE "public"."places" TO "service_role";



GRANT ALL ON TABLE "public"."stops" TO "anon";
GRANT ALL ON TABLE "public"."stops" TO "authenticated";
GRANT ALL ON TABLE "public"."stops" TO "service_role";



GRANT ALL ON SEQUENCE "public"."poi_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."poi_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."poi_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."point_of_interest_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."point_of_interest_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."point_of_interest_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."profiles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."profiles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."profiles_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."review_reports" TO "anon";
GRANT ALL ON TABLE "public"."review_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."review_reports" TO "service_role";



GRANT ALL ON SEQUENCE "public"."review_reports_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."review_reports_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."review_reports_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

drop policy "Allow admins to update distances" on "public"."distances";

drop policy "Allow inserts for admins" on "public"."distances";

drop policy "Allow regular users to insert their own landmarks" on "public"."places";

drop policy "Allow update only to admins" on "public"."places";

drop policy "Enable insert for admins only" on "public"."places";

drop policy "Enable admins to change status" on "public"."profiles";

drop policy "Allow admins to update report status" on "public"."review_reports";

drop policy "Allow admins to delete reviews" on "public"."reviews";

drop policy "Allow users to update their itinerary only" on "public"."stops";

alter table "public"."distances" drop constraint "distances_destination_fkey";

alter table "public"."distances" drop constraint "distances_source_fkey";

alter table "public"."opening_hours" drop constraint "landmark_opening_hours_landmark_id_fkey";

alter table "public"."review_reports" drop constraint "review_reports_review_id_fkey";

alter table "public"."reviews" drop constraint "landmark_reviews_landmark_id_fkey";

alter table "public"."stops" drop constraint "poi_itinerary_id_fkey";

alter table "public"."stops" drop constraint "poi_landmark_id_fkey";

drop function if exists "public"."get_review_reports"(p_status review_report_status);

drop function if exists "public"."get_places_with_stats"(target_id bigint);

drop function if exists "public"."get_review_report_by_id"(p_report_id bigint);

alter table "public"."places" alter column "creation_type" set default 'TOURIST_ATTRACTION'::public."LandmarkCreationType";

alter table "public"."places" alter column "creation_type" set data type public."LandmarkCreationType" using "creation_type"::text::public."LandmarkCreationType";

alter table "public"."places" alter column "district" set data type public.district using "district"::text::public.district;

alter table "public"."places" alter column "municipality" set data type public.municipality using "municipality"::text::public.municipality;

alter table "public"."places" alter column "type" set default 'Landmark'::public.landmark_type2;

alter table "public"."places" alter column "type" set data type public.landmark_type2 using "type"::text::public.landmark_type2;

alter table "public"."profiles" alter column "user_type" set default 'Regular'::public.user_type;

alter table "public"."profiles" alter column "user_type" set data type public.user_type using "user_type"::text::public.user_type;

alter table "public"."review_reports" alter column "status" set default 'PENDING'::public.review_report_status;

alter table "public"."review_reports" alter column "status" set data type public.review_report_status using "status"::text::public.review_report_status;

alter table "public"."distances" add constraint "distances_destination_fkey" FOREIGN KEY (destination) REFERENCES public.places(id) not valid;

alter table "public"."distances" validate constraint "distances_destination_fkey";

alter table "public"."distances" add constraint "distances_source_fkey" FOREIGN KEY (source) REFERENCES public.places(id) not valid;

alter table "public"."distances" validate constraint "distances_source_fkey";

alter table "public"."opening_hours" add constraint "landmark_opening_hours_landmark_id_fkey" FOREIGN KEY (place_id) REFERENCES public.places(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."opening_hours" validate constraint "landmark_opening_hours_landmark_id_fkey";

alter table "public"."review_reports" add constraint "review_reports_review_id_fkey" FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."review_reports" validate constraint "review_reports_review_id_fkey";

alter table "public"."reviews" add constraint "landmark_reviews_landmark_id_fkey" FOREIGN KEY (place_id) REFERENCES public.places(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."reviews" validate constraint "landmark_reviews_landmark_id_fkey";

alter table "public"."stops" add constraint "poi_itinerary_id_fkey" FOREIGN KEY (itinerary_id) REFERENCES public.itinerary(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."stops" validate constraint "poi_itinerary_id_fkey";

alter table "public"."stops" add constraint "poi_landmark_id_fkey" FOREIGN KEY (place_id) REFERENCES public.places(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."stops" validate constraint "poi_landmark_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_review_reports(p_status public.review_report_status DEFAULT NULL::public.review_report_status)
 RETURNS TABLE(id bigint, review_id bigint, reporter_id uuid, reason text, details text, status public.review_report_status, created_at timestamp with time zone, review_content text, review_rating integer, review_images text[], place_name text, reporter_name text, reviewer_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    rr.id,
    rr.review_id,
    rr.reporter_id,
    rr.reason,
    rr.details,
    rr.status,
    rr.created_at,
    r.content AS review_content,
    r.rating::int AS review_rating,
    r.images AS review_images,
    p.name AS place_name,     -- Updated alias and column
    p_rep.full_name AS reporter_name,
    p_auth.full_name AS reviewer_name
  FROM review_reports rr
  LEFT JOIN reviews r ON rr.review_id = r.id         -- Updated table name
  LEFT JOIN places p ON r.place_id = p.id            -- Updated table/column names
  LEFT JOIN profiles p_rep ON rr.reporter_id = p_rep.user_id
  LEFT JOIN profiles p_auth ON r.user_id = p_auth.user_id
  WHERE (p_status IS NULL OR rr.status = p_status)
  ORDER BY rr.created_at DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_places_with_stats(target_id bigint DEFAULT NULL::bigint)
 RETURNS TABLE(id bigint, name text, municipality public.municipality, district public.district, latitude double precision, longitude double precision, description text, image_url text, image_credits text, gmaps_rating real, type public.landmark_type2, updated_at timestamp with time zone, created_at timestamp with time zone, deleted_at timestamp with time zone, creation_type public."LandmarkCreationType", average_rating double precision, review_count bigint, opening_hours jsonb)
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
      jsonb_agg(oh.*) as hours
    FROM opening_hours oh
    GROUP BY oh.place_id
  )
  SELECT 
    p.id,             -- Explicitly use 'p.' to avoid ambiguity
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
    p.updated_at,
    p.created_at,
    p.deleted_at,
    p.creation_type,
    COALESCE(rs.avg_r, 0)::float8,
    COALESCE(rs.count_r, 0)::bigint,
    COALESCE(ha.hours, '[]'::jsonb)
  FROM places p
  LEFT JOIN review_stats rs ON p.id = rs.place_id
  LEFT JOIN hours_agg ha ON p.id = ha.place_id
  WHERE (target_id IS NULL OR p.id = target_id) -- 'p.id' resolves ambiguity
    AND p.deleted_at IS NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_review_report_by_id(p_report_id bigint)
 RETURNS TABLE(id bigint, review_id bigint, reporter_id uuid, reason text, details text, status public.review_report_status, created_at timestamp with time zone, review_content text, review_rating numeric, review_images text[], place_name text, reporter_name text, reviewer_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    rr.id,
    rr.review_id,
    rr.reporter_id,
    rr.reason,
    rr.details,
    rr.status,
    rr.created_at,
    r.content AS review_content,
    r.rating::NUMERIC AS review_rating,
    r.images AS review_images,
    p.name AS place_name,     -- Updated table/alias
    p_rep.full_name AS reporter_name,
    p_auth.full_name AS reviewer_name
  FROM review_reports rr
  LEFT JOIN reviews r ON rr.review_id = r.id         -- Updated table name
  LEFT JOIN places p ON r.place_id = p.id            -- Updated table/column names
  LEFT JOIN profiles p_rep ON rr.reporter_id = p_rep.user_id
  LEFT JOIN profiles p_auth ON r.user_id = p_auth.user_id
  WHERE rr.id = p_report_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.submit_place_review(place_id_input bigint, rating_input integer, content_input text, images_input text[])
 RETURNS SETOF public.reviews
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  INSERT INTO public.reviews (
    place_id,
    rating,
    content,
    images,
    user_id
  )
  VALUES (
    place_id_input,
    rating_input,
    content_input,
    images_input,
    auth.uid() -- Automatically gets the ID from the JWT
  )
  RETURNING *; 
END;
$function$
;


  create policy "Allow admins to update distances"
  on "public"."distances"
  as permissive
  for update
  to public
using ((( SELECT profiles_1.user_type
   FROM public.profiles profiles_1
  WHERE (profiles_1.user_id = auth.uid())) <> 'Regular'::public.user_type));



  create policy "Allow inserts for admins"
  on "public"."distances"
  as permissive
  for insert
  to public
with check ((( SELECT profiles_1.user_type
   FROM public.profiles profiles_1
  WHERE (profiles_1.user_id = auth.uid())) <> 'Regular'::public.user_type));



  create policy "Allow regular users to insert their own landmarks"
  on "public"."places"
  as permissive
  for insert
  to authenticated
with check ((creation_type = 'PERSONAL'::public."LandmarkCreationType"));



  create policy "Allow update only to admins"
  on "public"."places"
  as permissive
  for update
  to authenticated
using ((( SELECT profiles_1.user_type
   FROM public.profiles profiles_1
  WHERE (profiles_1.user_id = auth.uid())) <> 'Regular'::public.user_type))
with check (true);



  create policy "Enable insert for admins only"
  on "public"."places"
  as permissive
  for insert
  to authenticated
with check ((( SELECT profiles_1.user_type
   FROM public.profiles profiles_1
  WHERE (profiles_1.user_id = auth.uid())) <> 'Regular'::public.user_type));



  create policy "Enable admins to change status"
  on "public"."profiles"
  as permissive
  for update
  to authenticated
using ((( SELECT profiles_1.user_type
   FROM public.profiles profiles_1
  WHERE (profiles_1.user_id = auth.uid())) <> 'Regular'::public.user_type))
with check (true);



  create policy "Allow admins to update report status"
  on "public"."review_reports"
  as permissive
  for update
  to public
using ((( SELECT profiles_1.user_type
   FROM public.profiles profiles_1
  WHERE (profiles_1.user_id = auth.uid())) <> 'Regular'::public.user_type));



  create policy "Allow admins to delete reviews"
  on "public"."reviews"
  as permissive
  for delete
  to public
using ((( SELECT profiles_1.user_type
   FROM public.profiles profiles_1
  WHERE (profiles_1.user_id = auth.uid())) <> 'Regular'::public.user_type));



  create policy "Allow users to update their itinerary only"
  on "public"."stops"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.itinerary
  WHERE ((itinerary.id = stops.itinerary_id) AND (itinerary.user_id = auth.uid())))));



  create policy "Allow delete 1ffg0oo_0"
  on "storage"."objects"
  as permissive
  for delete
  to public
using ((bucket_id = 'images'::text));



  create policy "Allow delete 1ffg0oo_1"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'images'::text));



  create policy "Allow upload only to admins 1geo3fj_0"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT profiles_1.user_type
   FROM public.profiles profiles_1
  WHERE ((profiles_1.user_id = auth.uid()) AND (profiles_1.user_type <> 'Regular'::public.user_type)))));



  create policy "Allow users to upload images 1ffg0oo_0"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'images'::text));



