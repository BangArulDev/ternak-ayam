const supabase = require("./db");
const bcrypt = require("bcrypt");
const Joi = require("joi");

// Helper function for performance calculation
function hitungPerforma(pop_awal, tot_mati, tot_pakan, bw, umur) {
  const hidup = pop_awal - tot_mati;
  const total_daging = hidup * bw;

  // FCR = Pakan / Daging
  const fcr = total_daging > 0 ? tot_pakan / total_daging : 0;

  // IP = (Daya Hidup % * BW * 100) / (FCR * Umur)
  let ip = 0;
  if (fcr > 0 && umur > 0) {
    const daya_hidup_persen = (hidup / pop_awal) * 100;
    ip = (daya_hidup_persen * bw * 100) / (fcr * umur);
  }

  return {
    hidup: hidup,
    fcr: fcr.toFixed(3),
    ip: ip.toFixed(0),
  };
}

module.exports = [
  // Static Files
  {
    method: "GET",
    path: "/{param*}",
    handler: {
      directory: {
        path: ".",
        redirectToSlash: true,
        index: true,
      },
    },
    options: { auth: false },
  },
  {
    method: "GET",
    path: "/",
    handler: (request, h) => {
      if (request.auth.isAuthenticated) {
        return h.file("index.html");
      }
      return h.redirect("/login");
    },
    options: { auth: { mode: "try", strategy: "session" } },
  },
  {
    method: "GET",
    path: "/login",
    handler: (request, h) => {
      if (request.auth.isAuthenticated) {
        return h.redirect("/");
      }
      return h.file("login.html");
    },
    options: { auth: { mode: "try", strategy: "session" } },
  },

  // API: Login
  {
    method: "POST",
    path: "/api/login",
    options: {
      auth: false,
      validate: {
        payload: Joi.object({
          username: Joi.string().required(),
          password: Joi.string().required(),
        }),
      },
    },
    handler: async (request, h) => {
      const { username, password } = request.payload;

      try {
        const { data: user, error } = await supabase
          .from("users")
          .select("*")
          .eq("username", username)
          .single();

        if (error || !user) {
          return h
            .response({ error: "Username atau Password salah." })
            .code(401);
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
          return h
            .response({ error: "Username atau Password salah." })
            .code(401);
        }

        if (user.status !== "aktif") {
          return h
            .response({ error: "Akun tidak aktif. Hubungi Admin." })
            .code(403);
        }

        request.cookieAuth.set({
          id: user.id,
          username: user.username,
          role: user.role,
          nama: user.nama_lengkap,
        });
        return { success: true };
      } catch (err) {
        console.error(err);
        return h.response({ error: "Internal Server Error" }).code(500);
      }
    },
  },

  // API: Logout
  {
    method: "POST",
    path: "/api/logout",
    options: { auth: "session" },
    handler: (request, h) => {
      request.cookieAuth.clear();
      return { success: true };
    },
  },

  // API: Get Current User
  {
    method: "GET",
    path: "/api/me",
    options: { auth: "session" },
    handler: (request, h) => {
      return request.auth.credentials;
    },
  },

  // API: Dashboard Data
  {
    method: "GET",
    path: "/api/dashboard",
    options: { auth: "session" },
    handler: async (request, h) => {
      const userId = request.auth.credentials.id;

      try {
        // Get Active Cycle
        const { data: siklus, error: siklusError } = await supabase
          .from("siklus")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "aktif")
          .order("id", { ascending: false })
          .limit(1)
          .single();

        if (siklusError || !siklus) {
          return { active: false };
        }

        // Get Stats (Aggregates need manual calculation or RPC in Supabase, but for now we'll fetch data and aggregate in JS if dataset is small, OR use .select with count/sum if available via PostgREST, but standard JS client doesn't support aggregate functions directly easily without RPC.
        // However, for migration speed, we can fetch relevant records. But 'rekapan_harian' might be large.
        // Better approach: Use RPC calls if created, but since I can't create RPC easily here without SQL access, I will fetch data.
        // WAIT: Supabase JS client doesn't do SUM/MAX easily.
        // Alternative: Fetch all records for this cycle. It's likely not huge for a single cycle (e.g. 30-60 days).

        const { data: rekapan, error: rekapanError } = await supabase
          .from("rekapan_harian")
          .select("mati, pakan_harian, body_weight, umur_hari")
          .eq("user_id", userId)
          .eq("id_siklus", siklus.id);

        let tot_mati = 0;
        let tot_pakan = 0;
        let last_umur = 0;
        let last_bw = 0;

        // Correction: last_bw should be MAX(body_weight) or body_weight of max umur?
        // PHP: MAX(body_weight). Let's stick to that.
        if (rekapan) {
          rekapan.forEach((r) => {
            tot_mati += r.mati || 0;
            tot_pakan += r.pakan_harian || 0; // Sudah dalam KG
            if (r.umur_hari > last_umur) {
              last_umur = r.umur_hari;
              last_bw = r.body_weight; // Assuming last record has the latest BW
            }
          });
          // Correction: last_bw should be MAX(body_weight) or body_weight of max umur?
          // PHP: MAX(body_weight). Let's stick to that.
          if (rekapan.length > 0) {
            last_bw = Math.max(...rekapan.map((r) => r.body_weight));
          }
        }

        // Restock
        const { data: restockData } = await supabase
          .from("stok_masuk")
          .select("jumlah")
          .eq("user_id", userId)
          .eq("id_siklus", siklus.id)
          .eq("jenis", "pakan");

        const tot_masuk = restockData
          ? restockData.reduce((sum, item) => sum + item.jumlah, 0)
          : 0;

        // Sales
        const { data: salesData } = await supabase
          .from("penjualan")
          .select("total_bayar, ekor_total, kg_total")
          .eq("user_id", userId)
          .eq("id_siklus", siklus.id);

        const sales = {
          omzet: 0,
          ekor: 0,
          kg: 0,
        };

        if (salesData) {
          salesData.forEach((s) => {
            sales.omzet += s.total_bayar || 0;
            sales.ekor += s.ekor_total || 0;
            sales.kg += s.kg_total || 0;
          });
        }

        const total_stok_tersedia = siklus.stok_pakan_awal + tot_masuk;
        const sisa_pakan = total_stok_tersedia - tot_pakan;

        // Calculation Logic
        const populasi_kandang = siklus.populasi_awal - tot_mati - sales.ekor;
        const biomassa_kandang = populasi_kandang * last_bw;
        const biomassa_total = biomassa_kandang + sales.kg;

        const fcr = biomassa_total > 0 ? tot_pakan / biomassa_total : 0;

        let ip = 0;
        if (fcr > 0 && last_umur > 0) {
          const daya_hidup =
            ((siklus.populasi_awal - tot_mati) / siklus.populasi_awal) * 100;
          ip = (daya_hidup * last_bw * 100) / (fcr * last_umur);
        }

        // Get History (Last 5)
        const { data: histRows } = await supabase
          .from("rekapan_harian")
          .select("*")
          .eq("user_id", userId)
          .eq("id_siklus", siklus.id)
          .order("tanggal", { ascending: false })
          .limit(5);

        return {
          active: true,
          siklus: siklus,
          stat: {
            umur: last_umur,
            hidup: populasi_kandang,
            fcr: fcr.toFixed(3),
            ip: ip.toFixed(0),
            bw_last: last_bw,
            sisa_pakan: sisa_pakan,
            sisa_sak: (sisa_pakan / 50).toFixed(1),
          },
          sales: sales,
          history: histRows || [],
        };
      } catch (err) {
        console.error(err);
        return h.response({ error: "Internal Server Error" }).code(500);
      }
    },
  },

  // API: Input Harian
  {
    method: "POST",
    path: "/api/daily-input",
    options: { auth: "session" },
    handler: async (request, h) => {
      const userId = request.auth.credentials.id;
      const { tanggal, mati, pakan, bw, obat } = request.payload;

      try {
        const { data: siklus } = await supabase
          .from("siklus")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "aktif")
          .order("id", { ascending: false })
          .limit(1)
          .single();

        if (!siklus) return h.response({ error: "No active cycle" }).code(400);

        // Calculate Umur
        // Get max umur
        const { data: maxUmurData } = await supabase
          .from("rekapan_harian")
          .select("umur_hari")
          .eq("id_siklus", siklus.id)
          .order("umur_hari", { ascending: false })
          .limit(1);

        const maxUmur =
          maxUmurData && maxUmurData.length > 0 ? maxUmurData[0].umur_hari : 0;
        const umur = maxUmur + 1;

        // Hitung pakan dalam kg (1 sak = 50kg)
        // Schema: pakan_harian DECIMAL(10,2) -> Aman untuk simpan KG (misal 100.00)
        const pakanKg = pakan * 50;

        // Convert BW gram ke KG
        // Schema: body_weight DECIMAL(5,3) -> Harus simpan KG (misal 0.200), tidak bisa Gram (200)
        const bwKg = bw / 1000;

        const { error } = await supabase.from("rekapan_harian").insert({
          user_id: userId,
          id_siklus: siklus.id,
          tanggal: tanggal,
          umur_hari: umur,
          mati: mati,
          pakan_harian: pakanKg, // Simpan KG
          body_weight: bwKg, // Simpan KG
          obat_harian: obat,
        });

        if (error) throw error;

        return { success: true };
      } catch (err) {
        console.error(err);
        return h.response({ error: "Internal Server Error" }).code(500);
      }
    },
  },

  // API: Start Cycle
  {
    method: "POST",
    path: "/api/cycle/start",
    options: { auth: "session" },
    handler: async (request, h) => {
      const userId = request.auth.credentials.id;
      const { kandang, tgl_mulai, populasi, stok_pakan, satuan_pakan } =
        request.payload;

      try {
        const stokPakanKg =
          satuan_pakan === "sak" ? stok_pakan * 50 : stok_pakan;

        const { error } = await supabase.from("siklus").insert({
          user_id: userId,
          nama_kandang: kandang,
          status: "aktif",
          populasi_awal: populasi,
          stok_pakan_awal: stokPakanKg,
          tanggal_mulai: tgl_mulai,
        });

        if (error) throw error;

        return { success: true };
      } catch (err) {
        console.error(err);
        return h.response({ error: "Internal Server Error" }).code(500);
      }
    },
  },

  // API: Add Stock
  {
    method: "POST",
    path: "/api/stock",
    options: { auth: "session" },
    handler: async (request, h) => {
      const userId = request.auth.credentials.id;
      const { tanggal, jenis, nama_item, unit, jumlah } = request.payload;

      try {
        const { data: siklus } = await supabase
          .from("siklus")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "aktif")
          .order("id", { ascending: false })
          .limit(1)
          .single();

        if (!siklus) return h.response({ error: "No active cycle" }).code(400);

        const jumlahFinal = unit === "sak" ? jumlah * 50 : jumlah;

        const { error } = await supabase.from("stok_masuk").insert({
          user_id: userId,
          id_siklus: siklus.id,
          jenis: jenis,
          jumlah: jumlahFinal,
          nama_item: nama_item,
          tanggal: tanggal,
        });

        if (error) throw error;

        return { success: true };
      } catch (err) {
        console.error(err);
        return h.response({ error: "Internal Server Error" }).code(500);
      }
    },
  },

  // API: Record Sales (Jual)
  {
    method: "POST",
    path: "/api/sales",
    options: { auth: "session" },
    handler: async (request, h) => {
      const userId = request.auth.credentials.id;
      const { tanggal, pembeli, ekor, berat, harga_kg } = request.payload;

      try {
        const { data: siklus } = await supabase
          .from("siklus")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "aktif")
          .order("id", { ascending: false })
          .limit(1)
          .single();

        if (!siklus) return h.response({ error: "No active cycle" }).code(400);

        const totalBayar = berat * harga_kg;

        const { error } = await supabase.from("penjualan").insert({
          user_id: userId,
          id_siklus: siklus.id,
          tanggal: tanggal,
          nama_pembeli: pembeli,
          ekor_total: ekor,
          kg_total: berat,
          harga_per_kg: harga_kg,
          total_bayar: totalBayar,
        });

        if (error) throw error;

        return { success: true };
      } catch (err) {
        console.error(err);
        return h.response({ error: "Internal Server Error" }).code(500);
      }
    },
  },

  // API: Close Cycle (Tutup Siklus)
  {
    method: "POST",
    path: "/api/cycle/close",
    options: { auth: "session" },
    handler: async (request, h) => {
      const userId = request.auth.credentials.id;
      const { tgl_selesai, catatan } = request.payload;

      try {
        const { data: siklus } = await supabase
          .from("siklus")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "aktif")
          .order("id", { ascending: false })
          .limit(1)
          .single();

        if (!siklus) return h.response({ error: "No active cycle" }).code(400);

        const { error } = await supabase
          .from("siklus")
          .update({
            status: "selesai",
            tgl_selesai: tgl_selesai,
            catatan: catatan,
          })
          .eq("id", siklus.id);

        if (error) throw error;

        return { success: true };
      } catch (err) {
        console.error(err);
        return h.response({ error: "Internal Server Error" }).code(500);
      }
    },
  },

  // API: Full History
  {
    method: "GET",
    path: "/api/history",
    options: { auth: "session" },
    handler: async (request, h) => {
      const userId = request.auth.credentials.id;

      try {
        const { data: siklus } = await supabase
          .from("siklus")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "aktif")
          .order("id", { ascending: false })
          .limit(1)
          .single();

        if (!siklus) return [];

        const { data: history } = await supabase
          .from("rekapan_harian")
          .select("*")
          .eq("user_id", userId)
          .eq("id_siklus", siklus.id)
          .order("tanggal", { ascending: false });

        return history || [];
      } catch (err) {
        console.error(err);
        return h.response({ error: "Internal Server Error" }).code(500);
      }
    },
  },
];
