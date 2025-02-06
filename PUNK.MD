新增自定义RPC方法
## 版本
- v5.7.2
## 代码修改位置
- 源码：
   - 具体实现：packages/providers/src.ts/base-provider.ts
   - 接口定义：packages/abstract-provider/src.ts/index.ts
   - 方法注册：packages/providers/src.ts/fallback-provider.ts
- 测试：packages/tests/src.ts/test-providers.ts :724
   
## 执行测试
```shell
 FAUCET_PRIVATEKEY="YOU_PRIVATEKEY_FORTEST"  npm run test-punkos

```