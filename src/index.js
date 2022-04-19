import puppeteer from "puppeteer";
import Fastify from "fastify";
import fCors from "fastify-cors";
import PagePool from "./pagePool.js";

const fastify = Fastify({ logger: true });

fastify.register(fCors, {});

const start = async () => {
  try {
    const browser = await puppeteer.launch();
    const pagePool = new PagePool(browser);
    await pagePool.init();

    fastify.post("/translate", async (request, reply) => {
      const { items, str } = request.body;

      /** @type { Array<string> }  */
      const toArr = Object.keys(items);
      const from = Object.values(items)[0];
      const toLen = toArr.length;

      const { pageCount } = pagePool;

      const result = [];

      const splitCount = Math.floor(toLen / pageCount);

      for (let i = 0; i < splitCount; ++i) {
        const tasks = [];

        for (let toIndex = 0; toIndex < pageCount; ++toIndex) {
          const page = pagePool.getPage();

          const to = toArr[toIndex + i * pageCount];

          tasks.push(toTranslate(page, { from, to, text: str }));
        }

        const transArr = await Promise.all(tasks);
        result.push(...transArr);
      }

      const restCount = toLen % pageCount;

      if (restCount > 0) {
        const tasks = [];
        for (let toIndex = pageCount * splitCount; toIndex < toLen; ++toIndex) {
          const page = pagePool.getPage();
          const to = toArr[toIndex];
          tasks.push(toTranslate(page, { from, to, text: str }));
        }
        const transArr = await Promise.all(tasks);
        result.push(...transArr);
      }

      const data = result.reduce((_, [to, text]) => {
        _[to] = text;
        return _;
      }, {});

      return {
        code: 0,
        data,
        totalCount: toArr.length,
        count: result.length,
      };
    });

    await fastify.listen(3000);
    console.info(`server is run on 127.0.0.1:${3000}}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

/**
 *
 * @param { import('puppeteer').Page } page
 * @param { { from: string, to: string, text: string } } param1
 * @returns { Promise<[string, string]> } // tuple
 */
async function toTranslate(page, { from, to, text }) {
  if (from === to) {
    return [to, text];
  }

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

  // get translated text
  return [to, transResult];
}
