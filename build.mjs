import { cp, mkdir, rm } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
await cp("index.html", "dist/index.html");
await cp("styles.css", "dist/styles.css");
await cp("script.js", "dist/script.js");
await cp("assets", "dist/assets", { recursive: true });
await cp("whale-tank", "dist/whale-tank", { recursive: true });
await cp("alexis-soubran-tif-cmo", "dist/alexis-soubran-tif-cmo", { recursive: true });
await cp("alexis-soubran-TIF-CMO", "dist/alexis-soubran-TIF-CMO", { recursive: true });
