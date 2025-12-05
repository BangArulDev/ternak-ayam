-- OPSI 1: Izinkan SEMUA akses (Insert, Select, Update, Delete)
-- Gunakan ini jika Anda ingin development lancar tanpa pusing permission.
CREATE POLICY "Enable all access for everyone"
ON "public"."users"
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- OPSI 2: Hanya izinkan INSERT (Tambah User) dan SELECT (Login)
-- Gunakan ini jika ingin lebih spesifik.
/*
CREATE POLICY "Enable insert for everyone"
ON "public"."users"
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Enable select for everyone"
ON "public"."users"
FOR SELECT
TO public
USING (true);
*/
