import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.AUDIT_BASE_URL || 'http://localhost:3100';
const sitemap=await (await fetch(`${base}/sitemap.xml`)).text();
const paths=[...new Set([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>new URL(m[1]).pathname))];
if(paths.length===0) throw new Error('Sitemap contains no routes');
const results=[];
for(let i=0;i<paths.length;i+=3){
 const batch=await Promise.all(paths.slice(i,i+3).map(async path=>{
  const start=Date.now();
  try {
   const res=await fetch(base+path,{signal:AbortSignal.timeout(30000)});const html=await res.text();
   const title=html.match(/<title>(.*?)<\/title>/s)?.[1];
   const h1=(html.match(/<h1[\s>]/g)||[]).length;
   const canonical=html.match(/<link rel="canonical" href="([^"]+)"/s)?.[1];
   return {path,status:res.status,ms:Date.now()-start,title,h1,canonical};
  }catch(error){return {path,error:String(error)}}
 }));results.push(...batch);
}
for(const [path,expected] of [['/api/health',200],['/admin',307],['/account/bookings',307],['/api/admin/bookings/export',401],['/tours/audit-nonexistent-tour',404]]){
 const res=await fetch(base+path,{redirect:'manual'});const html=await res.text();
 const streamedNotFound=expected===404 && res.status===200 && /name="robots" content="noindex"/.test(html);
 results.push({path,status:res.status,expected:streamedNotFound?200:expected,...(streamedNotFound?{note:'Next.js streamed not-found with noindex'}:{})});
}
await mkdir('outputs/audit',{recursive:true});
await writeFile('outputs/audit/http-routes.json',JSON.stringify({date:new Date().toISOString(),base,results},null,2));
const failures=results.filter(r=>r.error || r.status!==(r.expected??200) || (r.h1!==undefined && r.h1!==1));
console.log(JSON.stringify({checked:results.length,failures},null,2));
if(failures.length)process.exitCode=1;
