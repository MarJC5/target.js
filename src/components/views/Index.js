import { Target } from "../Target.js";
import { HeadManager } from "../HeadManager.js";
import config from "../../../target.config.js";

class IndexPage extends Target {
  constructor(props, container) {
    super(props, container);
    this.state = {};
    this.head = new HeadManager(document.head);
  }

  targetDidMount() {
    this.head.setTitle("Home");
  }

  render() {
    const yieldElement = new Object({
      nestedTargets: {
        "hello-world": {
          container: "div",
          data: {
            name: "Target.js",
            api: JSON.stringify({
              url: config.api.baseURL + '/public/api/pages',
              endpoint: '/index.json',
              headers: JSON.stringify({
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              }),
            }),
          },
        },
      },
    })

    const html = `
      <div data-target-name="app" data-yield='${JSON.stringify(yieldElement)}'></div>
    `;

    return Target.parseHTML(html, {});
  }
}

export default IndexPage;