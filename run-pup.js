const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Go to the API directly to see if html2pdf runs
  await page.goto('http://localhost:3000/api/teacher/tests/cmsep5vk7002p9ml0an8lpmn2/pdf-html?solutions=true');
  
  // Wait for postMessage
  const result = await page.evaluate(() => {
    return new Promise((resolve) => {
      window.addEventListener('message', (event) => {
        resolve(event.data);
      });
    });
  });
  
  console.log(result);
  await browser.close();
})();
