const fs = require('fs');
const path = 'src/components/teacher/coupons-page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add products state
if (!content.includes('const [products, setProducts]')) {
  content = content.replace(
    'const [items, setItems] = useState<Coupon[]>([])',
    'const [items, setItems] = useState<Coupon[]>([])\n  const [products, setProducts] = useState<{id: string, title: string, type: string}[]>([])'
  );
}

// Add fetchProducts
if (!content.includes('const fetchProducts =')) {
  content = content.replace(
    '  const fetchItems = useCallback(async () => {',
    '  const fetchProducts = useCallback(async () => {\n    try {\n      const [resC, resT] = await Promise.all([\n        apiFetch(/api/courses?organizationId=),\n        apiFetch(/api/test-series?organizationId=)\n      ])\n      const courses = (await resC.json()).items || []\n      const testSeries = (await resT.json()).items || []\n      setProducts([\n        ...courses.map((c: any) => ({id: c.id, title: c.title, type: \"Course\"})),\n        ...testSeries.map((t: any) => ({id: t.id, title: t.title, type: \"Test Series\"}))\n      ])\n    } catch (e) { console.error(e) }\n  }, [orgCode])\n\n  const fetchItems = useCallback(async () => {'
  );
}

// Call fetchProducts
if (!content.includes('fetchProducts()')) {
  content = content.replace(
    'fetchItems()\n  }, [fetchItems])',
    'fetchItems()\n    fetchProducts()\n  }, [fetchItems, fetchProducts])'
  );
}

fs.writeFileSync(path, content, 'utf8');
