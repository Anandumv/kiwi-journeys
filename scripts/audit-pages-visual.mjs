import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require=createRequire(`${process.env.AUDIT_TOOLS||'/tmp/kiwi-audit-tools'}/package.json`);
const { chromium }=require('playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
const out=process.env.AUDIT_OUT||'outputs/audit/2026-09-25/pages';await mkdir(out,{recursive:true});
const routes=['about','contact','cruise-excursions','destinations','faq','gift-vouchers','private-tours','sustainability','tours','travel-insights','privacy-policy','terms-of-use','destinations/christchurch','tours/akaroa-day-tour','tours/akaroa-day-tour/book','account/login','booking/lookup'];
const results=[];
try{for(const width of [390,1440]){const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});for(const path of routes){const response=await page.goto('http://localhost:3101/'+path,{waitUntil:'networkidle'});await page.screenshot({path:`${out}/${path.replaceAll("/","-")}-${width}.png`,fullPage:true});results.push({path,width,status:response.status(),title:await page.title(),h1:await page.locator('h1').allTextContents(),horizontalOverflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});}await page.close();}}finally{await browser.close();await writeFile(`${out}/pages.json`,JSON.stringify(results,null,2));}console.log(results.filter(x=>x.status!==200||x.h1.length!==1||x.horizontalOverflow));
