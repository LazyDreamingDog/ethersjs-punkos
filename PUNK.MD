新增自定义RPC方法
## 版本
- v5.7.2
## 代码修改位置
- 源码：
   - 具体实现：
      - 基类BaseProvider：packages/providers/src.ts/base-provider.ts
      - 父类JsonRpcProvider：packages/providers/src.ts/json-rpc-provider.ts
   - 接口定义：packages/abstract-provider/src.ts/index.ts
   - 方法注册：packages/providers/src.ts/fallback-provider.ts
      
- 测试：packages/tests/src.ts/test-providers.ts :724

providers类关系图
```mermaid
classDiagram
    class BaseProvider
    class JsonRpcProvider {
        +prepareRequest()
        +perform()
    }
    class UrlJsonRpcProvider
    class StaticJsonRpcProvider
    class FallbackProvider
    class WebSocketProvider
    class AlchemyProvider
    class CloudflareProvider
    class EtherscanProvider
    class InfuraProvider
    class PocketProvider

    BaseProvider <|-- JsonRpcProvider
    JsonRpcProvider <|-- UrlJsonRpcProvider
    JsonRpcProvider <|-- WebSocketProvider
    UrlJsonRpcProvider <|-- AlchemyProvider
    UrlJsonRpcProvider <|-- CloudflareProvider
    UrlJsonRpcProvider <|-- EtherscanProvider
    UrlJsonRpcProvider <|-- InfuraProvider
    UrlJsonRpcProvider <|-- PocketProvider
    UrlJsonRpcProvider <|-- StaticJsonRpcProvider
    BaseProvider <|-- FallbackProvider
   ```
   
## 执行测试
```shell
 FAUCET_PRIVATEKEY="YOU_PRIVATEKEY_FORTEST"  npm run test-punkos

```