/**
 * Generate Coverage Reports
 * 
 * Processes E2E test coverage data and generates HTML and JSON reports.
 * This script reads the merged coverage data and creates human-readable reports.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const COVERAGE_DIR = path.join(process.cwd(), 'tests/e2e/coverage');
const REPORTS_DIR = path.join(process.cwd(), 'tests/e2e/reports');
const MERGED_COVERAGE_FILE = path.join(COVERAGE_DIR, 'coverage-merged.json');
const SUMMARY_FILE = path.join(COVERAGE_DIR, 'coverage-summary.json');

/**
 * Calculate detailed coverage metrics from coverage data
 */
function calculateDetailedCoverage(coverageData) {
  const fileMetrics = {};
  let totalBytes = 0;
  let usedBytes = 0;
  
  for (const entry of coverageData) {
    // Skip non-application files
    if (!isApplicationFile(entry.url)) continue;
    
    const fileName = getFileName(entry.url);
    const fileBytes = entry.text.length;
    let fileCoveredBytes = 0;
    
    for (const range of entry.ranges) {
      fileCoveredBytes += range.end - range.start;
    }
    
    totalBytes += fileBytes;
    usedBytes += fileCoveredBytes;
    
    const percentage = fileBytes > 0 ? (fileCoveredBytes / fileBytes) * 100 : 0;
    
    fileMetrics[fileName] = {
      url: entry.url,
      totalBytes: fileBytes,
      coveredBytes: fileCoveredBytes,
      percentage: Math.round(percentage * 100) / 100,
      ranges: entry.ranges.length,
    };
  }
  
  const overallPercentage = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;
  
  return {
    overall: {
      totalBytes,
      usedBytes,
      percentage: Math.round(overallPercentage * 100) / 100,
      files: Object.keys(fileMetrics).length,
    },
    files: fileMetrics,
  };
}

/**
 * Check if a URL is an application file
 */
function isApplicationFile(url) {
  // Exclude node_modules
  if (url.includes('node_modules')) return false;
  
  // Exclude test files
  if (url.includes('/tests/') || url.includes('.test.') || url.includes('.spec.')) return false;
  
  // Exclude webpack/next.js internal files
  if (url.includes('webpack') || url.includes('/_next/static/chunks/webpack')) return false;
  
  // Include only application code
  return url.includes('/app/') || 
         url.includes('/features/') || 
         url.includes('/lib/') ||
         url.includes('/src/');
}

/**
 * Extract file name from URL
 */
function getFileName(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Extract relative path from application root
    const match = pathname.match(/\/(app|features|lib|src)\/(.+)/);
    if (match) {
      return match[1] + '/' + match[2];
    }
    
    return pathname.split('/').pop() || url;
  } catch {
    return url;
  }
}

/**
 * Generate HTML coverage report
 */
