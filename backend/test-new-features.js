const http = require('http');
const https = require('https');
const { URL } = require('url');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
let AUTH_TOKEN = '';
let TEST_MEDICINE_ID = 1;
let TEST_SALE_ID = 1;
let TEST_CUSTOMER_ID = 1;

// Test Results Tracker
let passedTests = 0;
let failedTests = 0;
const testResults = [];

// Helper Functions
const log = (message, type = 'info') => {
  const colors = {
    success: '\x1b[32m',   // Green
    error: '\x1b[31m',     // Red
    info: '\x1b[34m',      // Blue
    warning: '\x1b[33m',   // Yellow
    reset: '\x1b[0m'       // Reset
  };
  
  const color = colors[type] || colors.info;
  console.log(`${color}${message}${colors.reset}`);
};

const makeRequest = async (method, endpoint, data = null) => {
  return new Promise((resolve) => {
    const url = new URL(BASE_URL + endpoint);
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? https : http;
    
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    };
    
    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }
    
    const req = httpModule.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 300,
            data: parsedData,
            status: res.statusCode
          });
        } catch (error) {
          resolve({
            success: false,
            data: { message: 'Invalid JSON response' },
            status: res.statusCode
          });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({
        success: false,
        data: { message: error.message },
        status: 500
      });
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
};

const runTest = async (testName, testFunction) => {
  log(`\n🔄 Running: ${testName}`, 'info');
  
  try {
    const result = await testFunction();
    if (result.passed) {
      passedTests++;
      log(`✅ PASSED: ${testName}`, 'success');
      if (result.message) log(`   → ${result.message}`, 'info');
    } else {
      failedTests++;
      log(`❌ FAILED: ${testName}`, 'error');
      log(`   → ${result.message}`, 'error');
    }
    
    testResults.push({
      name: testName,
      passed: result.passed,
      message: result.message
    });
  } catch (error) {
    failedTests++;
    log(`❌ FAILED: ${testName} - ${error.message}`, 'error');
    testResults.push({
      name: testName,
      passed: false,
      message: error.message
    });
  }
};

// Authentication Helper - UPDATED WITH CORRECT CREDENTIALS
const login = async () => {
  log('\n🔐 Logging in to get authentication token...', 'info');
  
  const loginData = {
    identifier: 'soumaya@pharmacy.com',
    password: 'SecurePass123'
  };
  
  const response = await makeRequest('POST', '/auth/login', loginData);
  
  // Debug: Log the full response
  log(`Login Response Status: ${response.status}`, 'info');
  log(`Login Response Data: ${JSON.stringify(response.data, null, 2)}`, 'info');
  
  // Try different possible token locations
  let token = null;
  
  if (response.data.token) {
    token = response.data.token;
    log('Found token at: response.data.token', 'info');
  } else if (response.data.data && response.data.data.token) {
    token = response.data.data.token;
    log('Found token at: response.data.data.token', 'info');
  } else if (response.data.accessToken) {
    token = response.data.accessToken;
    log('Found token at: response.data.accessToken', 'info');
  } else if (response.data.data && response.data.data.accessToken) {
    token = response.data.data.accessToken;
    log('Found token at: response.data.data.accessToken', 'info');
  } else if (response.data.auth && response.data.auth.token) {
    token = response.data.auth.token;
    log('Found token at: response.data.auth.token', 'info');
  }
  
  if (response.success && token) {
    AUTH_TOKEN = token;
    log('✅ Login successful! Token extracted.', 'success');
    log(`Token preview: ${token.substring(0, 20)}...`, 'info');
    return true;
  } else {
    log('❌ Login failed! Could not find token in response.', 'error');
    log('Please check the response structure above.', 'warning');
    return false;
  }
};

// Test Functions
const testStockAdjustmentIncrease = async () => {
  const result = await makeRequest('PUT', `/medicines/${TEST_MEDICINE_ID}/adjust-stock`, {
    adjustment: 50,
    reason: 'New stock arrival',
    notes: 'From supplier ABC'
  });
  
  if (result.success && result.data.success) {
    return {
      passed: true,
      message: `Stock adjusted from ${result.data.data.previousStock} to ${result.data.data.newStock}`
    };
  }
  
  return {
    passed: false,
    message: result.data.message || 'Stock adjustment failed'
  };
};

const testStockAdjustmentDecrease = async () => {
  const result = await makeRequest('PUT', `/medicines/${TEST_MEDICINE_ID}/adjust-stock`, {
    adjustment: -10,
    reason: 'Damaged items',
    notes: 'Water damage'
  });
  
  if (result.success && result.data.success) {
    return {
      passed: true,
      message: `Stock decreased by 10 units`
    };
  }
  
  return {
    passed: false,
    message: result.data.message || 'Stock adjustment failed'
  };
};

const testStockAdjustmentInvalidZero = async () => {
  const result = await makeRequest('PUT', `/medicines/${TEST_MEDICINE_ID}/adjust-stock`, {
    adjustment: 0,
    reason: 'Test zero'
  });
  
  if (!result.success && result.data.message && result.data.message.includes('cannot be zero')) {
    return {
      passed: true,
      message: 'Correctly rejected zero adjustment'
    };
  }
  
  return {
    passed: false,
    message: 'Should have rejected zero adjustment'
  };
};

