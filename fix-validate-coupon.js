const fs = require('fs');
const path = 'student-app/src/app/api/payments/validate-coupon/route.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  'const { code, orgCode } = body',
  'const { code, orgCode, productId } = body'
);

const checkCode = 
    // Check applicable products
    if (coupon.applicableProductIds && coupon.applicableProductIds.length > 0) {
      if (!productId || !coupon.applicableProductIds.includes(productId)) {
        return NextResponse.json({
          valid: false,
          message: 'This coupon is not valid for this product',
        })
      }
    }
;

content = content.replace(
  'return NextResponse.json({\n      valid: true,',
  checkCode + '\n    return NextResponse.json({\n      valid: true,'
);

fs.writeFileSync(path, content, 'utf8');
