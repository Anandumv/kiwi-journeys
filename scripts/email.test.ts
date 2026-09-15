import test from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/lib/db';
import { POST as contact } from '../src/app/api/contact/route';
import { POST as privateTour } from '../src/app/api/contact/private-tour/route';
import { POST as login } from '../src/app/api/account/login/route';
process.env.RESEND_API_KEY='';
(prisma.siteSetting.findUnique as any)=async()=>null;
(prisma.magicToken.create as any)=async()=>({});
const request=(body:object)=>new Request('http://localhost/api/test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
test('contact form cannot claim delivery when email is unavailable',async()=>{
 assert.equal((await contact(request({name:'Test',email:'test@example.invalid',message:'Test'}))).status,503);
});
test('private enquiry cannot claim delivery when email is unavailable',async()=>{
 assert.equal((await privateTour(request({fullName:'Test',email:'test@example.invalid',groupSize:2,tours:['Test']}))).status,503);
});
test('login cannot claim a sign-in email was sent when email is unavailable',async()=>{
 assert.equal((await login(request({email:'test@example.invalid'}))).status,503);
});
