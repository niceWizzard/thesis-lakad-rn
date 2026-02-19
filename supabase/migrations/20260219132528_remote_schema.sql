
  create policy "Enable insert for authenticated users only"
  on "public"."landmark_opening_hours"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Enable read access for all users"
  on "public"."landmark_opening_hours"
  as permissive
  for select
  to public
using (true);



