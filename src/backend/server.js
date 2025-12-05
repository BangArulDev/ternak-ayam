const Hapi = require("@hapi/hapi");
const Inert = require("@hapi/inert");
const Cookie = require("@hapi/cookie");
const path = require("path");
const routes = require("./routes");

const init = async () => {
  const server = Hapi.server({
    port: 8080,
    host: "localhost",
    routes: {
      files: {
        relativeTo: path.join(__dirname, "../../dist"),
      },
      cors: {
        origin: ["*"],
      },
    },
  });

  await server.register([Inert, Cookie]);

  server.auth.strategy("session", "cookie", {
    cookie: {
      name: "sid",
      password: "password-should-be-32-characters-long", // TODO: Move to env
      isSecure: false, // Set to true in production with HTTPS
      isHttpOnly: true,
      path: "/",
    },
    redirectTo: "/login",
  });

  // Default auth strategy
  // server.auth.default('session');
  // We'll apply auth per route or globally. Let's apply globally but exempt login/static.

  server.route(routes);

  await server.start();
  console.log("Server running on %s", server.info.uri);
};

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});

init();
