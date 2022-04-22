import puppeteer from "puppeteer";
import PagePool from "./pagePool.js";

const start = async (pageCount = 10, headless = true) => {
  const browser = await puppeteer.launch({ headless });
  const pagePool = new PagePool(browser, pageCount);
  await pagePool.init();

  /**
   * @param { string } text
   * @param { { from: string, to: string } } param2
   * @returns { Promise<{ from: string, to: string, text: string }> }
   */
  return async function (text, { from, to }) {
    if (from === to) {
      return { from, to, text };
    }
    const page = await pagePool.getPage();

    await page.evaluate(
      ([from, to, text]) => {
        location.href = `?sl=${from}&tl=${to}&text=${encodeURIComponent(text)}`;
      },
      [from, to, text]
    );
    // translating...
    await page.waitForSelector(`span[lang=${to}]`);

    /** @type { string } */
    let transResult = await page.evaluate(
      (to) =>
        // @ts-expect-error
        document.querySelectorAll(`span[lang=${to}]`)[0].innerText,
      to
    );

    if (transResult.endsWith(".")) {
      transResult = transResult.replace(/\.$/, "");
    }

    pagePool.releasePage(page);

    return { text: transResult, from, to };
  };
};

export default start;
