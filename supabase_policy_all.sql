-- Izinkan akses untuk SEMUA tabel (users, siklus, rekapan_harian, stok_masuk, penjualan)
-- Copy-paste semua kode ini ke SQL Editor Supabase dan jalankan.

CREATE POLICY "Enable all access for users" ON "public"."users" FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for siklus" ON "public"."siklus" FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for rekapan_harian" ON "public"."rekapan_harian" FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for stok_masuk" ON "public"."stok_masuk" FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for penjualan" ON "public"."penjualan" FOR ALL TO public USING (true) WITH CHECK (true);
