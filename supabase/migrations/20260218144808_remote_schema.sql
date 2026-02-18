


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


CREATE TYPE "public"."user_type" AS ENUM (
    'Regular',
    'Admin',
    'SuperAdmin'
);


ALTER TYPE "public"."user_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_full_itinerary"("p_name" "text", "p_landmark_list" "jsonb") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  new_itinerary_id BIGINT;
  landmark_id_val BIGINT;
  v_visit_order INTEGER;
  v_user_id UUID := auth.uid(); 
BEGIN
  -- 1. Check if user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Insert the Itinerary
  INSERT INTO itinerary (name, user_id)
  VALUES (p_name, v_user_id)
  RETURNING id INTO new_itinerary_id;

  -- 3. Loop through the flat array and insert POIs with their order
  -- jsonb_array_elements with ORDINALITY gives us the 1-based index automatically
  INSERT INTO poi (itinerary_id, landmark_id, visit_order)
  SELECT 
    new_itinerary_id, 
    (elem#>>'{}')::BIGINT, 
    ord::INTEGER
  FROM jsonb_array_elements(p_landmark_list) WITH ORDINALITY AS t(elem, ord);

  RETURN new_itinerary_id;
END;
$$;


ALTER FUNCTION "public"."create_full_itinerary"("p_name" "text", "p_landmark_list" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_full_itinerary"("p_name" "text", "p_distance" double precision, "p_landmark_list" "jsonb") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  new_itinerary_id BIGINT;
  landmark_id_val BIGINT;
  v_visit_order INTEGER;
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
  -- jsonb_array_elements with ORDINALITY gives us the 1-based index automatically
  INSERT INTO stops (itinerary_id, landmark_id, visit_order)
  SELECT 
    new_itinerary_id, 
    (elem#>>'{}')::BIGINT, 
    ord::INTEGER
  FROM jsonb_array_elements(p_landmark_list) WITH ORDINALITY AS t(elem, ord);

  RETURN new_itinerary_id;
END;
$$;


ALTER FUNCTION "public"."create_full_itinerary"("p_name" "text", "p_distance" double precision, "p_landmark_list" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_full_itinerary"("p_user_id" "uuid", "p_name" "text", "p_landmark_list" "jsonb") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  new_itinerary_id BIGINT;
  poi_record JSONB;
  poi_index BIGINT;
  new_poi_id BIGINT;
BEGIN
  -- 1. Insert the Itinerary
  INSERT INTO itinerary (name, user_id)
  VALUES (p_name, p_user_id)
  RETURNING id INTO new_itinerary_id;

  -- 2. Loop through the list with an index (ordinality)
  FOR poi_record, poi_index IN 
    SELECT elem, ord 
    FROM jsonb_array_elements(p_landmark_list) WITH ORDINALITY AS t(elem, ord)
  LOOP
    -- 3. Create the POI entry
    INSERT INTO poi (itinerary_id, landmark_id)
    VALUES (
      new_itinerary_id, 
      (poi_record->>'landmark_id')::BIGINT
    )
    RETURNING id INTO new_poi_id;

    -- 4. Create the Order entry using poi_index
    INSERT INTO itinerary_poi_order (itinerary_id, poi_id, visit_order)
    VALUES (
      new_itinerary_id,
      new_poi_id,
      poi_index::INTEGER -- This is your current index
    );
  END LOOP;

  RETURN new_itinerary_id;
END;
$$;


ALTER FUNCTION "public"."create_full_itinerary"("p_user_id" "uuid", "p_name" "text", "p_landmark_list" "jsonb") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


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
    "name" character varying DEFAULT ''::character varying NOT NULL,
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



CREATE TABLE IF NOT EXISTS "public"."landmark" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" character varying DEFAULT '255'::character varying NOT NULL,
    "longitude" double precision NOT NULL,
    "latitude" double precision NOT NULL,
    "image_url" character varying,
    "description" character varying DEFAULT ' '::character varying,
    "updated_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "gmaps_rating" real DEFAULT '0'::real NOT NULL,
    "district" "public"."district" NOT NULL,
    "municipality" "public"."municipality" NOT NULL,
    "deleted_at" timestamp with time zone,
    "creation_type" "public"."LandmarkCreationType" DEFAULT 'TOURIST_ATTRACTION'::"public"."LandmarkCreationType" NOT NULL,
    "type" "public"."landmark_type2" DEFAULT 'Landmark'::"public"."landmark_type2" NOT NULL,
    "image_credits" character varying
);


ALTER TABLE "public"."landmark" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."landmark_reviews" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" character varying NOT NULL,
    "content" character varying NOT NULL,
    "user_id" "uuid",
    "landmark_id" bigint
);


ALTER TABLE "public"."landmark_reviews" OWNER TO "postgres";


ALTER TABLE "public"."landmark_reviews" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."landmark_reviews_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."pasalubong_centers" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" character varying DEFAULT '255'::character varying NOT NULL,
    "longitude" double precision NOT NULL,
    "latitude" double precision NOT NULL,
    "image_url" character varying,
    "description" character varying DEFAULT ' '::character varying,
    "updated_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "gmaps_rating" real DEFAULT '0'::real NOT NULL,
    "district" "public"."district" NOT NULL,
    "municipality" "public"."municipality" NOT NULL,
    "deleted_at" timestamp with time zone,
    "image_credits" character varying
);


ALTER TABLE "public"."pasalubong_centers" OWNER TO "postgres";


COMMENT ON TABLE "public"."pasalubong_centers" IS 'This is a duplicate of landmark';



ALTER TABLE "public"."pasalubong_centers" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."pasalubong_centers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."stops" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "visited_at" timestamp with time zone,
    "itinerary_id" bigint NOT NULL,
    "landmark_id" bigint NOT NULL,
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



ALTER TABLE "public"."landmark" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
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
    "full_name" character varying NOT NULL,
    "email" character varying NOT NULL,
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



ALTER TABLE ONLY "public"."distances"
    ADD CONSTRAINT "distances_pkey" PRIMARY KEY ("source", "destination");



ALTER TABLE ONLY "public"."itinerary"
    ADD CONSTRAINT "itinerary_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."landmark_reviews"
    ADD CONSTRAINT "landmark_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pasalubong_centers"
    ADD CONSTRAINT "pasalubong_centers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stops"
    ADD CONSTRAINT "poi_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."landmark"
    ADD CONSTRAINT "point_of_interest_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."distances"
    ADD CONSTRAINT "distances_destination_fkey" FOREIGN KEY ("destination") REFERENCES "public"."landmark"("id");



ALTER TABLE ONLY "public"."distances"
    ADD CONSTRAINT "distances_source_fkey" FOREIGN KEY ("source") REFERENCES "public"."landmark"("id");



ALTER TABLE ONLY "public"."itinerary"
    ADD CONSTRAINT "itinerary_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."landmark_reviews"
    ADD CONSTRAINT "landmark_reviews_landmark_id_fkey" FOREIGN KEY ("landmark_id") REFERENCES "public"."landmark"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."landmark_reviews"
    ADD CONSTRAINT "landmark_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stops"
    ADD CONSTRAINT "poi_itinerary_id_fkey" FOREIGN KEY ("itinerary_id") REFERENCES "public"."itinerary"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stops"
    ADD CONSTRAINT "poi_landmark_id_fkey" FOREIGN KEY ("landmark_id") REFERENCES "public"."landmark"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



CREATE POLICY "Allow admins to update distances" ON "public"."distances" FOR UPDATE USING ((( SELECT "profiles_1"."user_type"
   FROM "public"."profiles" "profiles_1"
  WHERE ("profiles_1"."user_id" = "auth"."uid"())) <> 'Regular'::"public"."user_type"));



CREATE POLICY "Allow insert update delete to admins only" ON "public"."pasalubong_centers" TO "authenticated" USING ((( SELECT "profiles_1"."user_type"
   FROM "public"."profiles" "profiles_1"
  WHERE ("profiles_1"."user_id" = "auth"."uid"())) <> 'Regular'::"public"."user_type")) WITH CHECK (true);



CREATE POLICY "Allow inserts for admins" ON "public"."distances" FOR INSERT WITH CHECK ((( SELECT "profiles_1"."user_type"
   FROM "public"."profiles" "profiles_1"
  WHERE ("profiles_1"."user_id" = "auth"."uid"())) <> 'Regular'::"public"."user_type"));



CREATE POLICY "Allow regular users to insert their own landmarks" ON "public"."landmark" FOR INSERT TO "authenticated" WITH CHECK (("creation_type" = 'PERSONAL'::"public"."LandmarkCreationType"));



CREATE POLICY "Allow update only to admins" ON "public"."landmark" FOR UPDATE TO "authenticated" USING ((( SELECT "profiles_1"."user_type"
   FROM "public"."profiles" "profiles_1"
  WHERE ("profiles_1"."user_id" = "auth"."uid"())) <> 'Regular'::"public"."user_type")) WITH CHECK (true);



CREATE POLICY "Allow users to update their itinerary only" ON "public"."stops" USING ((EXISTS ( SELECT 1
   FROM "public"."itinerary"
  WHERE (("itinerary"."id" = "stops"."itinerary_id") AND ("itinerary"."user_id" = "auth"."uid"())))));



CREATE POLICY "Enable admins to change status" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((( SELECT "profiles_1"."user_type"
   FROM "public"."profiles" "profiles_1"
  WHERE ("profiles_1"."user_id" = "auth"."uid"())) <> 'Regular'::"public"."user_type")) WITH CHECK (true);



CREATE POLICY "Enable delete for users based on user_id" ON "public"."itinerary" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable insert for admins only" ON "public"."landmark" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "profiles_1"."user_type"
   FROM "public"."profiles" "profiles_1"
  WHERE ("profiles_1"."user_id" = "auth"."uid"())) <> 'Regular'::"public"."user_type"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."itinerary" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."stops" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for everyone" ON "public"."profiles" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."distances" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."itinerary" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable read access for all users" ON "public"."landmark" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."pasalubong_centers" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."stops" FOR SELECT USING (true);



