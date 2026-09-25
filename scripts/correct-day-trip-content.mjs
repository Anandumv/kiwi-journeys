// Explicit local content correction; never a seed or a production migration.
import { createRequire } from 'node:module';
import { writeFile, mkdir } from 'node:fs/promises';
const require=createRequire(import.meta.url);require('@next/env').loadEnvConfig(process.cwd());
const url=new URL(process.env.DATABASE_URL);
if(!['localhost','127.0.0.1'].includes(url.hostname)) throw Error('Local content correction only');
const {PrismaClient}=require('@prisma/client');const db=new PrismaClient();
try {
 const keys=['adult-darksky','child-darksky','adult-observatory','child-observatory'];
 const where={tour:{slug:'lake-tekapo-alpine-adventure'},key:{in:keys}};
 const prices=await db.priceOption.findMany({where});
 const settings=await db.siteSetting.findUnique({where:{id:'singleton'}});
 console.log(JSON.stringify({overnightOptions:prices.map(p=>p.key),apply:process.argv.includes('--apply')}));
 if(!process.argv.includes('--apply')) process.exitCode=0;
 else {
  await mkdir('outputs/audit/2026-09-25',{recursive:true});
  await writeFile(`outputs/audit/2026-09-25/day-trip-content-before-${Date.now()}.json`,JSON.stringify({prices,settings},null,2));
  await db.$transaction(async tx=>{
   const tour=await tx.tour.findUnique({where:{slug:'lake-tekapo-alpine-adventure'}});
   if(tour) {
    // Existing purchases and current holds must not be altered by this correction.
    if(await tx.bookingItem.count({where:{priceOptionId:{in:prices.map(p=>p.id)}}}))throw Error('Historical bookings reference these options; manual reconciliation required');
    if(await tx.reservation.count({where:{session:{tourId:tour.id},status:'HELD',expiresAt:{gt:new Date()}}}))throw Error('Active holds exist; retry after they resolve');
    await tx.priceOption.deleteMany({where});
   }
   if(settings) await tx.siteSetting.update({where:{id:'singleton'},data:{
    tagline:settings.tagline==='New Zealand Adventure Tours & Packages'?'South Island Day Tours':settings.tagline,
    footerTagline:settings.footerTagline==='New Zealand adventure tours and packages, crafted around how you want to travel.'?'Small-group and private day trips, returning the same day.':settings.footerTagline,
    valueProps:Array.isArray(settings.valueProps)?settings.valueProps.map(v=>v.title==='Multi-day journeys'?{title:'Day trips from Christchurch',body:'Explore the South Island and return the same day, with driving and timing handled for you.'}:v):settings.valueProps,
   }});
  });
 }
} finally {await db.$disconnect();}
