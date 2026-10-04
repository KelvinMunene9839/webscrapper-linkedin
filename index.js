const path = require('path');
const config = require('./config');
const { scrapeLinkedInJobs } = require('./src/scraper');
const { saveToJson, saveToCsv } = require('./src/utils');

// Simple CLI Argument parser overrides
function parseCliArgs(cfg) {
  const args = process.argv.slice(2);
  const updatedConfig = { ...cfg };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--keywords' || arg === '-k') {
      updatedConfig.keywords = args[++i];
    } else if (arg === '--location' || arg === '-l') {
      updatedConfig.location = args[++i];
    } else if (arg === '--max' || arg === '-m') {
      updatedConfig.maxJobs = parseInt(args[++i], 10);
    } else if (arg === '--time' || arg === '-t') {
      updatedConfig.timePosted = args[++i];
    } else if (arg === '--no-headless') {
      updatedConfig.headless = false;
    } else if (arg === '--no-description') {
      updatedConfig.extractFullDescription = false;
    }
  }

  return updatedConfig;
}

async function main() {
  console.log('====================================================');
  console.log('   LinkedIn Software Engineering Opportunities Scraper');
  console.log('====================================================');

  const finalConfig = parseCliArgs(config);

  console.log('\n[i] Active Scraper Configuration:');
  console.log(`    - Keywords    : "${finalConfig.keywords}"`);
  console.log(`    - Location    : "${finalConfig.location}"`);
  console.log(`    - Time Posted : "${finalConfig.timePosted}"`);
  console.log(`    - Max Jobs    : ${finalConfig.maxJobs}`);
  console.log(`    - Headless    : ${finalConfig.headless}`);
  console.log(`    - Full Details: ${finalConfig.extractFullDescription}`);

  const startTime = Date.now();
  const jobs = await scrapeLinkedInJobs(finalConfig);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  if (jobs.length > 0) {
    const jsonPath = path.resolve(finalConfig.outputDir, finalConfig.jsonFilename);
    const csvPath = path.resolve(finalConfig.outputDir, finalConfig.csvFilename);

    saveToJson(jobs, jsonPath);
    await saveToCsv(jobs, csvPath);

    console.log('\n====================================================');
    console.log(`[SUCCESS] Scraping completed in ${duration}s!`);
    console.log(`[+] Total Jobs Scraped: ${jobs.length}`);
    console.log(`[+] Output JSON: ${jsonPath}`);
    console.log(`[+] Output CSV : ${csvPath}`);
    console.log('====================================================\n');
  } else {
    console.log('\n====================================================');
    console.log('[!] No jobs found or extracted. Try broadening search keywords or location.');
    console.log('====================================================\n');
  }
}

main().catch((err) => {
  console.error('[FATAL] Unhandled application error:', err);
  process.exit(1);
});
