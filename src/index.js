import puppeteer from "puppeteer";
import Fastify from "fastify";
import fCors from "fastify-cors";
import PagePool from "./pagePool.js";

const fastify = Fastify({ logger: true });

fastify.register(fCors, {});

const pageCount = 5;
const headless = true;

const start = async () => {
  try {
    const browser = await puppeteer.launch({ headless });
    const pagePool = new PagePool(browser, pageCount);
    await pagePool.init();

    fastify.post("/translate", async (request, reply) => {
      const { items, str } = request.body;

      /** @type { Array<string> }  */
      const toArr = Object.keys(items);
      const from = Object.values(items)[0];
      const toLen = toArr.length;

      const result = [];

      const tasks = [];
      for (let i = 0; i < toLen; ++i) {
        tasks.push(toTranslate(pagePool, { from, to: toArr[i], text: str }));
      }

      const transArr = await Promise.all(tasks);
      result.push(...transArr);

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
 * @param { PagePool } pool
 * @param { { from: string, to: string, text: string } } param1
 * @returns { Promise<[string, string]> } // tuple
 */
async function toTranslate(pool, { from, to, text }) {
  if (from === to) {
    return [to, text];
  }

  const page = await pool.getPage();

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

  pool.releasePage(page);

  // get translated text
  return [to, transResult];
}