const testSalesStats = async () => {
  const result = await makeRequest('GET', '/sales/stats');
  
  if (result.success && result.data.success) {
    const stats = result.data.data;
    return {
      passed: true,
      message: `Found ${stats.overview?.totalSales || 0} sales with revenue ${stats.overview?.totalRevenue || 0}`
    };
  }
  
  return {
    passed: false,
    message: result.data.message || 'Failed to get sales stats'
  };
};

const testTodaySales = async () => {
  const result = await makeRequest('GET', '/sales/today');
  
  if (result.success && result.data.success) {
    const today = result.data.data;
    return {
      passed: true,
      message: `Today: ${today.salesCount || 0} sales, revenue: ${today.totalRevenue || 0}`
    };
  }
  
  return {
    passed: false,
    message: result.data.message || 'Failed to get today sales'
  };
};

const testDashboardStats = async () => {
  const result = await makeRequest('GET', '/dashboard/stats');
  
  if (result.success && result.data.success) {
    const stats = result.data.data;
    return {
      passed: true,
      message: `Medicines: ${stats.inventory?.totalMedicines || 0}, Low Stock: ${stats.inventory?.lowStockCount || 0}`
    };
  }
  
  return {
    passed: false,
    message: result.data.message || 'Failed to get dashboard stats'
  };
};

const testInventoryReport = async () => {
  const result = await makeRequest('GET', '/reports/inventory');
  
  if (result.success && result.data.success) {
    const report = result.data.data;
    return {
      passed: true,
      message: `Report generated: ${report.summary?.totalItems || 0} items, value: ${report.summary?.totalValue || 0}`
    };
  }
  
  return {
    passed: false,
    message: result.data.message || 'Failed to generate inventory report'
  };
};

const testCustomerHistory = async () => {
  const result = await makeRequest('GET', `/customers/${TEST_CUSTOMER_ID}/history`);
  
  if (result.success && result.data.success) {
    const history = result.data.data;
    return {
      passed: true,
      message: `Customer history: ${history.summary?.totalPurchases || 0} purchases, spent: ${history.summary?.totalSpent || 0}`
    };
  }
  
  return {
    passed: false,
    message: result.data.message || 'Failed to get customer history'
  };
};

// Check if server is running
const checkServerConnection = async () => {
  log('\n🔍 Checking server connection...', 'info');
  
  const result = await makeRequest('GET', '/auth/profile');
  if (result.status === 401) {
    log('✅ Server is running (authentication required)', 'success');
    return true;
  } else if (result.success) {
    log('✅ Server is running and accessible', 'success');
    return true;
  } else {
    log('❌ Server is not responding. Please start your server with: npm run dev', 'error');
    return false;
  }
};

// Main Test Runner
const runAllTests = async () => {
  log('🚀 PHARMACY MANAGEMENT SYSTEM - NEW FEATURES TEST SUITE', 'info');
  log('============================================================', 'info');
  
  // Check server connection
  const serverRunning = await checkServerConnection();
  if (!serverRunning) {
    log('Cannot proceed without server. Exiting...', 'error');
    return;
  }
  
  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    log('Cannot proceed without authentication. Exiting...', 'error');
    return;
  }
  
  // Run key tests
  log('\n📋 TESTING CORE NEW FEATURES:', 'info');
  await runTest('Stock Adjustment - Increase Stock', testStockAdjustmentIncrease);
  await runTest('Stock Adjustment - Decrease Stock', testStockAdjustmentDecrease);
  await runTest('Stock Adjustment - Invalid Zero', testStockAdjustmentInvalidZero);
  
  log('\n💰 TESTING SALES ENHANCEMENTS:', 'info');
  await runTest('Sales Statistics', testSalesStats);
  await runTest('Today Sales Summary', testTodaySales);
  
  log('\n📊 TESTING DASHBOARD FEATURES:', 'info');
  await runTest('Dashboard Statistics', testDashboardStats);
  
  log('\n📋 TESTING REPORTS FEATURES:', 'info');
  await runTest('Inventory Report', testInventoryReport);
  
  log('\n👥 TESTING CUSTOMER ENHANCEMENTS:', 'info');
  await runTest('Customer Purchase History', testCustomerHistory);
  
  // Display Results
  log('\n============================================================', 'info');
  log('🎯 TEST RESULTS SUMMARY:', 'info');
  log('============================================================', 'info');
  
  log(`✅ Passed: ${passedTests}`, 'success');
  log(`❌ Failed: ${failedTests}`, 'error');
  log(`📊 Total: ${passedTests + failedTests}`, 'info');
  
  if (failedTests > 0) {
    log('\n❌ FAILED TESTS:', 'error');
    testResults
      .filter(test => !test.passed)
      .forEach(test => {
        log(`   • ${test.name}: ${test.message}`, 'error');
      });
  }
  
  if (passedTests === (passedTests + failedTests)) {
    log('\n🎉 ALL TESTS PASSED! Your new backend features are working perfectly! 🎉', 'success');
  } else {
    log(`\n⚠️ ${failedTests} test(s) failed. Please check the error messages above.`, 'warning');
  }
  
  log('\n🚀 Ready for Phase 3 - Frontend Development! 🚀', 'success');
};

// Run the tests
runAllTests().catch(error => {
  log(`💥 Test suite crashed: ${error.message}`, 'error');
  console.error(error);
});