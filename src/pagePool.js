export default class PagePool {
  #pages = [];
  #pagesInUse = new WeakMap();

  #pageLockList = [];

  /**
   *
   * @param { import('puppeteer').Browser } browser
   * @param { number } [pageCount ]
   * @param { string } [tld]
   */
  constructor(browser, pageCount = 5, tld = "cn") {
    this.pageCount = pageCount;
    this.browser = browser;
    this.tld = tld;
  }

  async init() {
    this.#pages = await Promise.all(
      [...Array(this.pageCount)].map(() =>
        this.browser.newPage().then(async (page) => {
          await page.goto(`https://translate.google.${this.tld}/`, {
            waitUntil: "networkidle2",
          });
          return page;
        })
      )
    );
  }

  rCount = 0;
  /**
   * @param { import('puppeteer').Page } page
   */
  releasePage(page) {
    if (this.#pagesInUse.has(page)) {
      this.#pagesInUse.delete(page);
      this.#pages.push(page);

      if (this.#pageLockList.length > 0) {
        const [_, releaseLock] = this.#pageLockList.pop();
        releaseLock();
      }
    }
  }

  aCount = 0;
  /**
   *
   * @returns { Promise<import('puppeteer').Page> }
   */
  async getPage() {
    if (this.#pages.length === 0) {
      const [lock, releaseLock] = createPromise();
      this.#pageLockList.push([lock, releaseLock]);
      await lock;
    }

    const page = this.#pages.pop();
    this.#pagesInUse.set(page, 1);

    return page;
  }
}

function createPromise() {
  let resolve, reject;

  const p = new Promise((r1, r2) => {
    resolve = r1;
    reject = r2;
  });

  return [p, resolve, reject];
}
