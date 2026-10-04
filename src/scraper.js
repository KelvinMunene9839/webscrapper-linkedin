const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { buildSearchUrl, sleep } = require('./utils');

puppeteer.use(StealthPlugin());

/**
 * Main scraper function supporting single or multiple locations.
 */
async function scrapeLinkedInJobs(config) {
  // Parse locations if comma-separated
  const locations = (config.location || 'Rwanda, Remote')
    .split(',')
    .map((l) => l.trim())
    .filter(Boolean);

  console.log(`\n[i] Scrape Locations: ${locations.join(' | ')}`);
  console.log(`[i] Max Jobs to scrape: ${config.maxJobs}`);
  console.log(`[i] Extracting Full Descriptions: ${config.extractFullDescription ? 'YES' : 'NO'}`);

  const fs = require('fs');
  const vanillaPuppeteer = require('puppeteer');
  let execPath;

  try {
    const pPath = await vanillaPuppeteer.executablePath();
    if (fs.existsSync(pPath)) {
      execPath = pPath;
    }
  } catch (e) {
    // fallback
  }

  if (!execPath) {
    const systemChrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const systemChrome86 = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
    const systemEdge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

    if (fs.existsSync(systemChrome)) {
      execPath = systemChrome;
      console.log(`[i] Using System Chrome: ${execPath}`);
    } else if (fs.existsSync(systemChrome86)) {
      execPath = systemChrome86;
      console.log(`[i] Using System Chrome (x86): ${execPath}`);
    } else if (fs.existsSync(systemEdge)) {
      execPath = systemEdge;
      console.log(`[i] Using System Edge: ${execPath}`);
    }
  }

  const launchOptions = {
    headless: config.headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--window-size=1280,800',
    ],
  };

  if (execPath) {
    launchOptions.executablePath = execPath;
  }

  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();

  await page.setViewport({ width: 1280, height: 800 });
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  );

  const globalSeenUrls = new Set();
  const allRawJobCards = [];

  try {
    for (const loc of locations) {
      const locConfig = { ...config, location: loc };
      const searchUrl = buildSearchUrl(locConfig);
      console.log(`\n====================================================`);
      console.log(`[+] Searching jobs for Location: "${loc}"`);
      console.log(`    Target URL: ${searchUrl}`);

      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await sleep(2000);

      let previousHeight = 0;
      let scrollAttempts = 0;
      const maxScrollAttempts = Math.ceil((config.maxJobs / locations.length) / 5) || 5;

      while (scrollAttempts < maxScrollAttempts) {
        const currentCardsCount = await page.evaluate(() => {
          return document.querySelectorAll('ul.jobs-search__results-list li, div.base-search-card').length;
        });

        console.log(`    -> Location [${loc}]: Found ${currentCardsCount} cards on DOM...`);
        if (currentCardsCount >= Math.ceil(config.maxJobs / locations.length)) {
          break;
        }

        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await sleep(config.delayMs);

        const seeMoreClicked = await page.evaluate(() => {
          const btn = document.querySelector('button.infinite-scroller__show-more-button, button.see-more-jobs');
          if (btn && btn.offsetHeight > 0) {
            btn.click();
            return true;
          }
          return false;
        });

        if (seeMoreClicked) {
          console.log('    -> Clicked "See more jobs" button');
          await sleep(config.delayMs);
        }

        const currentHeight = await page.evaluate(() => document.body.scrollHeight);
        if (currentHeight === previousHeight && !seeMoreClicked) {
          scrollAttempts++;
          if (scrollAttempts >= 3) break;
        } else {
          scrollAttempts = 0;
        }

        previousHeight = currentHeight;
      }

      // Extract cards for current location
      const locationCards = await page.evaluate((targetLoc) => {
        const cards = Array.from(document.querySelectorAll('ul.jobs-search__results-list > li'));
        const results = [];

        for (let i = 0; i < cards.length; i++) {
          const card = cards[i];
          const titleElem = card.querySelector('.base-search-card__title, .job-search-card__title');
          const companyElem = card.querySelector('.base-search-card__subtitle, .job-search-card__company-name');
          const companyUrlElem = card.querySelector('.base-search-card__subtitle a, .job-search-card__company-name a');
          const locationElem = card.querySelector('.job-search-card__location');
          const dateElem = card.querySelector('time');
          const linkElem = card.querySelector('a.base-card__full-link, a.job-search-card__link');

          const title = titleElem ? titleElem.innerText.trim() : null;
          const company = companyElem ? companyElem.innerText.trim() : null;
          const companyUrl = companyUrlElem ? companyUrlElem.href : null;
          const location = locationElem ? locationElem.innerText.trim() : null;
          const postedDate = dateElem ? (dateElem.getAttribute('datetime') || dateElem.innerText.trim()) : null;
          const rawJobUrl = linkElem ? linkElem.href : null;

          const jobUrl = rawJobUrl ? rawJobUrl.split('?')[0] : null;
          const urn = card.querySelector('.base-card')?.getAttribute('data-entity-urn') || `job-${i + 1}`;

          if (title && jobUrl) {
            results.push({
              id: urn,
              title,
              company,
              companyUrl,
              location: location || targetLoc,
              postedDate,
              jobUrl,
              searchLocation: targetLoc,
            });
          }
        }
        return results;
      }, loc);

      let newCount = 0;
      for (const card of locationCards) {
        if (!globalSeenUrls.has(card.jobUrl)) {
          globalSeenUrls.add(card.jobUrl);
          allRawJobCards.push(card);
          newCount++;
        }
      }

      console.log(`[+] Added ${newCount} unique jobs from location "${loc}".`);
    }

    console.log(`\n[+] Total unique jobs gathered across all locations: ${allRawJobCards.length}`);
    const limit = Math.min(allRawJobCards.length, config.maxJobs);
    const selectedJobs = allRawJobCards.slice(0, limit);

    const jobs = [];

    // Extract detailed descriptions if requested
    if (config.extractFullDescription && selectedJobs.length > 0) {
      console.log(`\n[+] Extracting detailed descriptions for ${selectedJobs.length} jobs...`);

      for (let i = 0; i < selectedJobs.length; i++) {
        const job = selectedJobs[i];
        console.log(`    [${i + 1}/${selectedJobs.length}] Fetching description for: "${job.title}" at "${job.company}" (${job.location})`);

        try {
          const detailPage = await browser.newPage();
          await detailPage.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
          );

          await detailPage.goto(job.jobUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
          await sleep(1000);

          await detailPage.evaluate(() => {
            const showMoreBtn = document.querySelector('button.show-more-less-html__button');
            if (showMoreBtn) showMoreBtn.click();
          });

          const description = await detailPage.evaluate(() => {
            const descElem = document.querySelector('.show-more-less-html__markup, .description__text');
            return descElem ? descElem.innerText.trim() : 'N/A';
          });

          job.description = description;
          await detailPage.close();
        } catch (err) {
          console.warn(`    [!] Could not fetch description for job ${job.id}: ${err.message}`);
          job.description = 'N/A (Failed to fetch detail)';
        }

        job.scrapedAt = new Date().toISOString();
        jobs.push(job);

        await sleep(config.delayMs);
      }
      return jobs;
    } else {
      for (const job of selectedJobs) {
        job.description = 'N/A (Full description extraction disabled)';
        job.scrapedAt = new Date().toISOString();
        jobs.push(job);
      }
      return jobs;
    }

  } catch (error) {
    console.error('[-] Error during scraping:', error);
    return [];
  } finally {
    await browser.close();
    console.log('[+] Browser closed.');
  }
}

module.exports = { scrapeLinkedInJobs };
