export class Console {
    constructor() {
        this.output = document.getElementById('console-output');
        this.entries = [];
        this.filter = 'all';
        this.autoScroll = true;
        this.maxEntries = 1000;
    }
    
    log(level, message) {
        const entry = {
            timestamp: new Date().toISOString(),
            level: level || 'info',
            message: message || ''
        };
        
        this.entries.push(entry);
        if (this.entries.length > this.maxEntries) {
            this.entries.shift();
        }
        
        this.render(entry);
    }
    
    render(entry) {
        if (!this.shouldShow(entry)) return;
        
        const div = document.createElement('div');
        div.className = 'console-entry';
        div.innerHTML = `
            <span class="timestamp">[${entry.timestamp}]</span>
            <span class="level-${entry.level}">${entry.level.toUpperCase()}</span>
            <span class="message">${this.escapeHtml(entry.message)}</span>
        `;
        
        // Make clickable for copy
        div.addEventListener('click', () => {
            const text = `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`;
            navigator.clipboard?.writeText(text).catch(() => {});
            div.style.backgroundColor = '#2a2a2a';
            setTimeout(() => { div.style.backgroundColor = ''; }, 200);
        });
        
        this.output.appendChild(div);
        
        if (this.autoScroll) {
            this.output.scrollTop = this.output.scrollHeight;
        }
    }
    
    shouldShow(entry) {
        if (this.filter === 'all') return true;
        return entry.level === this.filter;
    }
    
    setFilter(filter) {
        this.filter = filter;
        this.refresh();
    }
    
    refresh() {
        this.output.innerHTML = '';
        for (const entry of this.entries) {
            if (this.shouldShow(entry)) {
                this.render(entry);
            }
        }
    }
    
    clear() {
        this.entries = [];
        this.output.innerHTML = '';
    }
    
    copyAll() {
        const text = this.entries.map(e => 
            `[${e.timestamp}] ${e.level.toUpperCase()}: ${e.message}`
        ).join('\n');
        
        navigator.clipboard?.writeText(text).catch(() => {});
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}