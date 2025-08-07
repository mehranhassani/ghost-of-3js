class DebugSystem {
    constructor() {
        this.logs = [];
        this.errors = [];
        this.testResults = [];
        this.screenshots = [];
        this.startTime = Date.now();
        this.lastScreenshot = 0;
        this.isEnabled = true;
        
        this.createDebugUI();
        this.setupErrorCatching();
        this.initTests();
        
        console.log('🔧 Debug System initialized');
    }

    createDebugUI() {
        // Create debug panel
        this.debugPanel = document.createElement('div');
        this.debugPanel.id = 'debug-panel';
        this.debugPanel.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            width: 400px;
            max-height: 600px;
            background: rgba(0, 0, 0, 0.9);
            color: #00ff00;
            padding: 10px;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            z-index: 10000;
            overflow-y: auto;
            border: 2px solid #00ff00;
        `;

        // Create sections
        this.debugPanel.innerHTML = `
            <div style="color: #ffff00; font-weight: bold; margin-bottom: 10px;">
                🔧 DEBUG SYSTEM - Agent Feedback Loop
            </div>
            <div style="margin-bottom: 10px;">
                <button id="toggle-debug" style="background: #333; color: #00ff00; border: 1px solid #00ff00; padding: 5px;">Toggle</button>
                <button id="take-screenshot" style="background: #333; color: #00ff00; border: 1px solid #00ff00; padding: 5px;">Screenshot</button>
                <button id="run-tests" style="background: #333; color: #00ff00; border: 1px solid #00ff00; padding: 5px;">Run Tests</button>
                <button id="export-report" style="background: #333; color: #00ff00; border: 1px solid #00ff00; padding: 5px;">Export</button>
            </div>
            <div id="debug-status" style="margin-bottom: 10px; color: #ffff00;"></div>
            <div id="debug-logs" style="max-height: 200px; overflow-y: auto; margin-bottom: 10px; border: 1px solid #333; padding: 5px;"></div>
            <div id="test-results" style="max-height: 150px; overflow-y: auto; border: 1px solid #333; padding: 5px;"></div>
        `;

        document.body.appendChild(this.debugPanel);

        // Setup event handlers
        document.getElementById('toggle-debug').onclick = () => this.toggleDebug();
        document.getElementById('take-screenshot').onclick = () => this.takeScreenshot();
        document.getElementById('run-tests').onclick = () => this.runAllTests();
        document.getElementById('export-report').onclick = () => this.exportReport();

        this.statusDiv = document.getElementById('debug-status');
        this.logsDiv = document.getElementById('debug-logs');
        this.testsDiv = document.getElementById('test-results');
    }

    setupErrorCatching() {
        // Catch all errors
        window.addEventListener('error', (event) => {
            this.logError(`JS Error: ${event.message} at ${event.filename}:${event.lineno}`);
        });

        // Catch unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.logError(`Unhandled Promise: ${event.reason}`);
        });

        // Override console methods to capture logs
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        console.log = (...args) => {
            this.log('LOG', ...args);
            originalLog.apply(console, args);
        };

        console.error = (...args) => {
            this.logError('ERROR: ' + args.join(' '));
            originalError.apply(console, args);
        };

        console.warn = (...args) => {
            this.log('WARN', ...args);
            originalWarn.apply(console, args);
        };
    }

    log(type, ...args) {
        const timestamp = Date.now() - this.startTime;
        const message = `[${timestamp}ms] ${type}: ${args.join(' ')}`;
        this.logs.push(message);
        this.updateLogsUI();
    }

    logError(message) {
        const timestamp = Date.now() - this.startTime;
        const errorMsg = `[${timestamp}ms] ❌ ${message}`;
        this.errors.push(errorMsg);
        this.logs.push(errorMsg);
        this.updateLogsUI();
    }

    updateLogsUI() {
        if (this.logsDiv) {
            this.logsDiv.innerHTML = this.logs.slice(-20).join('<br>');
            this.logsDiv.scrollTop = this.logsDiv.scrollHeight;
        }
    }

    initTests() {
        this.tests = [
            {
                name: 'Three.js Library',
                test: () => typeof THREE !== 'undefined' && THREE.Scene,
                fix: 'Check Three.js CDN and loading'
            },
            {
                name: 'Player Class',
                test: () => typeof Player !== 'undefined',
                fix: 'Check player.js loading'
            },
            {
                name: 'UI System',
                test: () => typeof UISystem !== 'undefined',
                fix: 'Check ui.js loading'
            },
            {
                name: 'World Generator',
                test: () => typeof WorldGenerator !== 'undefined',
                fix: 'Check world-generator.js loading'
            },
            {
                name: 'Audio System',
                test: () => typeof AudioSystem !== 'undefined',
                fix: 'Check audio.js loading'
            },
            {
                name: 'Combat System',
                test: () => typeof CombatSystem !== 'undefined',
                fix: 'Check combat.js loading'
            },
            {
                name: 'Canvas Element',
                test: () => {
                    const canvas = document.querySelector('canvas');
                    return canvas && canvas.width > 0 && canvas.height > 0;
                },
                fix: 'Check WebGL renderer setup'
            },
            {
                name: 'Game Instance',
                test: () => window.gameInstance && window.gameInstance.isLoaded,
                fix: 'Check game initialization'
            }
        ];
    }

    async runAllTests() {
        this.testResults = [];
        this.log('TEST', 'Starting automated tests...');

        for (const test of this.tests) {
            try {
                const result = await test.test();
                const status = result ? '✅' : '❌';
                const message = `${status} ${test.name}: ${result ? 'PASS' : 'FAIL'}`;
                
                this.testResults.push({
                    name: test.name,
                    passed: result,
                    message: message,
                    fix: test.fix
                });

                this.log('TEST', message);
                if (!result) {
                    this.log('FIX', `Suggestion: ${test.fix}`);
                }
            } catch (error) {
                this.logError(`Test ${test.name} threw error: ${error.message}`);
                this.testResults.push({
                    name: test.name,
                    passed: false,
                    message: `❌ ${test.name}: ERROR - ${error.message}`,
                    fix: test.fix
                });
            }
        }

        this.updateTestsUI();
        this.updateStatus();
        
        // Auto-fix some issues
        await this.attemptAutoFixes();
    }

    async attemptAutoFixes() {
        this.log('FIX', 'Attempting automatic fixes...');
        
        const failedTests = this.testResults.filter(t => !t.passed);
        
        for (const test of failedTests) {
            switch (test.name) {
                case 'Three.js Library':
                    await this.fixThreeJS();
                    break;
                case 'Canvas Element':
                    this.fixCanvas();
                    break;
                case 'Game Instance':
                    this.fixGameInstance();
                    break;
            }
        }
    }

    async fixThreeJS() {
        if (typeof THREE === 'undefined') {
            this.log('FIX', 'Attempting to reload Three.js...');
            try {
                await this.loadScript('https://unpkg.com/three@0.158.0/build/three.min.js');
                this.log('FIX', '✅ Three.js reloaded successfully');
            } catch (error) {
                this.logError('Failed to reload Three.js: ' + error.message);
            }
        }
    }

    fixCanvas() {
        const canvas = document.querySelector('canvas');
        if (!canvas) {
            this.log('FIX', 'Creating missing canvas element...');
            const newCanvas = document.createElement('canvas');
            newCanvas.width = window.innerWidth;
            newCanvas.height = window.innerHeight;
            newCanvas.style.cssText = 'position: fixed; top: 0; left: 0; z-index: 1;';
            document.body.appendChild(newCanvas);
        }
    }

    fixGameInstance() {
        if (!window.gameInstance) {
            this.log('FIX', 'Attempting to create game instance...');
            try {
                window.gameInstance = new Game();
                this.log('FIX', '✅ Game instance created');
            } catch (error) {
                this.logError('Failed to create game instance: ' + error.message);
            }
        }
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    takeScreenshot() {
        const canvas = document.querySelector('canvas');
        if (canvas) {
            try {
                const dataURL = canvas.toDataURL('image/png');
                const timestamp = new Date().toISOString();
                
                this.screenshots.push({
                    timestamp,
                    dataURL,
                    gameState: this.getGameState()
                });
                
                this.log('SCREENSHOT', `Screenshot captured: ${timestamp}`);
                
                // Create download link
                const link = document.createElement('a');
                link.download = `game-screenshot-${timestamp}.png`;
                link.href = dataURL;
                link.click();
                
            } catch (error) {
                this.logError('Failed to take screenshot: ' + error.message);
            }
        } else {
            this.logError('No canvas found for screenshot');
        }
    }

    getGameState() {
        const state = {
            timestamp: Date.now(),
            windowSize: { width: window.innerWidth, height: window.innerHeight },
            gameLoaded: window.gameInstance ? window.gameInstance.isLoaded : false,
            errors: this.errors.length,
            logs: this.logs.length
        };

        if (window.gameInstance) {
            state.gameTime = window.gameInstance.gameTime;
            state.isPaused = window.gameInstance.isPaused;
            if (window.gameInstance.player) {
                state.playerPosition = {
                    x: window.gameInstance.player.position.x,
                    y: window.gameInstance.player.position.y,
                    z: window.gameInstance.player.position.z
                };
                state.playerHealth = window.gameInstance.player.health;
            }
        }

        return state;
    }

    updateTestsUI() {
        if (this.testsDiv) {
            const html = this.testResults.map(test => {
                const color = test.passed ? '#00ff00' : '#ff4444';
                return `<div style="color: ${color}; margin: 2px 0;">${test.message}</div>`;
            }).join('');
            this.testsDiv.innerHTML = html;
        }
    }

    updateStatus() {
        if (this.statusDiv) {
            const passed = this.testResults.filter(t => t.passed).length;
            const total = this.testResults.length;
            const errors = this.errors.length;
            
            this.statusDiv.innerHTML = `
                Tests: ${passed}/${total} passed | Errors: ${errors} | 
                Uptime: ${Math.floor((Date.now() - this.startTime) / 1000)}s
            `;
        }
    }

    toggleDebug() {
        this.isEnabled = !this.isEnabled;
        this.debugPanel.style.display = this.isEnabled ? 'block' : 'none';
    }

    exportReport() {
        const report = {
            timestamp: new Date().toISOString(),
            uptime: Date.now() - this.startTime,
            logs: this.logs,
            errors: this.errors,
            testResults: this.testResults,
            gameState: this.getGameState(),
            screenshots: this.screenshots.length
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `debug-report-${report.timestamp}.json`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);

        this.log('EXPORT', 'Debug report exported');
    }

    // Auto-screenshot on significant events
    autoScreenshot(reason) {
        const now = Date.now();
        if (now - this.lastScreenshot > 5000) { // Max one every 5 seconds
            this.lastScreenshot = now;
            setTimeout(() => {
                this.takeScreenshot();
                this.log('AUTO-SCREENSHOT', `Captured: ${reason}`);
            }, 100);
        }
    }

    // Monitor game events
    onGameEvent(event, data) {
        this.log('GAME-EVENT', `${event}: ${JSON.stringify(data)}`);
        
        switch (event) {
            case 'game-loaded':
                this.autoScreenshot('Game loaded');
                break;
            case 'player-moved':
                // Screenshot every 30 seconds during movement
                if (Date.now() - this.lastScreenshot > 30000) {
                    this.autoScreenshot('Player movement');
                }
                break;
            case 'error':
                this.autoScreenshot('Error occurred');
                break;
        }
    }
}

// Initialize debug system immediately
window.debugSystem = new DebugSystem();