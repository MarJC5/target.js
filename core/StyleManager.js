export class StyleManager {
    constructor() {
        this.styles = new Map();
        this.injectedLinks = new Set();
    }

    /**
     * Removes all styles and linked styles from the document head.
     */
    removeAllStyles() {
        for (const key of this.styles.keys()) {
            this.removeStyle(key);
        }

        for (const href of this.injectedLinks) {
            this.removeInjectedLinkedStyle(href);
        }
    }

    /**
     * Adds or updates a style element in the document head.
     * @param {string} key - A unique identifier for the target-related style.
     * @param {object} css - The CSS rules to be applied.
     */
    addStyle(key, css, hash, scoped = false) {
        if (this.isStyleLoaded(key)) {
            return;
        }
        
        const styleElement = document.createElement('style');
        styleElement.setAttribute('data-style-key', key + '-' + hash);
        document.head.appendChild(styleElement);
        this.styles.set(key, styleElement);
    
        let cssString = '';
    
        Object.entries(css).forEach(([selector, rules]) => {
            if (selector.startsWith('@media')) {
                cssString += `${selector} { ${this.processRules(rules, hash, scoped)} }`;
            } else {
                if (scoped) {
                    selector = this.prefixSelector(selector, hash);
                }
                cssString += `${selector} { ${rules.replace(/\s*([:;,{])\s*/g, '$1')} }`;
            }
        });
    
        styleElement.innerHTML = cssString;
    }
    
    processRules(rules, hash, scoped) {
        return Object.entries(rules).map(([selector, rule]) => {
            rule = rule.replace(/\s*([:;,{])\s*/g, '$1');
            if (scoped) {
                selector = this.prefixSelector(selector, hash);
            }
            return `${selector} { ${rule} }`;
        }).join(' ');
    }
    
    prefixSelector(selector, hash) {
        return selector.split(',').map(sel => sel.trim() + '-' + hash).join(', ');
    }

    /**
     * Removes a style element from the document head.
     * @param {string} key - The unique identifier for the target-related style to be removed.
     */
    removeStyle(key) {
        const styleElement = document.querySelector(`style[data-style-key="${key}"]`);
        
        console.log('Removing style:', key);
        if (styleElement) {
            document.head.removeChild(styleElement);
            this.styles.delete(key);
        }
    }

    /**
     * Loads a CSS file and adds it to the document head as a linked stylesheet.
     * @param {string} filename - The name of the CSS file to load.
     */
    loadLinkedStyle(filename) {
        if (this.isLinkedStyleLoaded(filename)) {
            return;
        }

        const styleElement = document.createElement('link');
        styleElement.rel = 'stylesheet';
        styleElement.href = new URL(filename, import.meta.url).href;
        styleElement.setAttribute('data-style-key', filename);
        document.head.appendChild(styleElement);
        this.injectedLinks.add(styleElement.href);
    }

    /**
     * Removes a linked stylesheet from the document head.
     * @param {string} filename - The name of the CSS file to remove.
     */
    removeLinkedStyle(filename) {
        const href = new URL(filename, import.meta.url).href;
        const styleElement = document.querySelector(`link[data-style-key="${filename}"]`);
        if (styleElement) {
            document.head.removeChild(styleElement);
            this.injectedLinks.delete(href);
        }
    }

    /**
     * Injects an external linked stylesheet into the document head.
     * @param {string} rel - The relationship between the current document and the linked stylesheet.
     * @param {string} href - The URL of the linked stylesheet.
     * @param {string} crossorigin - The crossorigin attribute for the link element.
     */
    injectLinkedStyle(href = '', rel = '', crossorigin = '') {
        if (this.isInjectedLinkedStyleLoaded(href)) {
            return;
        }

        const styleElement = document.createElement('link');
        styleElement.rel = rel;
        styleElement.href = href;
        if (crossorigin) {
            styleElement.setAttribute('crossorigin', '');
        }
        styleElement.setAttribute('data-style-key', href);
        document.head.appendChild(styleElement);
        this.injectedLinks.add(href);
    }

    /**
     * Removes an injected linked stylesheet from the document head.
     * @param {string} href - The URL of the linked stylesheet.
     */
    removeInjectedLinkedStyle(href = '') {
        const styleElement = document.querySelector(`link[data-style-key="${href}"]`);
        if (styleElement) {
            document.head.removeChild(styleElement);
            this.injectedLinks.delete(href);
        }
    }

    /**
     * Checks if a style is already loaded.
     * @param {string} key - The unique identifier for the target-related style.
     * @returns {boolean} - A boolean indicating whether the style is already loaded.
     */
    isStyleLoaded(key) {
        return this.styles.has(key) || document.querySelector(`style[data-style-key="${key}"]`) !== null;
    }

    /**
     * Checks if a linked stylesheet is already loaded.
     * @param {string} filename - The name of the CSS file.
     * @returns {boolean} - A boolean indicating whether the linked stylesheet is already loaded.
     */
    isLinkedStyleLoaded(filename) {
        const href = new URL(filename, import.meta.url).href;
        return this.injectedLinks.has(href) || document.querySelector(`link[data-style-key="${filename}"]`) !== null;
    }

    /**
     * Checks if an injected linked stylesheet is already loaded.
     * @param {string} href - The URL of the linked stylesheet.
     * @returns {boolean} - A boolean indicating whether the linked stylesheet is already loaded.
     */
    isInjectedLinkedStyleLoaded(href) {
        return this.injectedLinks.has(href) || document.querySelector(`link[data-style-key="${href}"]`) !== null;
    }
}
