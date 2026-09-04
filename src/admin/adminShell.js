// Admin Shell
// Minimal developer/admin tool - isolated and lightweight

export class AdminShell {
    constructor(gameRuntime) {
        this.game = gameRuntime;
        this.commandHistory = [];
        this.historyIndex = -1;
        this.outputLines = [];
        
        this.initUI();
        this.loadWelcomeMessage();
    }
    
    initUI() {
        const panel = document.createElement('div');
        panel.id = 'admin-shell-panel';
        panel.style.cssText = `
            display: none;
            padding: 16px;
            background: #0a0a0a;
            color: #c0c0c0;
            font-family: 'Courier New', monospace;
            height: 100%;
            overflow-y: auto;
            flex-direction: column;
        `;
        
        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #333; padding-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="color: #4caf50;">⚙️</span>
                    <span style="color: #888; font-size: 13px; font-weight: bold;">ADMIN SHELL</span>
                    <span style="color: #555; font-size: 11px;">|</span>
                    <span style="color: #666; font-size: 11px;">v0.1</span>
                </div>
                <div style="display: flex; gap: 8px;">
                    <span id="admin-status" style="color: #666; font-size: 11px;">Ready</span>
                </div>
            </div>
            
            <div id="admin-output" style="flex: 1; overflow-y: auto; background: #0a0a0a; padding: 4px 0; font-size: 13px; line-height: 1.6; min-height: 100px; max-height: 400px;">
                <div style="color: #666; font-style: italic; padding: 4px 0;">Type a command and press Enter...</div>
            </div>
            
            <div style="display: flex; gap: 8px; border-top: 1px solid #333; padding-top: 8px; margin-top: 4px;">
                <span style="color: #4caf50;">$</span>
                <input id="admin-input" type="text" placeholder="Enter command..." style="
                    flex: 1;
                    background: #111;
                    color: #c0c0c0;
                    border: 1px solid #333;
                    padding: 4px 8px;
                    font-family: 'Courier New', monospace;
                    font-size: 13px;
                    outline: none;
                ">
                <button id="admin-send-btn" style="
                    background: #2a2a2a;
                    border: 1px solid #444;
                    color: #aaa;
                    padding: 4px 12px;
                    cursor: pointer;
                    font-family: inherit;
                    font-size: 12px;
                ">Send</button>
                <button id="admin-clear-btn" style="
                    background: #2a2a2a;
                    border: 1px solid #444;
                    color: #aaa;
                    padding: 4px 12px;
                    cursor: pointer;
                    font-family: inherit;
                    font-size: 12px;
                ">Clear</button>
            </div>
            
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #2a2a2a; display: flex; gap: 16px; flex-wrap: wrap;">
                <span style="color: #555; font-size: 11px;">Available commands:</span>
                <span style="color: #4caf50; font-size: 11px; cursor: pointer;" class="admin-cmd-hint">/lockdiet</span>
                <span style="color: #888; font-size: 11px;">- Freeze hunger/thirst</span>
                <span style="color: #f44336; font-size: 11px; cursor: pointer;" class="admin-cmd-hint">/unlockdiet</span>
                <span style="color: #888; font-size: 11px;">- Resume hunger/thirst</span>
            </div>
        `;
        
        const editorContainer = document.getElementById('editor-container');
        if (editorContainer) {
            editorContainer.appendChild(panel);
        }
        
        this.setupEvents();
    }
    
    setupEvents() {
        const input = document.getElementById('admin-input');
        const sendBtn = document.getElementById('admin-send-btn');
        const clearBtn = document.getElementById('admin-clear-btn');
        const output = document.getElementById('admin-output');
        
        // Send on Enter key
        input?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.executeCommand();
            }
            
            // History navigation with arrow keys
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateHistory(-1);
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateHistory(1);
            }
        });
        
        // Send button
        sendBtn?.addEventListener('click', () => {
            this.executeCommand();
        });
        
        // Clear button
        clearBtn?.addEventListener('click', () => {
            this.clearOutput();
        });
        
        // Command hints click to fill input
        document.querySelectorAll('.admin-cmd-hint').forEach(el => {
            el.addEventListener('click', () => {
                if (input) {
                    input.value = el.textContent;
                    input.focus();
                }
            });
        });
    }
    
    loadWelcomeMessage() {
        this.addOutput('========================================', '#333');
        this.addOutput('  🧟 ADMIN SHELL v0.1', '#4caf50');
        this.addOutput('  ZombieSurvival Developer Console', '#888');
        this.addOutput('========================================', '#333');
        this.addOutput('Type /lockdiet or /unlockdiet to control diet.', '#666');
        this.addOutput('Use ↑/↓ for command history.', '#666');
        this.addOutput('', '#333');
    }
    
    executeCommand() {
        const input = document.getElementById('admin-input');
        if (!input) return;
        
        const command = input.value.trim();
        if (!command) return;
        
        // Add to history
        this.commandHistory.push(command);
        this.historyIndex = this.commandHistory.length;
        
        // Display the command
        this.addOutput(`$ ${command}`, '#4caf50');
        
        // Execute the command
        const result = this.game.executeAdminCommand(command);
        
        if (result && result.success !== undefined) {
            if (result.success) {
                this.addOutput(`✓ ${result.message}`, '#4caf50');
                this.setStatus('Success', '#4caf50');
            } else {
                this.addOutput(`✗ ${result.message}`, '#f44336');
                this.setStatus('Error', '#f44336');
            }
        } else {
            this.addOutput(`✗ Unknown error executing command.`, '#f44336');
            this.setStatus('Error', '#f44336');
        }
        
        // Clear input
        input.value = '';
        input.focus();
        
        // Scroll to bottom
        const output = document.getElementById('admin-output');
        if (output) {
            output.scrollTop = output.scrollHeight;
        }
    }
    
    addOutput(text, color = '#888') {
        const output = document.getElementById('admin-output');
        if (!output) return;
        
        const line = document.createElement('div');
        line.style.cssText = `padding: 2px 4px; color: ${color}; white-space: pre-wrap; word-break: break-all;`;
        line.textContent = text;
        output.appendChild(line);
        
        // Limit output lines
        while (output.children.length > 200) {
            output.removeChild(output.firstChild);
        }
    }
    
    clearOutput() {
        const output = document.getElementById('admin-output');
        if (!output) return;
        
        // Keep only the welcome message
        output.innerHTML = `
            <div style="color: #666; font-style: italic; padding: 4px 0;">=== Output cleared ===</div>
        `;
        this.loadWelcomeMessage();
    }
    
    navigateHistory(direction) {
        const input = document.getElementById('admin-input');
        if (!input || this.commandHistory.length === 0) return;
        
        let newIndex = this.historyIndex + direction;
        newIndex = Math.max(0, Math.min(this.commandHistory.length, newIndex));
        
        if (newIndex !== this.historyIndex) {
            this.historyIndex = newIndex;
            if (this.historyIndex < this.commandHistory.length) {
                input.value = this.commandHistory[this.historyIndex];
            } else {
                input.value = '';
            }
        }
    }
    
    setStatus(text, color = '#666') {
        const statusEl = document.getElementById('admin-status');
        if (statusEl) {
            statusEl.textContent = text;
            statusEl.style.color = color;
        }
    }
    
    show() {
        const panel = document.getElementById('admin-shell-panel');
        if (panel) {
            panel.style.display = 'flex';
            // Focus the input
            setTimeout(() => {
                const input = document.getElementById('admin-input');
                if (input) input.focus();
            }, 100);
        }
    }
    
    hide() {
        const panel = document.getElementById('admin-shell-panel');
        if (panel) {
            panel.style.display = 'none';
        }
    }
}