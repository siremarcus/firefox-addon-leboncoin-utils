import { cpSync } from "fs";

// Copy all non-TS assets from src/ to dist/, preserving folder structure.
cpSync("src", "dist", {
  recursive: true,
  filter: src => !src.endsWith(".ts"),
});
