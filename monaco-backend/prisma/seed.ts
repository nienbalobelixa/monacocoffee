import dotenv from 'dotenv'
dotenv.config({ path: './.env', override: true })

// Supabase: seed phải dùng Direct URL (không qua pooler) để tránh lỗi "prepared statement already exists"
if (process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL
}

import { PrismaClient, Role, TableStatus, OrderStatus, PaymentMethod, PaymentStatus, OrderType, PromotionType, ReservationStatus } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Monaco Coffee database...')

  // Clean up existing data
  await prisma.inventoryLog.deleteMany()
  await prisma.inventory.deleteMany()
  await prisma.review.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.order.deleteMany()
  await prisma.promotionProduct.deleteMany()
  await prisma.promotion.deleteMany()
  await prisma.reservation.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.table.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.employee.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.user.deleteMany()

  // ============================================================
  // USERS
  // ============================================================
  const adminPassword = await bcrypt.hash('admin123', 12)
  const staffPassword = await bcrypt.hash('staff123', 12)
  const customerPassword = await bcrypt.hash('customer123', 12)

  const admin = await prisma.user.create({
    data: {
      email: 'admin@monaco.vn',
      password: adminPassword,
      fullName: 'Admin Monaco',
      phone: '0901234567',
      role: Role.ADMIN,
    },
  })

  const manager = await prisma.user.create({
    data: {
      email: 'manager@monaco.vn',
      password: staffPassword,
      fullName: 'Nguyễn Thị Manager',
      phone: '0901234568',
      role: Role.MANAGER,
      employee: {
        create: {
          employeeCode: 'EMP-001',
          department: 'Quản lý',
          position: 'Quản lý cửa hàng',
          salary: 15000000,
        },
      },
    },
  })

  const staff1 = await prisma.user.create({
    data: {
      email: 'staff1@monaco.vn',
      password: staffPassword,
      fullName: 'Trần Văn Nhân Viên',
      phone: '0901234569',
      role: Role.STAFF,
      employee: {
        create: {
          employeeCode: 'EMP-002',
          department: 'Phục vụ',
          position: 'Barista',
          salary: 8000000,
        },
      },
    },
  })

  const customer1 = await prisma.user.create({
    data: {
      email: 'customer1@monaco.vn',
      password: customerPassword,
      fullName: 'Lê Thị Khách Hàng',
      phone: '0901234570',
      role: Role.CUSTOMER,
      customer: { create: { loyaltyPoints: 150, totalSpent: 500000 } },
    },
  })

  const customer2 = await prisma.user.create({
    data: {
      email: 'customer2@monaco.vn',
      password: customerPassword,
      fullName: 'Phạm Văn Bình',
      phone: '0901234571',
      role: Role.CUSTOMER,
      customer: { create: { loyaltyPoints: 50 } },
    },
  })

  console.log('✅ Users created')

  // ============================================================
  // TABLES
  // ============================================================
  // Generate 30 tables for POS
  const tableData = Array.from({ length: 30 }).map((_, i) => {
    const num = i + 1
    // distribute locations by rough groups
    let location = 'Tầng 1'
    if (num > 10 && num <= 18) location = 'Tầng 2'
    if (num > 18 && num <= 24) location = 'Sân vườn'
    if (num > 24) location = 'Phòng VIP'
    // set capacity patterns
    let capacity = 4
    if (num % 5 === 0) capacity = 2
    if (num % 7 === 0) capacity = 8
    if (num > 24) capacity = 10
    return { name: `Bàn ${String(num).padStart(2, '0')}`, number: num, capacity, location }
  })

  const tables = await Promise.all(tableData.map((t) => prisma.table.create({ data: t })))
  console.log('✅ Tables created')

  // ============================================================
  // CATEGORIES
  // ============================================================
  const categoryData = [
    { name: 'Cà Phê', slug: 'ca-phe', description: 'Các loại cà phê đặc trưng', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', sortOrder: 1 },
    { name: 'Trà', slug: 'tra', description: 'Trà thượng hạng', image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400', sortOrder: 2 },
    { name: 'Bánh Ngọt', slug: 'banh-ngot', description: 'Bánh ngọt tươi mỗi ngày', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400', sortOrder: 3 },
    { name: 'Nước Ép', slug: 'nuoc-ep', description: 'Nước ép trái cây tươi', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400', sortOrder: 4 },
    { name: 'Đặc Biệt', slug: 'dac-biet', description: 'Đồ uống đặc biệt của Monaco', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400', sortOrder: 5 },
  ]

  const categories = await Promise.all(
    categoryData.map((c) => prisma.category.create({ data: c }))
  )
  const [caPhe, tra, banhNgot, nuocEp, dacBiet] = categories
  console.log('✅ Categories created')

  // ============================================================
  // PRODUCTS
  // ============================================================
  const productData = [
    // Cà phê
    { name: 'Espresso', slug: 'espresso', description: 'Cà phê espresso đậm đà, hương thơm nồng nàn', price: 45000, image: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=600', categoryId: caPhe.id, isFeatured: true },
    { name: 'Cappuccino', slug: 'cappuccino', description: 'Cappuccino truyền thống Ý với lớp foam mịn', price: 65000, image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600', categoryId: caPhe.id, isFeatured: true },
    { name: 'Latte', slug: 'latte', description: 'Cà phê sữa mịn, hương thơm nhẹ nhàng', price: 65000, image: 'https://images.unsplash.com/photo-1561882468-9110d70d2a78?w=600', categoryId: caPhe.id, isFeatured: true },
    { name: 'Cold Brew', slug: 'cold-brew', description: 'Cà phê ủ lạnh 24 giờ, vị đậm không đắng', price: 75000, salePrice: 65000, image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600', categoryId: caPhe.id, isFeatured: true },
    { name: 'Americano', slug: 'americano', description: 'Espresso pha loãng với nước nóng', price: 55000, image: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=600', categoryId: caPhe.id },
    { name: 'Caramel Macchiato', slug: 'caramel-macchiato', description: 'Espresso với caramel và sữa tươi', price: 75000, salePrice: 65000, image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600', categoryId: caPhe.id, isFeatured: true },
    { name: 'Mocha', slug: 'mocha', description: 'Cà phê chocolate ngọt ngào', price: 70000, image: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=600', categoryId: caPhe.id },
    { name: 'Flat White', slug: 'flat-white', description: 'Double espresso với microfoam mịn', price: 70000, image: 'https://images.unsplash.com/photo-1558160074-4d7d8bdf4256?w=600', categoryId: caPhe.id },

    // Trà
    { name: 'Trà Đào Cam Sả', slug: 'tra-dao-cam-sa', description: 'Trà đào thơm, kết hợp cam và sả tươi mát', price: 55000, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600', categoryId: tra.id, isFeatured: true },
    { name: 'Trà Matcha Latte', slug: 'tra-matcha-latte', description: 'Matcha Nhật Bản với sữa tươi béo', price: 65000, salePrice: 55000, image: 'https://images.unsplash.com/photo-1540908489236-15aac66d9a53?w=600', categoryId: tra.id, isFeatured: true },
    { name: 'Trà Sữa Trân Châu', slug: 'tra-sua-tran-chau', description: 'Bubble tea với trân châu đen dẻo', price: 60000, image: 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=600', categoryId: tra.id },
    { name: 'Hibiscus Tea', slug: 'hibiscus-tea', description: 'Trà hoa cẩm quỳ đỏ tươi, vị chua nhẹ', price: 50000, image: 'https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?w=600', categoryId: tra.id },

    // Bánh ngọt
    { name: 'Croissant Bơ', slug: 'croissant-bo', description: 'Croissant bơ giòn tan từ lò nướng mỗi sáng', price: 45000, image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600', categoryId: banhNgot.id },
    { name: 'Tiramisu', slug: 'tiramisu', description: 'Tiramisu Ý mịn màng, hương cà phê đậm đà', price: 75000, salePrice: 65000, image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600', categoryId: banhNgot.id, isFeatured: true },
    { name: 'Cheesecake Dâu', slug: 'cheesecake-dau', description: 'Cheesecake với topping dâu tây tươi', price: 70000, image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600', categoryId: banhNgot.id },
    { name: 'Bánh Mochi', slug: 'banh-mochi', description: 'Mochi Nhật Bản nhiều vị', price: 35000, image: 'https://images.unsplash.com/photo-1603532648955-039310d9ed75?w=600', categoryId: banhNgot.id },

    // Nước ép
    { name: 'Nước Ép Cam Tươi', slug: 'nuoc-ep-cam-tuoi', description: 'Cam tươi ép nguyên chất, ngọt tự nhiên', price: 55000, image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600', categoryId: nuocEp.id },
    { name: 'Sinh Tố Bơ', slug: 'sinh-to-bo', description: 'Bơ sáp pha sữa tươi, béo ngậy', price: 65000, image: 'https://images.unsplash.com/photo-1638176066959-7ee2f0e9f2d3?w=600', categoryId: nuocEp.id, isFeatured: true },
    { name: 'Smoothie Xoài', slug: 'smoothie-xoai', description: 'Xoài chín pha sữa chua Hy Lạp', price: 60000, salePrice: 50000, image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600', categoryId: nuocEp.id },

    // Đặc biệt
    { name: 'Monaco Signature', slug: 'monaco-signature', description: 'Công thức độc quyền Monaco - espresso, caramel, coconut milk', price: 95000, image: 'https://images.unsplash.com/photo-1446776709462-d6b525c57bd3?w=600', categoryId: dacBiet.id, isFeatured: true },
    { name: 'Charcoal Latte', slug: 'charcoal-latte', description: 'Latte than hoạt tính độc đáo', price: 85000, salePrice: 75000, image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600', categoryId: dacBiet.id, isFeatured: true },
  ]

  const products = await Promise.all(
    productData.map((p) => prisma.product.create({ data: p }))
  )
  console.log('✅ Products created')

  // ============================================================
  // PROMOTIONS
  // ============================================================
  const promo1 = await prisma.promotion.create({
    data: {
      name: 'Giảm 10% Toàn Bộ Đơn Hàng',
      code: 'MONACO10',
      description: 'Giảm 10% cho đơn hàng từ 100,000đ',
      type: PromotionType.PERCENTAGE,
      value: 10,
      minOrderAmount: 100000,
      maxDiscount: 50000,
      usageLimit: 100,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-12-31'),
      isActive: true,
    },
  })

  const promo2 = await prisma.promotion.create({
    data: {
      name: 'Giảm 30,000đ Đơn Đầu Tiên',
      code: 'WELCOME30K',
      description: 'Ưu đãi dành cho khách hàng mới',
      type: PromotionType.FIXED_AMOUNT,
      value: 30000,
      minOrderAmount: 80000,
      usageLimit: 200,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-12-31'),
      isActive: true,
    },
  })
  console.log('✅ Promotions created')

  // ============================================================
  // SAMPLE ORDERS
  // ============================================================
  const order1 = await prisma.order.create({
    data: {
      orderNumber: `MC-${Date.now()}-001`,
      status: OrderStatus.COMPLETED,
      type: OrderType.DINE_IN,
      userId: customer1.id,
      tableId: tables[0].id,
      subtotal: 130000,
      discount: 0,
      total: 130000,
      items: {
        create: [
          { productId: products[0].id, quantity: 1, unitPrice: 45000, subtotal: 45000 },
          { productId: products[1].id, quantity: 1, unitPrice: 65000, subtotal: 65000 },
          { productId: products[12].id, quantity: 1, unitPrice: 45000, subtotal: 45000, note: 'ít đường' },
        ],
      },
    },
  })

  await prisma.payment.create({
    data: {
      orderId: order1.id,
      method: PaymentMethod.CASH,
      status: PaymentStatus.PAID,
      amount: 130000,
      paidAt: new Date(),
    },
  })

  const order2 = await prisma.order.create({
    data: {
      orderNumber: `MC-${Date.now()}-002`,
      status: OrderStatus.PREPARING,
      type: OrderType.ONLINE,
      userId: customer2.id,
      subtotal: 195000,
      discount: 19500,
      total: 175500,
      promotionId: promo1.id,
      items: {
        create: [
          { productId: products[19].id, quantity: 1, unitPrice: 95000, subtotal: 95000 },
          { productId: products[13].id, quantity: 1, unitPrice: 75000, subtotal: 75000 },
          { productId: products[17].id, quantity: 1, unitPrice: 65000, subtotal: 65000 },
        ],
      },
    },
  })
  console.log('✅ Sample orders created')

  // ============================================================
  // REVIEWS
  // ============================================================
  await prisma.review.createMany({
    data: [
      { userId: customer1.id, productId: products[0].id, rating: 5, comment: 'Espresso tuyệt vời! Hương vị đậm đà, chuẩn vị Ý.', isVerified: true },
      { userId: customer2.id, productId: products[1].id, rating: 5, comment: 'Cappuccino ngon nhất Hà Nội! Foam mịn như nhung.', isVerified: true },
      { userId: customer1.id, productId: products[19].id, rating: 5, comment: 'Monaco Signature là trải nghiệm không thể quên!', isVerified: true },
    ],
  })
  console.log('✅ Reviews created')

  // ============================================================
  // RESERVATIONS
  // ============================================================
  await prisma.reservation.create({
    data: {
      userId: customer1.id,
      tableId: tables[9].id,
      guestName: 'Lê Thị Khách Hàng',
      guestPhone: '0901234570',
      guestCount: 4,
      date: new Date(Date.now() + 86400000),
      startTime: new Date(Date.now() + 86400000 + 3600000 * 19),
      status: ReservationStatus.CONFIRMED,
      note: 'Kỷ niệm sinh nhật, cần trang trí bánh',
    },
  })
  console.log('✅ Reservations created')

  // ============================================================
  // INVENTORY
  // ============================================================
  await prisma.inventory.createMany({
    data: [
      { productId: products[0].id, name: 'Hạt cà phê Arabica', unit: 'kg', quantity: 50, minQuantity: 10, costPrice: 200000 },
      { productId: products[0].id, name: 'Hạt cà phê Robusta', unit: 'kg', quantity: 30, minQuantity: 5, costPrice: 150000 },
      { productId: products[2].id, name: 'Sữa tươi', unit: 'lít', quantity: 20, minQuantity: 5, costPrice: 35000 },
      { productId: products[9].id, name: 'Bột matcha Nhật', unit: 'kg', quantity: 5, minQuantity: 1, costPrice: 800000 },
      { productId: products[12].id, name: 'Bột bánh mì', unit: 'kg', quantity: 15, minQuantity: 3, costPrice: 45000 },
      { productId: products[13].id, name: 'Mascarpone cheese', unit: 'kg', quantity: 3, minQuantity: 1, costPrice: 350000 },
    ],
  })
  console.log('✅ Inventory created')

  console.log('\n🎉 Seeding completed!\n')
  console.log('📋 Test Accounts:')
  console.log('  Admin:    admin@monaco.vn    / admin123')
  console.log('  Manager:  manager@monaco.vn  / staff123')
  console.log('  Staff:    staff1@monaco.vn   / staff123')
  console.log('  Customer: customer1@monaco.vn / customer123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
