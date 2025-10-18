const puppeteer = require('puppeteer');
const fs = require('fs');
(async ()=>{
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox'], protocolTimeout: 120000 });
  const page = await browser.newPage();
  const logs = [];
  const nets = [];

  page.on('console', msg => {
    logs.push({ type: 'console', text: msg.text(), location: msg.location() });
    console.log('PAGE CONSOLE:', msg.type(), msg.text());
  });
  page.on('pageerror', err => {
    logs.push({ type: 'pageerror', error: String(err) });
    console.error('PAGE ERROR:', err);
  });
  page.on('request', req => {
    nets.push({ type: 'request', url: req.url(), method: req.method(), headers: req.headers() });
    // console.log('REQ', req.method(), req.url());
  });
  page.on('response', async res => {
    const url = res.url();
    const status = res.status();
    const headers = res.headers();
    nets.push({ type: 'response', url, status, headers });
    console.log('RES', status, url);
  });

  try{
    await page.goto('http://localhost:3000/inspeccion.html', { waitUntil: 'networkidle2', timeout: 20000 });
    console.log('Loaded inspeccion.html');

    // Evaluate DOM state before navigation
    const before = await page.evaluate(()=>{
      const container = document.getElementById('wizard-container');
      const steps = Array.from(document.querySelectorAll('.wizard-step')).map(s=>({ step: s.dataset.step, classes: s.className }));
      return {
        wizardChildren: container ? container.children.length : 0,
        stepsCount: steps.length,
        activeStep: (document.querySelector('.wizard-step.active')||{}).dataset?.step || null,
        stepIndicator: document.getElementById('step-indicator')?.textContent || ''
      };
    });
    console.log('Before navigation:', before);

    // Navigate to dashboard and back
    await page.goto('http://localhost:3000/dashboard.html', { waitUntil: 'networkidle2' });
    console.log('Navigated to dashboard');
    await page.waitForTimeout(500);
    await page.goBack({ waitUntil: 'networkidle2' });
    console.log('Navigated back to inspeccion');
    await page.waitForTimeout(500);

    // Evaluate DOM state (after back navigation)
    const after = await page.evaluate(()=>{
      const container = document.getElementById('wizard-container');
      const steps = Array.from(document.querySelectorAll('.wizard-step')).map(s=>({ step: s.dataset.step, classes: s.className }));
      return {
        wizardChildren: container ? container.children.length : 0,
        stepsCount: steps.length,
        activeStep: (document.querySelector('.wizard-step.active')||{}).dataset?.step || null,
        stepIndicator: document.getElementById('step-indicator')?.textContent || ''
      };
    });
    console.log('After navigation:', after);

    // Collect final logs
    const out = { logs, nets };
    fs.writeFileSync('scripts/e2e_result.json', JSON.stringify(out, null, 2));
    console.log('Saved scripts/e2e_result.json');
  }catch(err){
    console.error('E2E ERROR', err);
  }finally{
    await browser.close();
  }
})();