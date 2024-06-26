import { HTTPRequest } from "@utils/HTTPRequest";
import { StyleManager } from "@core/StyleManager";
import config from "@/target.config";

/**
 * Utility function to render a target into a DOM container.
 * After rendering the target's output into the container, it triggers the targetDidMount lifecycle method.
 *
 * @param {Target} target - The target instance to be rendered.
 * @param {HTMLElement} container - The DOM element where the target should be rendered.
 */
const render = (target, container) => {
  const output = target.render();
  container.innerHTML = output;
  target.targetDidMount();
};

/**
 * Base class for creating targets.
 * It provides lifecycle methods, state management, and a fetch utility for API requests.
 */
class Target {
  /**
   * Target constructor.
   * Initializes the target with properties, state, and a container.
   *
   * @param {Object} props - Initial properties of the target passed as an object.
   * @param {HTMLElement} container - The container in which the target should be rendered.
   */
  constructor(props, container) {
    this.props = props;
    this.state = {};
    this.container = container;
    this.parent = null;
    this.api = null;
    this.isMounted = false;
    this.styleManager = new StyleManager();
    this.hash = this.generateRandomHash();
    this.styleId = this.container.getAttribute("data-target-name");

    if (config.logger && config.dev && config.dev && this.container) {
      this.log("Initialized target", {
        state: this.state,
        props: this.props,
        container: this.container,
      });
    }
  }

  /**
   * Logs messages with different colors for each type of message.
   *
   * @param {string} message - The log message.
   * @param {Object} context - Additional context for the log.
   * @param {string} color - The color for the log message.
   */
  log(message, context = {}) {
    const colors = {
      "Initialized target": "color: #f0fdf4; font-weight: bold",
      "Target will mount": "color: #dcfce7; font-weight: bold",
      "Target did mount": "color: #bbf7d0; font-weight: bold",
      "Target has mounted": "color: #86efac; font-weight: bold",
      "Target did update": "color: #4ade80; font-weight: bold",
      "Target updated": "color: #22c55e; font-weight: bold",
      "Target will unmount": "color: #fb7185; font-weight: bold",
      "Unmounting target": "color: #f43f5e; font-weight: bold",
      "Created nested target": "color: #06b6d4; font-weight: bold",
    };

    const titleColor = colors[message] || "color: #166534; font-weight: bold";
    console.groupCollapsed(
      `%c[${this.constructor.name} -> ${this.hash}]%c ${message}`,
      titleColor,
      "color: #f0fdf4"
    );
    console.log("State:", this.state);
    console.log("Props:", this.props);
    console.log("Container:", this.container);
    Object.entries(context).forEach(([key, value]) => {
      console.log(`${key}:`, value);
    });
    console.groupEnd();
  }

  /**
   * Initializes the target by extracting data attributes from the container.
   * To clean up the container, it removes the data attributes after extracting them.
   */
  initialize() {
    this.container.querySelectorAll("[data-target-name]").forEach((el) => {
      Object.keys(el.dataset).forEach((key) => {
        this.props[key] = el.dataset[key];
        el.removeAttribute(`data-${key}`);
      });
    });

    // Add comments with the target name for debugging purposes
    if (config.logger && config.dev) {
      const start = document.createComment(`Start of ${this.constructor.name} - ${this.hash}`);
      const end = document.createComment(`End of ${this.constructor.name} - ${this.hash}`);
      this.container.prepend(start);
      this.container.append(end);
    }
  }

  /**
   * Generate Random Hash
   * @returns {string} - A random hash string.
   */
  generateRandomHash() {
    return (
      Math.random().toString(36).substring(2, 6) +
      Math.random().toString(36).substring(2, 6)
    );
  }

  /**
   * Get the hash value.
   * @returns {string} - The hash value.
   */
  getHash() {
    return this.hash;
  }

  /**
   * Get data-target-name from the container.
   * @returns {string} - The name of the target.
   */
  getTargetName() {
    return this.container.getAttribute("data-target-name");
  }

