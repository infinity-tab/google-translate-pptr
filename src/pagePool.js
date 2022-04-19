export default class PagePool {
  _pages = [];
  _pagesInUse = [];
  constructor(browser, pageCount = 5, tld = "cn") {
    this.pageCount = pageCount;
    this.browser = browser;
    this.tld = tld;
  }
  async init() {
    this._pages = await Promise.all(
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

  /**
   *
   * @returns { import('puppeteer').Page }
   */
  getPage() {
    if (this._pages.length === 0) {
      this._pages = this._pagesInUse;
      this._pagesInUse = [];
    }
    const page = this._pages.pop();
    this._pagesInUse.push(page);
    return page;
  }
}
