import { makeGrant } from '../server/ats-access.mjs';
const hours = Number(process.argv[2] || 24);
if (!Number.isInteger(hours) || hours < 1 || hours > 168) throw new Error('Use an expiry between 1 and 168 hours.');
console.log(makeGrant(process.env.ATS_ACCESS_SECRET, hours * 3600));
