const fs = require('fs');
const file = 'src/lib/store.ts';
let content = fs.readFileSync(file, 'utf8');

// Add types
content = content.replace(
  'closeCheckout: () => void',
  "closeCheckout: () => void\n  checkoutIntent: { id: string; type: 'test_series' | 'course' | 'digital_product'; title: string; price: number; mrp: number; thumbnail: string | null } | null;\n  setCheckoutIntent: (item: { id: string; type: 'test_series' | 'course' | 'digital_product'; title: string; price: number; mrp: number; thumbnail: string | null } | null) => void"
);

// Add initial state
content = content.replace(
  'checkoutItem: null,',
  'checkoutItem: null,\n    checkoutIntent: null,'
);

// Add implementation
content = content.replace(
  'closeCheckout: () => set({ checkoutOpen: false, checkoutItem: null }),',
  'closeCheckout: () => set({ checkoutOpen: false, checkoutItem: null }),\n    setCheckoutIntent: (item) => set({ checkoutIntent: item }),'
);

fs.writeFileSync(file, content);
