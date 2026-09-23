const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    console.log('Querying DigitalProduct...');
    const product = await prisma.digitalProduct.findFirst();
    if (!product) {
      console.log('No digital products found.');
    } else {
      console.log('Found product:', product.id);
    }
    
    console.log('Does purchasedDigitalProduct exist on PrismaClient?', !!prisma.purchasedDigitalProduct);
    
    if (prisma.purchasedDigitalProduct) {
      console.log('Querying PurchasedDigitalProduct...');
      const purchase = await prisma.purchasedDigitalProduct.findFirst();
      console.log('Found purchase:', purchase?.id || 'none');
    }
    
    console.log('All db queries successful!');
  } catch (e) {
    console.error('DB ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
