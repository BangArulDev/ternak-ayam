const supabase = require("./src/backend/db");
const bcrypt = require("bcrypt");

async function createUser() {
  const username = "arul";
  const password = "123";
  const saltRounds = 10;

  try {
    console.log(`Hashing password for user '${username}'...`);
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    console.log("Inserting user into Supabase...");
    const { data, error } = await supabase.from("users").insert([
      {
        username: username,
        password: hashedPassword,
        nama_lengkap: "Arul",
        role: "admin",
        status: "aktif",
      },
    ]);

    if (error) {
      console.error("Error creating user:", error.message);
    } else {
      console.log("User 'arul' created successfully!");
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

createUser();
