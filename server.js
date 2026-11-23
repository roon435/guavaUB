import express from "express";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { existsSync } from "node:fs";
import wisp from "wisp-server-node";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const app = express();

// only these files are public
app.get(["/", "/browser.html"], (req, res) => res.sendFile(join(__dirname, "browser.html")));
app.get("/sw.js", (req, res) => res.sendFile(join(__dirname, "sw.js")));

// optional pretty link: yourdomain.com/taburl=Gmail  ->  /?taburl=Gmail
app.get("/taburl=:name", (req, res) => res.redirect("/?taburl=" + encodeURIComponent(req.params.name)));

const mw = (pkg) => join(__dirname, "node_modules", "@mercuryworkshop", pkg, "dist");
const mounts = {
  "/scram": mw("scramjet"),
  "/baremux": mw("bare-mux"),
  "/epoxy": mw("epoxy-transport"),
  "/libcurl": mw("libcurl-transport"),
};
for (const [route, dir] of Object.entries(mounts)) {
  console.log(existsSync(dir) ? "found  " : "MISSING", route, "->", dir);
  app.use(route, express.static(dir));
}

const server = createServer(app);

server.on("upgrade", (req, socket, head) => {
  if (req.url && req.url.startsWith("/wisp/")) wisp.routeRequest(req, socket, head);
  else socket.end();
});

const port = process.env.PORT || 4545;
server.listen(port, () => console.log(`guavaub running on http://localhost:${port}`));