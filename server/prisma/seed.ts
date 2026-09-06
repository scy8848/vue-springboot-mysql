import { PrismaClient, ProductStatus, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('Admin123!', 12)
  await prisma.user.upsert({
    where: { email: 'admin@mori.test' },
    update: {},
    create: { email: 'admin@mori.test', passwordHash, nickname: '森集管理员', role: Role.ADMIN },
  })

  const home = await prisma.category.upsert({ where: { slug: 'home-living' }, update: {}, create: { name: '家居生活', slug: 'home-living', icon: 'House', sort: 10 } })
  const outdoors = await prisma.category.upsert({ where: { slug: 'outdoors' }, update: {}, create: { name: '户外出行', slug: 'outdoors', icon: 'Sunny', sort: 20 } })
  const kitchen = await prisma.category.upsert({ where: { slug: 'kitchen' }, update: { parentId: home.id }, create: { name: '餐厨器具', slug: 'kitchen', parentId: home.id, sort: 10 } })
  const storage = await prisma.category.upsert({ where: { slug: 'storage' }, update: { parentId: home.id }, create: { name: '桌面收纳', slug: 'storage', parentId: home.id, sort: 20 } })
  const camping = await prisma.category.upsert({ where: { slug: 'camping' }, update: { parentId: outdoors.id }, create: { name: '露营装备', slug: 'camping', parentId: outdoors.id, sort: 10 } })

  const products = [
    { sku: 'MORI-COFFEE-01', categoryId: kitchen.id, name: '白釉手冲咖啡套组', subtitle: '一壶一杯，留住咖啡最温柔的香气', description: '温润白釉与克制线条构成的手冲套组。壶嘴经过反复调整，水流稳定，适合日常手冲与周末分享。器具可使用洗碗机清洁。', cover: '/images/products/coffee-set.png', price: 268, originalPrice: 328, stock: 86, salesCount: 1240, specs: [{ name: '经典白', code: 'WHITE' }, { name: '雾灰', code: 'GREY' }] },
    { sku: 'MORI-LAMP-01', categoryId: camping.id, name: '暮野便携露营灯', subtitle: '三档暖光，陪你从黄昏坐到星空', description: '轻量铝合金灯体，三档暖光无级调节。满电续航最长 24 小时，支持 Type-C 充电，适合露营、阳台与床头使用。', cover: '/images/products/camping-lamp.png', price: 199, originalPrice: 239, stock: 53, salesCount: 876, specs: [{ name: '森林绿', code: 'GREEN' }, { name: '岩石灰', code: 'STONE' }] },
    { sku: 'MORI-TRAY-01', categoryId: storage.id, name: '原木桌面收纳托盘', subtitle: '让零碎物件，各自回到舒服的位置', description: '精选北美白蜡木，手工打磨圆润边角。分区适合收纳钥匙、腕表、首饰和随身小物，天然木纹让每一只托盘都略有不同。', cover: '/images/products/wood-tray.png', price: 159, originalPrice: null, stock: 120, salesCount: 642, specs: [{ name: '原木色', code: 'NATURAL' }, { name: '胡桃色', code: 'WALNUT' }] },
  ]

  for (const item of products) {
    const existing = await prisma.productSku.findFirst({ where: { skuCode: { startsWith: item.sku } } })
    if (existing) continue
    await prisma.product.create({
      data: {
        categoryId: item.categoryId, name: item.name, subtitle: item.subtitle, description: item.description,
        cover: item.cover, price: item.price, originalPrice: item.originalPrice, stock: item.stock, salesCount: item.salesCount, status: ProductStatus.ACTIVE,
        images: { create: [{ url: item.cover, alt: item.name, sort: 0 }] },
        skus: { create: item.specs.map((spec, index) => ({ skuCode: `${item.sku}-${spec.code}`, name: spec.name, specs: { 款式: spec.name }, price: item.price + index * 20, stock: Math.floor(item.stock / 2) })) },
      },
    })
  }
  console.log('Seeded admin@mori.test / Admin123!')
}

main().finally(() => prisma.$disconnect())
