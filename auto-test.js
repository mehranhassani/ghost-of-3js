const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AutomatedGameTester {
    constructor() {
        this.testResults = [];
        this.startTime = Date.now();
        this.logFile = `test-log-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.txt`;
        
        this.log('🔧 Automated Game Tester Started');
    }

    log(message, type = 'INFO') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${type}: ${message}`;
        console.log(logEntry);
        
        // Write to log file
        fs.appendFileSync(this.logFile, logEntry + '\n');
    }

    async runTests() {
        this.log('Starting comprehensive game tests...');

        // Test 1: File Structure
        await this.testFileStructure();

        // Test 2: Syntax Analysis
        await this.testSyntaxValidation();

        // Test 3: Dependency Check
        await this.testDependencies();

        // Test 4: Browser Simulation
        await this.testBrowserSimulation();

        // Test 5: Load Time Analysis
        await this.testLoadTime();

        // Generate Report
        this.generateReport();
    }

    async testFileStructure() {
        this.log('Testing file structure...', 'TEST');
        
        const requiredFiles = [
            'index.html',
            'js/game.js',
            'js/debug-system.js',
            'js/systems/player.js',
            'js/systems/ui.js',
            'js/systems/world-generator.js',
            'js/systems/combat.js',
            'js/systems/audio.js',
            'js/utils/noise.js',
            'styles.css'
        ];

        let passed = 0;
        const results = [];

        for (const file of requiredFiles) {
            if (fs.existsSync(file)) {
                passed++;
                results.push(`✅ ${file} - EXISTS`);
                this.log(`✅ Found: ${file}`);
            } else {
                results.push(`❌ ${file} - MISSING`);
                this.log(`❌ Missing: ${file}`, 'ERROR');
            }
        }

        this.testResults.push({
            name: 'File Structure',
            passed: passed,
            total: requiredFiles.length,
            details: results
        });
    }

    async testSyntaxValidation() {
        this.log('Testing JavaScript syntax...', 'TEST');
        
        const jsFiles = [
            'js/game.js',
            'js/debug-system.js',
            'js/systems/player.js',
            'js/systems/ui.js',
            'js/systems/world-generator.js',
            'js/systems/combat.js',
            'js/systems/audio.js'
        ];

        let passed = 0;
        const results = [];

        for (const file of jsFiles) {
            if (fs.existsSync(file)) {
                try {
                    const content = fs.readFileSync(file, 'utf8');
                    
                    // Basic syntax checks
                    const syntaxIssues = this.checkSyntaxIssues(content, file);
                    
                    if (syntaxIssues.length === 0) {
                        passed++;
                        results.push(`✅ ${file} - SYNTAX OK`);
                        this.log(`✅ Syntax OK: ${file}`);
                    } else {
                        results.push(`❌ ${file} - SYNTAX ISSUES: ${syntaxIssues.join(', ')}`);
                        this.log(`❌ Syntax issues in ${file}: ${syntaxIssues.join(', ')}`, 'ERROR');
                    }
                } catch (error) {
                    results.push(`❌ ${file} - READ ERROR: ${error.message}`);
                    this.log(`❌ Error reading ${file}: ${error.message}`, 'ERROR');
                }
            }
        }

        this.testResults.push({
            name: 'Syntax Validation',
            passed: passed,
            total: jsFiles.length,
            details: results
        });
    }

    checkSyntaxIssues(content, filename) {
        const issues = [];
        
        // Check for common syntax issues
        if (content.includes('async init() {') && !content.includes('constructor(')) {
            // This would be an issue if init is outside constructor
            const lines = content.split('\n');
            let inClass = false;
            let classEndFound = false;
            let initFound = false;
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.startsWith('class ')) {
                    inClass = true;
                }
                if (inClass && line === '}' && lines[i + 1] && !lines[i + 1].trim().startsWith('//')) {
                    classEndFound = true;
                }
                if (classEndFound && line.includes('async init()')) {
                    issues.push('init method defined outside class');
                    break;
                }
            }
        }
        
        // Check for missing global exports
        if (filename.includes('systems/') && !content.includes('window.')) {
            issues.push('missing global window export');
        }
        
        // Check for unclosed brackets
        const openBraces = (content.match(/\{/g) || []).length;
        const closeBraces = (content.match(/\}/g) || []).length;
        if (openBraces !== closeBraces) {
            issues.push(`unmatched braces: ${openBraces} open, ${closeBraces} close`);
        }
        
        return issues;
    }

    async testDependencies() {
        this.log('Testing dependencies...', 'TEST');
        
        const htmlContent = fs.readFileSync('index.html', 'utf8');
        const dependencies = [
            'three.min.js',
            'PointerLockControls.js',
            'GLTFLoader.js',
            'simplex-noise',
            'howler.min.js'
        ];

        let passed = 0;
        const results = [];

        for (const dep of dependencies) {
            if (htmlContent.includes(dep)) {
                passed++;
                results.push(`✅ ${dep} - REFERENCED`);
                this.log(`✅ Dependency referenced: ${dep}`);
            } else {
                results.push(`❌ ${dep} - NOT FOUND`);
                this.log(`❌ Dependency missing: ${dep}`, 'WARNING');
            }
        }

        this.testResults.push({
            name: 'Dependencies',
            passed: passed,
            total: dependencies.length,
            details: results
        });
    }

    async testBrowserSimulation() {
        this.log('Testing browser environment simulation...', 'TEST');
        
        // Create a simple browser-like environment simulation
        const results = [];
        let passed = 0;
        
        try {
            // Simulate loading the HTML
            const htmlContent = fs.readFileSync('index.html', 'utf8');
            
            // Check if all script tags are present
            const scriptTags = htmlContent.match(/<script[^>]*src="[^"]*"[^>]*>/g) || [];
            if (scriptTags.length > 0) {
                passed++;
                results.push(`✅ Script tags found: ${scriptTags.length}`);
                this.log(`✅ Found ${scriptTags.length} script tags`);
            }
            
            // Check if CSS is linked
            if (htmlContent.includes('styles.css')) {
                passed++;
                results.push(`✅ CSS stylesheet linked`);
                this.log(`✅ CSS stylesheet linked`);
            }
            
            // Check for required HTML elements
            const requiredElements = ['loading-screen', 'game-ui', 'health-container', 'minimap'];
            let elementsFound = 0;
            
            for (const element of requiredElements) {
                if (htmlContent.includes(`id="${element}"`)) {
                    elementsFound++;
                }
            }
            
            if (elementsFound === requiredElements.length) {
                passed++;
                results.push(`✅ All UI elements found`);
                this.log(`✅ All required UI elements found`);
            } else {
                results.push(`❌ Missing UI elements: ${requiredElements.length - elementsFound}`);
                this.log(`❌ Missing ${requiredElements.length - elementsFound} UI elements`, 'WARNING');
            }
            
        } catch (error) {
            results.push(`❌ Simulation error: ${error.message}`);
            this.log(`❌ Browser simulation failed: ${error.message}`, 'ERROR');
        }

        this.testResults.push({
            name: 'Browser Simulation',
            passed: passed,
            total: 3, // Number of checks we performed
            details: results
        });
    }

    async testLoadTime() {
        this.log('Analyzing estimated load time...', 'TEST');
        
        const results = [];
        let totalSize = 0;
        let fileCount = 0;
        
        try {
            const files = [
                'index.html',
                'styles.css',
                'js/game.js',
                'js/debug-system.js',
                'js/systems/player.js',
                'js/systems/ui.js',
                'js/systems/world-generator.js',
                'js/systems/combat.js',
                'js/systems/audio.js',
                'js/utils/noise.js'
            ];
            
            for (const file of files) {
                if (fs.existsSync(file)) {
                    const stats = fs.statSync(file);
                    totalSize += stats.size;
                    fileCount++;
                }
            }
            
            const totalSizeKB = Math.round(totalSize / 1024);
            const estimatedLoadTime = Math.round((totalSizeKB / 100) * 1000); // Rough estimate
            
            results.push(`📦 Total size: ${totalSizeKB} KB`);
            results.push(`📄 Files: ${fileCount}`);
            results.push(`⏱️ Estimated load time: ${estimatedLoadTime}ms`);
            
            this.log(`📦 Total bundle size: ${totalSizeKB} KB`);
            this.log(`⏱️ Estimated load time: ${estimatedLoadTime}ms`);
            
            this.testResults.push({
                name: 'Load Time Analysis',
                passed: estimatedLoadTime < 5000 ? 1 : 0, // Pass if under 5 seconds
                total: 1,
                details: results
            });
            
        } catch (error) {
            results.push(`❌ Analysis error: ${error.message}`);
            this.log(`❌ Load time analysis failed: ${error.message}`, 'ERROR');
        }
    }

    generateReport() {
        this.log('Generating test report...', 'REPORT');
        
        const totalTests = this.testResults.reduce((sum, result) => sum + result.total, 0);
        const totalPassed = this.testResults.reduce((sum, result) => sum + result.passed, 0);
        const duration = Date.now() - this.startTime;
        
        const report = {
            timestamp: new Date().toISOString(),
            duration: duration,
            summary: {
                total: totalTests,
                passed: totalPassed,
                failed: totalTests - totalPassed,
                passRate: Math.round((totalPassed / totalTests) * 100)
            },
            results: this.testResults
        };
        
        // Write detailed report
        const reportFile = `test-report-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.json`;
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
        
        // Print summary
        console.log('\n' + '='.repeat(50));
        console.log('🔧 AUTOMATED GAME TEST REPORT');
        console.log('='.repeat(50));
        console.log(`📅 Timestamp: ${report.timestamp}`);
        console.log(`⏱️  Duration: ${duration}ms`);
        console.log(`✅ Tests Passed: ${totalPassed}/${totalTests} (${report.summary.passRate}%)`);
        console.log('='.repeat(50));
        
        for (const result of this.testResults) {
            const status = result.passed === result.total ? '✅' : '❌';
            console.log(`${status} ${result.name}: ${result.passed}/${result.total}`);
            for (const detail of result.details) {
                console.log(`   ${detail}`);
            }
            console.log('');
        }
        
        console.log('='.repeat(50));
        console.log(`📄 Full report saved to: ${reportFile}`);
        console.log(`📄 Log saved to: ${this.logFile}`);
        console.log('='.repeat(50));
        
        return report;
    }
}

// Run the tests
if (require.main === module) {
    const tester = new AutomatedGameTester();
    tester.runTests().then(() => {
        console.log('✅ All tests completed!');
    }).catch((error) => {
        console.error('❌ Test runner failed:', error);
        process.exit(1);
    });
}

module.exports = AutomatedGameTester;