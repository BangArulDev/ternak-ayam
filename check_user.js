const supabase = require("./src/backend/db");

async function checkUser() {
  console.log("Checking user 'arul'...");
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", "arul")
    .single();

  if (error) {
    console.error("Error finding user:", error.message);
  } else if (data) {
    console.log("User 'arul' found. ID:", data.id);
  } else {
    console.log("User 'arul' NOT found.");
  }

  console.log("Checking table access...");
  const { error: errSiklus } = await supabase
    .from("siklus")
    .select("count")
    .limit(1);
  if (errSiklus) console.error("Siklus table error:", errSiklus.message);
  else console.log("Siklus table OK");
}

checkUser();
