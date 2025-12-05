const supabase = require("./src/backend/db");

async function checkDb() {
  console.log("Checking Supabase connection...");

  // Check 'users' table
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("count")
    .limit(1);

  if (usersError) {
    console.error("Error accessing 'users' table:", usersError.message);
  } else {
    console.log("'users' table access: OK");
  }

  // Check 'siklus' table
  const { data: siklus, error: siklusError } = await supabase
    .from("siklus")
    .select("count")
    .limit(1);

  if (siklusError) {
    console.error("Error accessing 'siklus' table:", siklusError.message);
  } else {
    console.log("'siklus' table access: OK");
  }

  // Check 'rekapan_harian' table
  const { data: rekapan, error: rekapanError } = await supabase
    .from("rekapan_harian")
    .select("count")
    .limit(1);

  if (rekapanError) {
    console.error(
      "Error accessing 'rekapan_harian' table:",
      rekapanError.message
    );
  } else {
    console.log("'rekapan_harian' table access: OK");
  }
}

checkDb();
