const fs = require('fs');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

/**
 * Builds the LinkedIn guest jobs search URL based on config parameters.
 */
function buildSearchUrl(config) {
  const baseUrl = 'https://www.linkedin.com/jobs/search';
  const params = new URLSearchParams();

  if (config.keywords) params.append('keywords', config.keywords);
  if (config.location) params.append('location', config.location);

  // Time posted filter mapping
  const timeMap = {
    '24h': 'r86400',
    'week': 'r604800',
    'month': 'r2592000',
  };
  if (config.timePosted && timeMap[config.timePosted]) {
    params.append('f_TPR', timeMap[config.timePosted]);
  }

  // Experience level mapping
  const expMap = {
    'internship': '1',
    'entry': '2',
    'associate': '3',
    'mid': '4',
    'director': '5',
    'executive': '6',
  };
  if (config.experienceLevel && expMap[config.experienceLevel.toLowerCase()]) {
    params.append('f_E', expMap[config.experienceLevel.toLowerCase()]);
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Helper to pause execution for a given milliseconds.
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Ensures the target output directory exists.
 */
function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Saves job records to a JSON file.
 */
function saveToJson(data, filepath) {
  ensureDirectory(path.dirname(filepath));
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`[+] Exported ${data.length} jobs to JSON: ${filepath}`);
}

/**
 * Saves job records to a CSV file.
 */
async function saveToCsv(data, filepath) {
  if (!data || data.length === 0) return;
  ensureDirectory(path.dirname(filepath));

  const csvWriter = createCsvWriter({
    path: filepath,
    header: [
      { id: 'id', title: 'ID' },
      { id: 'title', title: 'Job Title' },
      { id: 'company', title: 'Company' },
      { id: 'location', title: 'Location' },
      { id: 'postedDate', title: 'Posted Date' },
      { id: 'jobUrl', title: 'Job URL' },
      { id: 'companyUrl', title: 'Company URL' },
      { id: 'description', title: 'Description' },
      { id: 'scrapedAt', title: 'Scraped At' },
    ],
  });

  await csvWriter.writeRecords(data);
  console.log(`[+] Exported ${data.length} jobs to CSV: ${filepath}`);
}

module.exports = {
  buildSearchUrl,
  sleep,
  ensureDirectory,
  saveToJson,
  saveToCsv,
};
