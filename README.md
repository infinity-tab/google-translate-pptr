# Automatic translate utility based on puppeteer

## Installation

```bash
npm add github:infinity-tab/google-translate-pptr
```


### Translate

#### Translate(browser, [opts])

| Param | Type | Description |
| --- | --- | --- |
| browser | <code>Browser</code> | Browser instance of puppeteer |
| [opts.pageCount] | <code>Number</code> | How many page uses |
| [opts.tld] | <code>String</code> | Google translate website suffix |


### translate

#### translate(fromText, opts)

| Param | Type | Description |
| --- | --- | --- |
| fromText | <code>String</code> | What text you want translate |
| [opts.from] | <code>String</code> | Language code of text you want translate |
| [opts.to] | <code>String</code> | Language code you want translate to |


Basic usage

```javascript
import puppeteer from "puppeteer"
import Translate from "google-translate-pptr";

const start = async ()=>{
  const browser = await puppeteer.launch()
  const translate = await Translate(browser, { pageCount: 10, tld: "cn" })

  const resultText = await translate("Hello", {from: 'en', to: 'zh-CN'}) // 你好
}

start()
```



