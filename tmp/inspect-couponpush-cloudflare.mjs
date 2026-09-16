import fs from 'node:fs';
const config = fs.readFileSync(`${process.env.APPDATA}/xdg.config/.wrangler/config/default.toml`, 'utf8');
const token = config.match(/oauth_token\s*=\s*"([^"]+)"/)[1];
const base = 'https://api.cloudflare.com/client/v4';
async function get(path) {
 const r = await fetch(base + path, {headers:{Authorization:`Bearer ${token}`}});
 const j = await r.json();
 if (!j.success) throw new Error(JSON.stringify(j.errors));
 return j.result;
}
const accounts = await get('/accounts');
for (const account of accounts) {
 const scripts = await get(`/accounts/${account.id}/workers/scripts`);
 console.log('workers', account.id, scripts.map(s=>s.id));
 console.log('subdomain', await get(`/accounts/${account.id}/workers/subdomain`));
 const settings = await get(`/accounts/${account.id}/workers/scripts/frontend/settings`);
 console.log('frontend settings', {bindings:settings.bindings?.map(b=>({name:b.name,type:b.type})),assets:settings.assets,compatibility_date:settings.compatibility_date});
 console.log('domains', await get(`/accounts/${account.id}/workers/domains`));
 const pages = await get(`/accounts/${account.id}/pages/projects`);
 console.log('pages', pages.map(p=>({name:p.name,domains:p.domains})));
}
const zones = await get('/zones?name=couponpush.com');
for (const zone of zones) {
 console.log('zone', zone.id, zone.name);
 console.log('routes', await get(`/zones/${zone.id}/workers/routes`));
}