function generateHTMLReport(coverage) {
  const { overall, files } = coverage;
  
  // Sort files by coverage percentage (lowest first)
  const sortedFiles = Object.entries(files).sort((a, b) => a[1].percentage - b[1].percentage);
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>E2E Test Coverage Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #f5f5f5;
      padding: 20px;
      line-height: 1.6;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    
    header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
    }
    
    h1 {
      font-size: 28px;
      margin-bottom: 10px;
    }
    
    .timestamp {
      opacity: 0.9;
      font-size: 14px;
    }
    
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 30px;
      background: #f8f9fa;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .metric {
      text-align: center;
    }
    
    .metric-value {
      font-size: 36px;
      font-weight: bold;
      color: #333;
      margin-bottom: 5px;
    }
    
    .metric-label {
      font-size: 14px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .coverage-bar {
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 10px;
    }
    
    .coverage-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      transition: width 0.3s ease;
    }
    
    .files-section {
      padding: 30px;
    }
    
    .section-title {
      font-size: 20px;
      margin-bottom: 20px;
      color: #333;
    }
    
    .file-list {
      list-style: none;
    }
    
    .file-item {
      padding: 15px;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: background 0.2s;
    }
    
    .file-item:hover {
      background: #f8f9fa;
    }
    
    .file-name {
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 13px;
      color: #333;
      flex: 1;
    }
    
    .file-coverage {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    
    .coverage-percentage {
      font-weight: bold;
      font-size: 16px;
      min-width: 60px;
      text-align: right;
    }
    
    .coverage-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    
    .badge-high { background: #d4edda; color: #155724; }
    .badge-medium { background: #fff3cd; color: #856404; }
    .badge-low { background: #f8d7da; color: #721c24; }
    
    .percentage-high { color: #28a745; }
    .percentage-medium { color: #ffc107; }
    .percentage-low { color: #dc3545; }
    
    footer {
      padding: 20px 30px;
      background: #f8f9fa;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🧪 E2E Test Coverage Report</h1>
      <div class="timestamp">Generated: ${new Date().toLocaleString()}</div>
    </header>
    
    <div class="summary">
      <div class="metric">
        <div class="metric-value ${getCoverageClass(overall.percentage)}">${overall.percentage.toFixed(1)}%</div>
        <div class="metric-label">Overall Coverage</div>
        <div class="coverage-bar">
          <div class="coverage-fill" style="width: ${overall.percentage}%"></div>
        </div>
      </div>
      
      <div class="metric">
        <div class="metric-value">${overall.files}</div>
        <div class="metric-label">Files Covered</div>
      </div>
      
      <div class="metric">
        <div class="metric-value">${formatBytes(overall.usedBytes)}</div>
        <div class="metric-label">Code Executed</div>
      </div>
      
      <div class="metric">
        <div class="metric-value">${formatBytes(overall.totalBytes)}</div>
        <div class="metric-label">Total Code</div>
      </div>
    </div>
    
    <div class="files-section">
      <h2 class="section-title">File Coverage Details</h2>
      <ul class="file-list">
        ${sortedFiles.map(([fileName, metrics]) => `
          <li class="file-item">
            <div class="file-name">${fileName}</div>
            <div class="file-coverage">
              <span class="coverage-badge ${getBadgeClass(metrics.percentage)}">
                ${metrics.ranges} ranges
              </span>
              <span class="coverage-percentage ${getCoverageClass(metrics.percentage)}">
                ${metrics.percentage.toFixed(1)}%
              </span>
            </div>
          </li>
        `).join('')}
      </ul>
    </div>
    
    <footer>
      <p>Coverage data collected from E2E tests using Playwright</p>
      <p>Thresholds: 70% minimum coverage recommended</p>
    </footer>
  </div>
</body>
</html>
  `;
  
  return html;
}

/**
 * Get CSS class for coverage percentage
 */
function getCoverageClass(percentage) {
  if (percentage >= 70) return 'percentage-high';
  if (percentage >= 50) return 'percentage-medium';
  return 'percentage-low';
}

/**
 * Get badge class for coverage percentage
 */
function getBadgeClass(percentage) {
  if (percentage >= 70) return 'badge-high';
  if (percentage >= 50) return 'badge-medium';
  return 'badge-low';
}

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Generate JSON coverage report
 */
function generateJSONReport(coverage) {
  return {
    timestamp: new Date().toISOString(),
    summary: coverage.overall,
    files: coverage.files,
    thresholds: {
      overall: 70,
      file: 50,
    },
    meetsThresholds: coverage.overall.percentage >= 70,
  };
}

/**
 * Main function
 */
function main() {
  console.log('📊 Generating coverage reports...');
  
  // Check if merged coverage file exists
  if (!fs.existsSync(MERGED_COVERAGE_FILE)) {
    console.error('❌ Merged coverage file not found. Run tests with coverage collection enabled first.');
    process.exit(1);
  }
  
  // Read merged coverage data
  const coverageData = JSON.parse(fs.readFileSync(MERGED_COVERAGE_FILE, 'utf-8'));
  
  // Calculate detailed coverage
  const coverage = calculateDetailedCoverage(coverageData);
  
  // Create reports directory if it doesn't exist
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
  
  // Generate HTML report
  const htmlReport = generateHTMLReport(coverage);
  const htmlPath = path.join(REPORTS_DIR, 'coverage.html');
  fs.writeFileSync(htmlPath, htmlReport);
  console.log(`✅ HTML report generated: ${htmlPath}`);
  
  // Generate JSON report
  const jsonReport = generateJSONReport(coverage);
  const jsonPath = path.join(REPORTS_DIR, 'coverage.json');
  fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));
  console.log(`✅ JSON report generated: ${jsonPath}`);
  
  // Print summary
  console.log('\n📈 Coverage Summary:');
  console.log(`   Overall: ${coverage.overall.percentage.toFixed(1)}%`);
  console.log(`   Files: ${coverage.overall.files}`);
  console.log(`   Executed: ${formatBytes(coverage.overall.usedBytes)} / ${formatBytes(coverage.overall.totalBytes)}`);
  
  if (coverage.overall.percentage < 70) {
    console.log('\n⚠️  Coverage is below 70% threshold');
  } else {
    console.log('\n✅ Coverage meets 70% threshold');
  }
}

// Run the script
main();
