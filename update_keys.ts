import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const updatedOrg = await prisma.organization.updateMany({
    data: {
      razorpayKeyId: 'rzp_test_TIwPoKSC0buIZV',
      razorpayKeySecret: 'cR4jQTXuvIE2LpG0vAq3Pyr1'
    }
  })

  console.log('Updated organizations with Razorpay keys:', updatedOrg.count)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