CREATE POLICY "Enable update for itinerary owners" ON "public"."itinerary" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."distances" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."itinerary" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."landmark" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."landmark_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pasalubong_centers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stops" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."create_full_itinerary"("p_name" "text", "p_landmark_list" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_full_itinerary"("p_name" "text", "p_landmark_list" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_full_itinerary"("p_name" "text", "p_landmark_list" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_full_itinerary"("p_name" "text", "p_distance" double precision, "p_landmark_list" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_full_itinerary"("p_name" "text", "p_distance" double precision, "p_landmark_list" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_full_itinerary"("p_name" "text", "p_distance" double precision, "p_landmark_list" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_full_itinerary"("p_user_id" "uuid", "p_name" "text", "p_landmark_list" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_full_itinerary"("p_user_id" "uuid", "p_name" "text", "p_landmark_list" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_full_itinerary"("p_user_id" "uuid", "p_name" "text", "p_landmark_list" "jsonb") TO "service_role";


















GRANT ALL ON TABLE "public"."distances" TO "anon";
GRANT ALL ON TABLE "public"."distances" TO "authenticated";
GRANT ALL ON TABLE "public"."distances" TO "service_role";



GRANT ALL ON TABLE "public"."itinerary" TO "anon";
GRANT ALL ON TABLE "public"."itinerary" TO "authenticated";
GRANT ALL ON TABLE "public"."itinerary" TO "service_role";



GRANT ALL ON SEQUENCE "public"."itinerary_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."itinerary_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."itinerary_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."landmark" TO "anon";
GRANT ALL ON TABLE "public"."landmark" TO "authenticated";
GRANT ALL ON TABLE "public"."landmark" TO "service_role";



GRANT ALL ON TABLE "public"."landmark_reviews" TO "anon";
GRANT ALL ON TABLE "public"."landmark_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."landmark_reviews" TO "service_role";



GRANT ALL ON SEQUENCE "public"."landmark_reviews_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."landmark_reviews_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."landmark_reviews_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."pasalubong_centers" TO "anon";
GRANT ALL ON TABLE "public"."pasalubong_centers" TO "authenticated";
GRANT ALL ON TABLE "public"."pasalubong_centers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pasalubong_centers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pasalubong_centers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pasalubong_centers_id_seq" TO "service_role";



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


  create policy "Allow upload only to admins 1geo3fj_0"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT profiles_1.user_type
   FROM public.profiles profiles_1
  WHERE ((profiles_1.user_id = auth.uid()) AND (profiles_1.user_type <> 'Regular'::public.user_type)))));



