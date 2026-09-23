const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    const org = await prisma.organization.findFirst()
    console.log('Org:', org?.id)
    
    console.log('Fetching allCourses...')
    const allCourses = await prisma.course.findMany({
      where: {
        organizationId: org?.id,
        status: 'published',
      },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        category: true,
        price: true,
        mrp: true,
        status: true,
        featured: true,
        level: true,
        language: true,
      },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    })
    console.log('allCourses count:', allCourses.length)
    
    console.log('Fetching purchasedCourses...')
    const purchasedCourses = await prisma.purchasedCourse.findMany({
      where: { studentId: 'admin-bypass' },
      select: {
        id: true,
        purchasedAt: true,
        expiresAt: true,
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnail: true,
            category: true,
            status: true,
            price: true,
            mrp: true,
            level: true,
            language: true,
            modules: {
              select: {
                id: true,
                lessons: {
                  select: { id: true, videoDuration: true },
                },
              },
            },
          },
        },
      },
      orderBy: { purchasedAt: 'desc' },
    })
    console.log('purchasedCourses count:', purchasedCourses.length)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
