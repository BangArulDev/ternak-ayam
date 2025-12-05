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
  console.log("Checking alternative columns...");
  await checkColumn("tanggal_mulai");
  await checkColumn("tanggal");
  await checkColumn("tgl_masuk");
  await checkColumn("start_date");
}

checkSchema();
