const Coupons = [
  {
    code: "WELCOME10",
    discountType: "percentage",
    discountValue: 10,
    minOrderAmount: 100,
    maxDiscountAmount: 100,
    expiryDate: new Date("2025-12-31"),
    usageLimit: 100,
    isActive: true,
    description: "10% off for first-time users"
  },
  {
    code: "FLAT50",
    discountType: "fixed",
    discountValue: 50,
    minOrderAmount: 200,
    maxDiscountAmount: null,
    expiryDate: new Date("2025-11-30"),
    usageLimit: 50,
    isActive: true,
    description: "Flat ₹50 off on orders above ₹200"
  },
  {
    code: "SUMMER25",
    discountType: "percentage",
    discountValue: 25,
    minOrderAmount: 300,
    maxDiscountAmount: 150,
    expiryDate: new Date("2025-08-31"),
    usageLimit: 200,
    isActive: true,
    description: "25% off summer sale"
  },
  {
    code: "EXTRA100",
    discountType: "fixed",
    discountValue: 100,
    minOrderAmount: 500,
    expiryDate: new Date("2025-09-15"),
    usageLimit: 25,
    isActive: true,
    description: "Extra ₹100 off limited-time deal"
  },
  {
    code: "FLASH20",
    discountType: "percentage",
    discountValue: 20,
    minOrderAmount: 0,
    maxDiscountAmount: 50,
    expiryDate: new Date("2025-07-31"),
    usageLimit: 100,
    isActive: true,
    description: "Flash Sale: 20% off everything"
  },
  {
    code: "DIWALI50",
    discountType: "fixed",
    discountValue: 50,
    minOrderAmount: 300,
    expiryDate: new Date("2025-10-30"),
    usageLimit: 150,
    isActive: true,
    description: "Celebrate Diwali with ₹50 off"
  },
  {
    code: "NEWYEAR20",
    discountType: "percentage",
    discountValue: 20,
    minOrderAmount: 500,
    maxDiscountAmount: 200,
    expiryDate: new Date("2025-12-31"),
    usageLimit: 500,
    isActive: true,
    description: "New Year Special: 20% off"
  },
  {
    code: "STUDENT10",
    discountType: "percentage",
    discountValue: 10,
    minOrderAmount: 50,
    maxDiscountAmount: 30,
    expiryDate: new Date("2025-09-30"),
    usageLimit: 300,
    isActive: true,
    description: "Student Discount"
  },
  {
    code: "FREESHIP",
    discountType: "fixed",
    discountValue: 40,
    minOrderAmount: 100,
    expiryDate: new Date("2025-08-15"),
    usageLimit: 500,
    isActive: true,
    description: "Free shipping equivalent"
  },
  {
    code: "BIGSAVE30",
    discountType: "percentage",
    discountValue: 30,
    minOrderAmount: 1000,
    maxDiscountAmount: 300,
    expiryDate: new Date("2025-09-10"),
    usageLimit: 100,
    isActive: true,
    description: "Big Savings on bulk orders"
  },
  {
    code: "WELCOME5",
    discountType: "fixed",
    discountValue: 5,
    minOrderAmount: 20,
    expiryDate: new Date("2025-12-31"),
    usageLimit: 1000,
    isActive: true,
    description: "Small savings for small orders"
  },
  {
    code: "SUPER20",
    discountType: "percentage",
    discountValue: 20,
    minOrderAmount: 200,
    maxDiscountAmount: 100,
    expiryDate: new Date("2025-08-25"),
    usageLimit: 250,
    isActive: true,
    description: "Super 20% off"
  },
  {
    code: "MONSOON15",
    discountType: "percentage",
    discountValue: 15,
    minOrderAmount: 150,
    maxDiscountAmount: 75,
    expiryDate: new Date("2025-09-15"),
    usageLimit: 150,
    isActive: true,
    description: "Monsoon Sale: 15% Off"
  },
  {
    code: "EOFY40",
    discountType: "fixed",
    discountValue: 40,
    minOrderAmount: 250,
    expiryDate: new Date("2025-07-31"),
    usageLimit: 80,
    isActive: true,
    description: "End of Financial Year Discount"
  },
  {
    code: "HOLIDAY10",
    discountType: "percentage",
    discountValue: 10,
    minOrderAmount: 100,
    maxDiscountAmount: 50,
    expiryDate: new Date("2025-12-24"),
    usageLimit: 120,
    isActive: true,
    description: "Holiday Season Discount"
  },
  {
    code: "TRYME50",
    discountType: "fixed",
    discountValue: 50,
    minOrderAmount: 500,
    expiryDate: new Date("2025-08-01"),
    usageLimit: 50,
    isActive: false,
    description: "Inactive test coupon"
  },
  {
    code: "APPONLY20",
    discountType: "percentage",
    discountValue: 20,
    minOrderAmount: 150,
    maxDiscountAmount: 60,
    expiryDate: new Date("2025-10-10"),
    usageLimit: 400,
    isActive: true,
    description: "App exclusive discount"
  },
  {
    code: "SAVE90",
    discountType: "fixed",
    discountValue: 90,
    minOrderAmount: 900,
    expiryDate: new Date("2025-12-01"),
    usageLimit: 90,
    isActive: true,
    description: "Big spenders save big"
  },
  {
    code: "NIGHTOWL",
    discountType: "percentage",
    discountValue: 12,
    minOrderAmount: 100,
    maxDiscountAmount: 40,
    expiryDate: new Date("2025-08-31"),
    usageLimit: 300,
    isActive: true,
    description: "Late night exclusive discount"
  },
  {
    code: "BULKBUY",
    discountType: "percentage",
    discountValue: 18,
    minOrderAmount: 1500,
    maxDiscountAmount: 350,
    expiryDate: new Date("2025-11-15"),
    usageLimit: 100,
    isActive: true,
    description: "Save more on bulk purchases"
  }
];

export default Coupons;