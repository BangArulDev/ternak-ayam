const supabase = require("./src/backend/db");

async function checkColumn(colName) {
  const { error } = await supabase
    .from("rekapan_harian")
    .select(colName)
    .limit(1);
  if (error) {
    console.log(`Column '${colName}': MISSING`);
  } else {
    console.log(`Column '${colName}': OK`);
  }
}

async function checkSchema() {
  console.log("Checking columns in 'rekapan_harian' table...");
  await checkColumn("tanggal");
  await checkColumn("umur_hari");
  await checkColumn("mati");
  await checkColumn("pakan_harian");
  await checkColumn("body_weight");
  await checkColumn("obat_harian");
  await checkColumn("id_siklus");
  await checkColumn("user_id");

  // Check alternatives
  await checkColumn("pakan");
  await checkColumn("bw");
  await checkColumn("obat");
  await checkColumn("umur");
}

checkSchema();
