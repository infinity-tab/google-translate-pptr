# google-translate-pptr

```javascript

import Translate from "google-translate-pptr";


const start = async ()=>{
  // must initialize first
  const translate = await Translate()


  await translate("Hello", {from: 'en', to: 'zh-CN'})
  // 你好
  
}

start()

```



