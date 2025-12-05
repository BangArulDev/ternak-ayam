const supabase = require("./src/backend/db");

async function checkColumn(colName) {
  const { error } = await supabase.from("siklus").select(colName).limit(1);
  if (error) {
    console.log(`Column '${colName}': MISSING or Error (${error.message})`);
  } else {
    console.log(`Column '${colName}': OK`);
  }
}

async function checkSchema() {
  console.log("Checking columns in 'siklus' table...");
  await checkColumn("user_id");
  await checkColumn("nama_kandang");
  await checkColumn("status");
  await checkColumn("populasi_awal");
  await checkColumn("stok_pakan_awal");
  await checkColumn("tgl_mulai");
  await checkColumn("id");
}

checkSchema();
