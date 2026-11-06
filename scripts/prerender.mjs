// Writes crawler-readable static HTML for content routes after `vite build`.
// Each file is the normal SPA shell with route-specific <title>, description
// and the page's text inside #root; React replaces it on load. Vercel/Netlify
// serve these files before the SPA rewrite, so ad reviewers and search engines
// see real content without executing JavaScript.
import fs from "node:fs";
import path from "node:path";

const DIST = path.resolve(process.cwd(), "dist");
const site = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "src/content/site.json"), "utf8"));
const shell = fs.readFileSync(path.join(DIST, "index.html"), "utf8");
const SITE_URL = (process.env.VITE_SITE_URL || "").replace(/\/$/, "");

if (!shell.includes("<!--ssg-start-->") || !shell.includes("<!--ssg-end-->")) {
  console.error("FAIL: dist/index.html is missing the <!--ssg-start--> / <!--ssg-end--> markers.");
  process.exit(1);
}

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const NAV =
  '<nav><a href="/">Home</a> · <a href="/discover">Discover</a> · <a href="/calendar">Release calendar</a> · <a href="/guides">Guides</a> · <a href="/about">About</a> · <a href="/faq">FAQ</a> · <a href="/contact">Contact</a> · <a href="/privacy-policy">Privacy policy</a> · <a href="/terms-of-service">Terms</a></nav>';
const wrap = (inner) =>
  `<main style="max-width:48rem;margin:0 auto;padding:3rem 1rem;font-family:system-ui,sans-serif;color:#f5f5f5;background:#0a0a0f;line-height:1.7">${inner}${NAV}</main>`;
const sections = (list) =>
  list.map((s) => `<section><h2>${esc(s.heading)}</h2>${s.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}</section>`).join("");

const routes = [
  {
    path: "/about",
    title: site.about.title,
    description: site.about.description,
    body: `<h1>${esc(site.about.title)}</h1><p>${esc(site.about.description)}</p>${sections(site.about.sections)}`,
  },
  {
    path: "/privacy-policy",
    title: site.privacy.title,
    description: site.privacy.description,
    body: `<h1>${esc(site.privacy.title)}</h1><p>Last updated ${esc(site.privacy.updated)}</p>${sections(site.privacy.sections)}`,
  },
  {
    path: "/faq",
    title: site.faq.title,
    description: site.faq.description,
    body: `<h1>${esc(site.faq.title)}</h1>${site.faq.items.map((i) => `<h2>${esc(i.q)}</h2><p>${esc(i.a)}</p>`).join("")}`,
  },
  {
    path: "/guides",
    title: "Guides",
    description: "Practical guides to choosing what to watch: moods, genres, hidden gems, streaming filters and better watchlists.",
    body: `<h1>Watch smarter: WatchWise guides</h1><ul>${site.guides
      .map((g) => `<li><a href="/guides/${g.slug}">${esc(g.title)}</a> — ${esc(g.description)}</li>`)
      .join("")}</ul>`,
  },
  ...site.guides.map((g) => ({
    path: `/guides/${g.slug}`,
    title: g.title,
    description: g.description,
    body: `<article><h1>${esc(g.title)}</h1><p>${esc(g.description)}</p>${sections(g.sections)}</article>`,
  })),
  {
    path: "/contact",
    title: "Contact",
    description: "Contact the WatchWise team about your account, privacy requests, incorrect information or partnerships.",
    body: "<h1>Contact WatchWise</h1><p>Questions, feedback, privacy requests and bug reports are welcome. Bugs can be reported on GitHub at github.com/eyadismail133/WatchWise-frontend/issues. For wrong title details, edit the entry on The Movie Database (themoviedb.org); changes appear on WatchWise automatically.</p>",
  },
  {
    path: "/calendar",
    title: "Release calendar",
    description: "See which movies open in theaters near you and which TV shows air new episodes this week.",
    body: "<h1>Release calendar</h1><p>Browse theatrical movie releases for your country and TV shows with new episodes, week by week, with trailers, ratings and where to watch.</p>",
  },
  {
    path: "/discover",
    title: "Discover movies & TV",
    description: "Filter movies and TV shows by genre, decade, rating, runtime, language and streaming service, or ask the WatchWise AI for one perfect pick.",
    body: "<h1>Discover movies and TV shows</h1><p>Ask the WatchWise AI for one recommendation that fits your mood, or filter the catalog by genre, decade, minimum rating, runtime, original language and the streaming services available in your country.</p>",
  },
];

const fullTitle = (t) => `${t} · WatchWise`;
let written = 0;
for (const r of routes) {
  let html = shell
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(fullTitle(r.title))}</title>`)
    .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${esc(r.description)}$2`)
    .replace(/(<meta\s+property="og:title"\s+content=")[^"]*(")/, `$1${esc(fullTitle(r.title))}$2`)
    .replace(/(<meta\s+property="og:description"\s+content=")[^"]*(")/, `$1${esc(r.description)}$2`)
    .replace(/<!--ssg-start-->[\s\S]*?<!--ssg-end-->/, `<!--ssg-start-->${wrap(r.body)}<!--ssg-end-->`);
  if (SITE_URL) {
    html = html.replace("</head>", `  <link rel="canonical" href="${SITE_URL}${r.path}" />\n  </head>`);
  }
  // "/about" -> dist/about.html. Vercel (cleanUrls), Netlify and vite preview
  // all serve it at the extension-less URL before falling back to the SPA.
  const out = path.join(DIST, `${r.path.replace(/^\//, "")}.html`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  written++;
}

if (SITE_URL) {
  const urls = ["/", ...routes.map((r) => r.path)];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${SITE_URL}${u}</loc></url>`)
    .join("\n")}\n</urlset>\n`;
  fs.writeFileSync(path.join(DIST, "sitemap.xml"), sitemap);
  fs.appendFileSync(path.join(DIST, "robots.txt"), `Sitemap: ${SITE_URL}/sitemap.xml\n`);
  console.log(`Prerendered ${written} routes and sitemap.xml for ${SITE_URL}`);
} else {
  console.log(`Prerendered ${written} routes (set VITE_SITE_URL to also emit sitemap.xml and canonical links)`);
}
