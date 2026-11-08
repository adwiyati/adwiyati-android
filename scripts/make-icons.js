// Draws the launcher icons and splash screens from www/icon.svg with rsvg-convert,
// replacing Capacitor's default artwork. No npm image packages needed.
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const RES = "android/app/src/main/res";
const BG = "#14504f";
const icon = fs.readFileSync("www/icon.svg", "utf8").replace(/<\?xml[^>]*>/, "");
const tmp = "icon-tmp.svg";

function render(w, h, svg, out) {
  fs.writeFileSync(tmp, svg);
  execFileSync("rsvg-convert", ["-w", String(w), "-h", String(h), tmp, "-o", out]);
}
// the icon alone, filling the square
const square = s => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 512 512">${icon.replace(/<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "")}</svg>`;
// the icon centred on the brand colour, for any canvas size
const centred = (w, h, frac) => {
  const s = Math.round(Math.min(w, h) * frac), x = Math.round((w - s) / 2), y = Math.round((h - s) / 2);
  const inner = icon.replace(/<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="${BG}"/><svg x="${x}" y="${y}" width="${s}" height="${s}" viewBox="0 0 512 512">${inner}</svg></svg>`;
};

const sizes = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
for (const [d, s] of Object.entries(sizes)) {
  const dir = path.join(RES, "mipmap-" + d); fs.mkdirSync(dir, { recursive: true });
  for (const n of ["ic_launcher.png", "ic_launcher_round.png"]) render(s, s, square(s), path.join(dir, n));
  // adaptive-icon foreground: 108dp canvas, icon inside the 66dp safe zone
  const f = Math.round(s * 108 / 48);
  render(f, f, centred(f, f, 0.62).replace(`<rect width="100%" height="100%" fill="${BG}"/>`, ""), path.join(dir, "ic_launcher_foreground.png"));
}
// adaptive-icon background colour
const values = path.join(RES, "values"); fs.mkdirSync(values, { recursive: true });
fs.writeFileSync(path.join(values, "ic_launcher_background.xml"),
  `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${BG}</color>\n</resources>\n`);

// every splash.png the template ships, redrawn at its own size
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name === "splash.png") {
      const b = fs.readFileSync(p); const w = b.readUInt32BE(16), h = b.readUInt32BE(20);
      render(w, h, centred(w, h, 0.35), p);
    }
  }
})(RES);
fs.unlinkSync(tmp);
console.log("icons and splash drawn");
