const paths = ['/', '/stores/', '/store/amazon/', '/store/amazon/index.txt', '/store/amazon/__next._full.txt'];
const refs = new Set();
for (const path of paths) {
 const response = await fetch('https://couponpush.com' + path);
 const body = await response.text();
 const scripts = [...body.matchAll(/\/_next\/static\/chunks\/[a-zA-Z0-9_.-]+\.js/g)].map(m=>m[0]);
 scripts.forEach(s=>refs.add(s));
 console.log(path, response.status, [...new Set(scripts)]);
}
await Promise.all([...refs].map(async path => {
 const response = await fetch('https://couponpush.com'+path);
 if(response.status !== 200 || !response.headers.get('content-type')?.includes('javascript')) console.log('BAD',path,response.status,response.headers.get('content-type'));
}));
console.log('Checked chunks',refs.size);
