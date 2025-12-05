const supabase = require("./src/backend/db");

async function checkColumn(colName) {
  const { error } = await supabase.from("siklus").select(colName).limit(1);
  if (error) {
    console.log(`Column '${colName}': MISSING`);
  } else {
    console.log(`Column '${colName}': OK`);
  }
}

async function checkSchema() {
  console.log("Checking other columns...");
  await checkColumn("stok_pakan_awal");
  await checkColumn("populasi_awal");
  await checkColumn("nama_kandang");
  await checkColumn("status");
  await checkColumn("user_id");
}

checkSchema();
