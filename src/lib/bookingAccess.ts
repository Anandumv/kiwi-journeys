import { SignJWT, jwtVerify } from 'jose';
export const BOOKING_VIEW_COOKIE = 'kj_booking_view';
function key() {
 if (!process.env.AUTH_SECRET) throw new Error('AUTH_SECRET is not set');
 return new TextEncoder().encode(process.env.AUTH_SECRET);
}
export async function signBookingAccess(reference:string) {
 return new SignJWT({}).setProtectedHeader({alg:'HS256'}).setAudience('kiwi-booking-view').setSubject(reference).setIssuedAt().setExpirationTime('24h').sign(key());
}
export async function verifyBookingAccess(token:string,reference:string) {
 try { const {payload}=await jwtVerify(token,key(),{algorithms:['HS256'],audience:'kiwi-booking-view'});return payload.sub===reference; } catch {return false;}
}
export const bookingCookieOptions = {httpOnly:true,sameSite:'lax' as const,secure:process.env.NODE_ENV==='production',path:'/booking',maxAge:86400};
