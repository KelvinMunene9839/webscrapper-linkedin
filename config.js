require('dotenv').config();

module.exports = {
  // Search Settings
  keywords: process.env.KEYWORDS || 'Software Engineer',
  location: process.env.LOCATION || 'Rwanda, Remote',
  
  // Time Posted filter: '24h' (past 24 hours), 'week' (past week), 'month' (past month), 'all' (any time)
  timePosted: process.env.TIME_POSTED || 'week',
  
  // Experience levels: 'entry', 'mid', 'senior', 'executive', 'all'
  experienceLevel: process.env.EXPERIENCE_LEVEL || 'all',

  // Scraping Controls
  maxJobs: parseInt(process.env.MAX_JOBS, 10) || 50,
  headless: process.env.HEADLESS !== 'false', // default true unless explicitly set to 'false'
  extractFullDescription: process.env.EXTRACT_FULL_DESCRIPTION === 'true',
  delayMs: parseInt(process.env.DELAY_MS, 10) || 1500,

  // Output Paths
  outputDir: process.env.OUTPUT_DIR || './data',
  jsonFilename: process.env.JSON_FILENAME || 'jobs.json',
  csvFilename: process.env.CSV_FILENAME || 'jobs.csv',
};
