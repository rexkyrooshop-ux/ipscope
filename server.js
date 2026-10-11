const express = require("express");
const path = require("path");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
app.disable("x-powered-by");
app.use(express.static(path.join(__dirname, "public")));
app.use("/api/", rateLimit({ windowMs: 60_000, limit: 40, standardHeaders: "draft-7", legacyHeaders: false }));

const timeoutMs = 9000;
async function getJSON(url, headers = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: { Accept: "application/json", ...headers }, signal: controller.signal });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.message || body.error || `HTTP ${res.status}`);
    if (body.error || body.success === false || body.status === "fail") {
      throw new Error(body.message || body.reason || body.error || "Provider menolak permintaan");
    }
    return body;
  } finally {
    clearTimeout(timer);
  }
}
const first = (...values) => values.find(v => v !== undefined && v !== null && v !== "") ?? "Tidak tersedia";
function normalize(name, d) {
  d = d?.data || d || {};
  switch (name) {
    case "IP2Location": return {ip:d.ip,country:d.country_name,countryCode:d.country_code,region:d.region_name,city:d.city_name,org:d.as,asn:d.asn,timezone:d.time_zone,postal:d.zip_code,lat:d.latitude,lon:d.longitude,continent:d.continent};
    case "DB-IP": return {ip:d.ipAddress,country:d.countryName,countryCode:d.countryCode,region:d.stateProv,city:d.city,org:d.organization,asn:d.asn,timezone:d.timeZone,postal:d.zipCode,lat:d.latitude,lon:d.longitude,continent:d.continentCode};
    case "ipapi.co": return {ip:d.ip,country:d.country_name,countryCode:d.country_code,region:d.region,city:d.city,org:d.org,asn:d.asn,timezone:d.timezone,postal:d.postal,lat:d.latitude,lon:d.longitude,continent:d.continent_code};
    case "ipapi.is": return {ip:d.ip,country:d.location?.country,countryCode:d.location?.country_code,region:d.location?.state,city:d.location?.city,org:d.company?.name||d.asn?.org,asn:d.asn?.asn,timezone:d.location?.timezone,postal:d.location?.zip,lat:d.location?.latitude,lon:d.location?.longitude,continent:d.location?.continent};
    case "IPbase": return {ip:d.data?.ip||d.ip,country:d.data?.location?.country?.name||d.location?.country?.name,countryCode:d.data?.location?.country?.alpha2||d.location?.country?.alpha2,region:d.data?.location?.region?.name||d.location?.region?.name,city:d.data?.location?.city?.name||d.location?.city?.name,org:d.data?.connection?.organization||d.connection?.organization,asn:d.data?.connection?.asn||d.connection?.asn,timezone:d.data?.time_zone?.id||d.time_zone?.id,postal:d.data?.location?.zip||d.location?.zip,lat:d.data?.location?.latitude||d.location?.latitude,lon:d.data?.location?.longitude||d.location?.longitude,continent:d.data?.location?.continent?.name||d.location?.continent?.name};
    case "IPdata": return {ip:d.ip,country:d.country_name,countryCode:d.country_code,region:d.region,city:d.city,org:d.asn?.name||d.company?.name,asn:d.asn?.asn,timezone:d.time_zone?.name,postal:d.postal,lat:d.latitude,lon:d.longitude,continent:d.continent_name};
    case "IPGeolocation.io": return {ip:d.ip,country:d.country_name,countryCode:d.country_code2,region:d.state_prov,city:d.city,org:d.organization||d.isp,asn:d.asn,timezone:d.time_zone?.name,postal:d.zipcode,lat:d.latitude,lon:d.longitude,continent:d.continent_name};
    case "IPinfo": return {ip:d.ip,country:d.country,countryCode:d.country,region:d.region,city:d.city,org:d.org,asn:d.org,timezone:d.timezone,postal:d.postal,lat:d.loc?.split(",")[0],lon:d.loc?.split(",")[1],continent:"Tidak tersedia"};
    case "IPlocate": return {ip:d.ip,country:d.country,countryCode:d.country_code,region:d.subdivision,city:d.city,org:d.org||d.isp,asn:d.asn,timezone:d.time_zone,postal:d.postal_code,lat:d.latitude,lon:d.longitude,continent:d.continent};
    case "IPregistry": return {ip:d.ip,country:d.location?.country?.name,countryCode:d.location?.country?.code,region:d.location?.region?.name,city:d.location?.city,org:d.connection?.organization,asn:d.connection?.asn?.number,timezone:d.time_zone?.id,postal:d.location?.postal,lat:d.location?.latitude,lon:d.location?.longitude,continent:d.location?.continent?.name};
    default: return d;
  }
}
function makeProviders(ip) {
  const enc = encodeURIComponent(ip);
  return [
    {name:"IP2Location", key:process.env.IP2LOCATION_API_KEY, run:key=>getJSON(`https://api.ip2location.io/?key=${encodeURIComponent(key)}&ip=${enc}`)},
    {name:"DB-IP", run:()=>getJSON(`https://api.db-ip.com/v2/free/${enc}`)},
    {name:"ipapi.co", run:()=>getJSON(`https://ipapi.co/${enc}/json/`)},
    {name:"ipapi.is", run:()=>getJSON(`https://api.ipapi.is/?q=${enc}`)},
    {name:"IPbase", key:process.env.IPBASE_API_KEY, run:key=>getJSON(`https://api.ipbase.com/v2/info?apikey=${encodeURIComponent(key)}&ip=${enc}`)},
    {name:"IPdata", key:process.env.IPDATA_API_KEY, run:key=>getJSON(`https://api.ipdata.co/${enc}?api-key=${encodeURIComponent(key)}`)},
    {name:"IPGeolocation.io", key:process.env.IPGEOLOCATION_API_KEY, run:key=>getJSON(`https://api.ipgeolocation.io/ipgeo?apiKey=${encodeURIComponent(key)}&ip=${enc}`)},
    {name:"IPinfo", key:process.env.IPINFO_TOKEN, run:key=>getJSON(`https://ipinfo.io/${enc}/json?token=${encodeURIComponent(key)}`)},
    {name:"IPlocate", run:()=>getJSON(`https://iplocate.io/api/lookup/${enc}`)},
    {name:"IPregistry", key:process.env.IPREGISTRY_API_KEY, run:key=>getJSON(`https://api.ipregistry.co/${enc}?key=${encodeURIComponent(key)}`)}
  ];
}
app.get("/api/health", (_req,res) => res.json({ok:true, service:"IPScope API"}));
app.get("/api/lookup", async (req,res) => {
  const ip = String(req.query.ip || "").trim();
  if (!ip || ip.length > 253 || /[\s<>]/.test(ip)) return res.status(400).json({error:"Masukkan alamat IP atau domain yang valid."});
  const providers = makeProviders(ip);
  const pairs = await Promise.all(providers.map(async p => {
    if (p.key !== undefined && !p.key) return [p.name,{error:"API key belum diatur di file .env"}];
    try {
      const raw = await p.run(p.key);
      const data = normalize(p.name, raw);
      if (!data || (!data.ip && !data.country && !data.countryCode && !data.city)) throw new Error("Respons provider tidak memiliki data lokasi yang dikenali.");
      return [p.name,{data}];
    } catch (err) {
      return [p.name,{error:err.name === "AbortError" ? "Waktu permintaan habis" : (err.message || "Provider gagal") }];
    }
  }));
  const result = Object.fromEntries(pairs);
  const successful = Object.values(result).filter(v=>v.data).length;
  res.json({query:ip, successful, total:providers.length, providers:result});
});
app.get("*", (req,res,next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(__dirname,"public","index.html"));
});
app.listen(PORT, "0.0.0.0", () => console.log(`IPScope berjalan di http://localhost:${PORT}`));
