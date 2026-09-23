const { PrismaClient } = require('@prisma/client');
const checkConnection = async (url) => {
  const db = new PrismaClient({ datasources: { db: { url } } });
  try {
    const start = Date.now();
    await db.user.findFirst();
    console.log('SUCCESS:', url, 'in', Date.now() - start, 'ms');
  } catch (e) {
    console.log('FAILED:', url);
    console.error(e.message.split('\n')[0]);
  } finally {
    await db.$disconnect();
  }
};
(async () => {
  await checkConnection('postgresql://postgres:Kumawat%40321@db.sgkukeicwgkbdwnxlvio.supabase.co:5432/postgres');
  await checkConnection('postgresql://postgres.sgkukeicwgkbdwnxlvio:Kumawat%40321@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true');
  await checkConnection('postgresql://postgres.sgkukeicwgkbdwnxlvio:Kumawat%40321@aws-0-ap-south-1.pooler.supabase.com:5432/postgres');
})();
