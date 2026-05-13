import { chromium } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

/**
 * Sanitizes a string to be used as a filename.
 */
function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Queries "publicaciones procesales" for a given juzgado and looks for "Estado" links.
 * 
 * @param juzgadoName - The name or part of the name of the juzgado to search for.
 * @param headless - Whether to run the browser in headless mode.
 */
export async function queryPublicaciones(juzgadoName: string, headless = false) {
  console.log(`Starting query for juzgado: "${juzgadoName}"`);
  
  const browser = await chromium.launch({ 
    headless: headless
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Navigate to the publicaciones procesales page
    await page.goto('https://publicacionesprocesales.ramajudicial.gov.co/');
    
    // Wait for the select2 element to be available
    await page.waitForSelector('.col-md-6 > .select2 > .selection > .select2-selection > .select2-selection__arrow', { state: 'visible' });

    // 2. Click the dropdown arrow to reveal the searchbox
    await page.locator('.col-md-6 > .select2 > .selection > .select2-selection > .select2-selection__arrow').click();
    
    const searchbox = page.getByRole('searchbox', { name: 'Search' });
    await searchbox.fill(juzgadoName);
    
    // 3. Wait for the options to appear and select the first one that matches
    const option = page.getByRole('option', { name: new RegExp(juzgadoName, 'i') }).first();
    
    try {
      await option.waitFor({ state: 'visible', timeout: 5000 });
      await option.click();
    } catch (e) {
      console.warn(`Could not find a specific option for "${juzgadoName}". Trying to click the first available option.`);
      await page.getByRole('option').first().click();
    }

    // 4. Click the "Buscar" button
    await page.getByRole('button', { name: 'Buscar' }).click();

    // Wait for the results to load
    await page.waitForLoadState('networkidle');
    
    // 5. Look for links containing the word "Estado"
    const estadoRegex = /estado/i;
    const links = page.locator('a', { hasText: estadoRegex });
    
    // Give it a moment to ensure all elements are rendered
    await page.waitForTimeout(2000);
    
    const count = await links.count();
    console.log(`Found ${count} links matching the "Estado" criteria.`);

    const foundLinks = [];
    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      const text = await link.innerText();
      const href = await link.getAttribute('href');
      
      const linkData = {
        text: text.trim(),
        href: href,
        timestamp: new Date().toISOString()
      };
      
      foundLinks.push(linkData);
      console.log(`[${i + 1}] ${linkData.text} -> ${linkData.href}`);
    }

    return foundLinks;

  } catch (error) {
    console.error('An error occurred during the Playwright execution:', error);
    throw error;
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
}

// Execution block for running the script directly
if (process.argv[1].includes('publicaciones-query')) {
  const targetJuzgado = process.argv[2] || 'Juzgado 003 civil municipal de chia';
  queryPublicaciones(targetJuzgado, true) // Default to headless for CLI unless changed
    .then(async (results) => {
      const filename = `${sanitizeFilename(targetJuzgado)}.json`;
      const filePath = path.join(process.cwd(), 'src', 'assets', filename);
      
      await fs.writeFile(filePath, JSON.stringify(results, null, 2));
      
      console.log(` Successfully retrieved ${results.length} links and saved to ${filePath}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Execution failed:', err);
      process.exit(1);
    });
}