  /**
   * Get yield data from the parent target.
   * @param {string} targetName - The name of the parent target.
   * @returns {Object} - The yield data from the parent target.
   */
  getNestedTargets(nestedTargets) {
    if (nestedTargets) {
      return nestedTargets
        .map((target) => {
          const { name, config } = target;
          const element = document.createElement(config.container);
          element.setAttribute("data-target-name", name);
          if (config.containerClass) {
            element.classList.add(...config.containerClass);
          }
          if (config.data) {
            Object.entries(config.data).forEach(([dataKey, dataValue]) => {
              element.setAttribute(`data-${dataKey}`, dataValue);
            });
          }
          return element.outerHTML;
        })
        .join(" ");
    }
    return "";
  }

  /**
   * Sets the parent container of the target.
   */
  setParent(parent) {
    this.parent = parent;
  }

  /**
   * Sets the target's state and triggers an update.
   *
   * @param {Object} newState - An object representing the new state of the target.
   */
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.update();
  }

  /**
   * Initializes a new HTTPRequest object for API calls.
   *
   * @param {string} apiURL - The base URL for the API.
   * @param {Object} defaultURLParams - Default URL parameters as an object.
   * @param {Object} defaultHeaders - Default headers for the API requests as an object.
   * @returns {HTTPRequest} - An instance of HTTPRequest configured for API interactions.
   */
  fetch(apiURL, defaultURLParams = {}, defaultHeaders = {}) {
    this.api = new HTTPRequest(apiURL, defaultURLParams, defaultHeaders);
    return this.api;
  }

  /**
   * A lifecycle method called before the target is first rendered.
   * To be overridden in subclasses as needed.
   */
  targetWillMount() {
    if (config.logger && config.dev && this.container) {
      this.log("Target will mount");
    }
  }

  /**
   * A lifecycle method called after the target is first rendered.
   * To be overridden in subclasses as needed.
   */
  targetDidMount() {
    if (config.logger && config.dev && this.container) {
      this.log("Target has mounted");
    }
  }

  /**
   * A lifecycle method called after the target's state is updated.
   * To be overridden in subclasses as needed.
   */
  targetDidUpdate() {
    if (config.logger && config.dev && this.container) {
      this.log("Target did update");
    }
  }

  /**
   * A lifecycle method called before the target is unmounted.
   * To be overridden in subclasses as needed.
   */
  targetWillUnmount() {
    if (config.logger && config.dev && this.container) {
      this.log("Target will unmount");
    }
  }

  /**
   * Renders the target's HTML.
   * Should be overridden by subclasses to return HTML as a string.
   *
   * @returns {string} - HTML string representing the target's UI.
   */
  render() {
    if (config.logger && config.dev && this.container) {
      this.log("Rendering target");
    }
    return "";
  }

  /**
   * Updates the target by re-rendering its content and managing lifecycle hooks.
   */
  update() {
    if (this.container) {
      if (!this.isMounted) {
        this.targetWillMount();
      }
      this.container.innerHTML = this.render();
      if (!this.isMounted) {
        this.targetDidMount();
        this.isMounted = true;
      }
      this.targetDidUpdate();
    }

    if (config.logger && config.dev && this.container) {
      this.log("Target updated");
    }
  }

  /**
   * Clears the target's content from its container.
   */
  unmount() {
    if (config.logger && config.dev && this.container) {
      this.log("Unmounting target");
    }
    this.styleManager.removeAllStyles();
    this.container.innerHTML = "";
  }

  /**
   * Completely removes the target and cleans up resources.
   */
  destroy() {
    if (config.logger && config.dev && this.container) {
      this.log("Destroying target");
    }
    this.unmount();
    this.container = null;
  }

  /**
   * Parse yield data from the parent target.
   */
  yieldElementString(yieldElements) {
    return  JSON.stringify(yieldElements).replace(
      /"/g,
      "&quot;"
    );;
  }

  /**
   * Escapes HTML to prevent XSS attacks, optionally allowing certain tags.
   *
   * @param {string} str - The string to escape.
   * @param {boolean} [allowTags=false] - Whether to allow certain HTML tags.
   * @returns {string} - The escaped HTML string.
   */
  static escapeHTML(str, allowTags = false) {
    if (typeof str === "number") {
      str = str.toString();
    }

    if (typeof str !== "string") {
      console.error("escapeHTML: Argument is not a string.");
      return "";
    }

    if (allowTags) {
      // Allow certain HTML tags
      const allowedTags = {
        b: [],
        i: [],
        u: [],
        s: [],
        a: ["href", "title"],
        code: [],
        pre: [],
        blockquote: [],
        ul: [],
        ol: [],
        li: [],
        h1: [],
        h2: [],
        h3: [],
        h4: [],
        h5: [],
        h6: [],
        p: [],
        br: [],
        hr: [],
        table: [],
        thead: [],
        tbody: [],
        tfoot: [],
        tr: [],
        th: [],
        td: [],
        div: [],
        span: [],
      };

      // Regex to match allowed tags and their attributes
      const tagRegex = /<\/?([a-zA-Z]+)([^>]*)>/g;
      const attrRegex = /([a-zA-Z]+)="([^"]*)"/g;

      return str.replace(tagRegex, (fullTag, tagName, attrs) => {
        if (allowedTags[tagName]) {
          // Allow only specified attributes
          let safeAttrs = "";
          let match;
          while ((match = attrRegex.exec(attrs)) !== null) {
            const attrName = match[1];
            const attrValue = match[2];
            if (allowedTags[tagName].includes(attrName)) {
              safeAttrs += ` ${attrName}="${Target.escapeHTML(attrValue)}"`;
            }
          }
          return `<${
            fullTag.startsWith("</") ? "/" : ""
          }${tagName}${safeAttrs}>`;
        } else {
          // Escape the whole tag if it's not allowed
          return fullTag.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        }
      });
    } else {
      // Escape all HTML tags
      return str.replace(
        /[&<>"']/g,
        (tag) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          }[tag])
      );
    }
  }

  /**
   * Parses a template string with placeholders, replacing them with provided values.
   *
   * @param {string} template - The template string containing placeholders.
   * @param {Object} placeholders - An object mapping placeholders to their values.
   * @returns {string} - The resulting string with placeholders replaced by actual values.
   */
  static parseHTML(template, placeholders = {}) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      if (typeof placeholders[key] !== "undefined") {
        if (key === "content") {
          return Target.escapeHTML(placeholders[key], true); // Allow certain HTML tags
        } else {
          return Target.escapeHTML(placeholders[key]);
        }
      }
      return match; // leave the placeholder intact
    });
  }

  /**
   * Helper function to minify HTML strings.
   *
   * @param {string} html - The HTML string to minify.
   * @returns {string} - The minified HTML string.
   */
  static minifyHTML = (html) => {
    return html.replace(/\s+/g, " ").trim();
  };

  /**
   * Adds a suffix to all class names in an HTML string.
   * This function is useful for scoping CSS to a specific target.
   * @param {string} html - The HTML string to modify.
   * @param {string} suffix - The suffix to add to each class name.
   * @returns {string} - The modified HTML string with suffixed class names.
   * @example
   * // Returns '<div class="my-class-suffix"></div>'
   */

  static scopeCSS(html, suffix) {
    return html.replace(/class="([^"]*)"/g, (match, classNames) => {
      const suffixedClassNames = classNames
        .split(" ")
        .map((className) => `${className}-${suffix}`)
        .join(" ");
      return `class="${suffixedClassNames}"`;
    });
  }

  /**
   * Converts a dataset object to a regular object.
   * This function is useful for handling HTML data attributes.
   * @param {Object} data - The dataset object to convert.
   * @returns {Object} - A new object where each property corresponds to a data attribute.
   */
  static dataToObject = (data) => {
    if (!data) return {};

    return Object.entries(data).reduce((acc, [key, value]) => {
      if (value === "true" || value === "false") {
        acc[key] = value === "true";
      } else if (!isNaN(value)) {
        acc[key] = Number(value);
      } else if (value.startsWith("{") && value.endsWith("}")) {
        try {
          acc[key] = JSON.parse(value);
        } catch (e) {
          acc[key] = value;
        }
      } else {
        acc[key] = value;
      }
      return acc;
    }, {});
  };
}

export { render, Target };
