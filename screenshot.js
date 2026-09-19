import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Set to standard 1080p for presentation
  await page.setViewport({ width: 1920, height: 1080 });

  console.log('Capturing Citizen Home...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'citizen_home.png' });

  console.log('Capturing Collaboration Hub...');
  await page.goto('http://localhost:5173/collaboration', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'collaboration.png' });

  console.log('Capturing My Reports...');
  await page.goto('http://localhost:5173/my-reports', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'my_reports.png' });

  console.log('Capturing GIS Dashboard...');
  await page.goto('http://localhost:5173/admin/map', { waitUntil: 'networkidle0' });
  // Wait a bit extra for the map tiles to load
  await new Promise(resolve => setTimeout(resolve, 3000));
  await page.screenshot({ path: 'gis_dashboard.png' });

  await browser.close();
  console.log('Screenshots captured successfully.');
})();
