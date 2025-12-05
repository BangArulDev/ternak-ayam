const supabase = require("./src/backend/db");

async function debugCycle() {
  console.log("Attempting to insert into 'siklus'...");

  // Data dummy matching the form
  const userId = 8; // ID for 'arul'
  const payload = {
    user_id: userId,
    nama_kandang: "Kandang Debug",
    status: "aktif",
    populasi_awal: 1000,
    stok_pakan_awal: 500, // kg
    tgl_mulai: new Date().toISOString().split("T")[0],
  };

  const { data, error } = await supabase
    .from("siklus")
    .insert(payload)
    .select();

  if (error) {
    console.error("Insert Error:", error);
    console.error("Message:", error.message);
    console.error("Details:", error.details);
    console.error("Hint:", error.hint);
  } else {
    console.log("Insert Success!", data);
  }
}

debugCycle();
