const supabase = require("./src/backend/db");

async function debugDaily() {
  console.log("Fetching active cycle for user 8...");
  const { data: siklus, error: siklusError } = await supabase
    .from("siklus")
    .select("*")
    .eq("user_id", 8)
    .eq("status", "aktif")
    .single();

  if (siklusError || !siklus) {
    console.error("No active cycle found:", siklusError);
    return;
  }
  console.log("Active Cycle ID:", siklus.id);

  console.log("Attempting to insert into 'rekapan_harian'...");

  const payload = {
    user_id: 8,
    id_siklus: siklus.id,
    tanggal: new Date().toISOString().split("T")[0],
    umur_hari: 1,
    mati: 0,
    pakan_harian: 50, // 1 sak
    body_weight: 200, // grams
    obat_harian: "Vitamin C",
  };

  const { data, error } = await supabase
    .from("rekapan_harian")
    .insert(payload)
    .select();

  if (error) {
    console.error("Insert Error:", error);
    console.error("Message:", error.message);
  } else {
    console.log("Insert Success!", data);
  }
}

debugDaily();
