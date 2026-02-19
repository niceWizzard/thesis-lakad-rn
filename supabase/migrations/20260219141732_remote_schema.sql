alter table "public"."landmark_opening_hours" drop constraint "landmark_opening_hours_pkey";

drop index if exists "public"."landmark_opening_hours_pkey";

alter table "public"."landmark_opening_hours" drop column "id";

CREATE UNIQUE INDEX landmark_opening_hours_pkey ON public.landmark_opening_hours USING btree (landmark_id, day_of_week);

alter table "public"."landmark_opening_hours" add constraint "landmark_opening_hours_pkey" PRIMARY KEY using index "landmark_opening_hours_pkey";


  create policy "Allow update"
  on "public"."landmark_opening_hours"
  as permissive
  for update
  to authenticated
using (true);



