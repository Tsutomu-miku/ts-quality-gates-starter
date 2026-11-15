---
name: project-bootstrap
description: 新项目初始化、TypeScript 代码质量门配置与存量项目加固。init 从版本化模板拉起并裁剪 TS 库/MCP 服务/Web/Node CLI；harden 先只读审计差距，再经授权分级注入门禁。用于初始化器/加固器，不替代日常功能开发。
---

# Project Bootstrap

这是初始化器和加固器。规则权威来源是公开 MIT 模板
[ts-quality-gates-starter](https://github.com/Tsutomu-miku/ts-quality-gates-starter)，
本技能对应 **v1.0.0**（模板根 `template.json` 的 version）。
只拉起、裁剪、解释和协调采用；不要在技能中复制维护规则全文。

前提：Node 22.13+（22.x）、24.x 或 26+，npm，Git，公网 GitHub/npm。
先确认 `node`、`npm`、`git` 可用及版本满足模板 engines。无需 Chrome、
浏览器登录、内部服务、全局 npm 包。遵守当前项目的终端与包管理器约定。

## init <项目目录> [类型]

适用：创建新目录或确认空目录。类型为 `ts-library`（默认）、`mcp-service`、
`web`、`node-cli`。若用户说中文类型，映射到这些参数。目录非空时改走 harden，
不要覆盖应用或删除其 Git 历史。

1. 从模板 **v1.0.0** tag 下载/clone 到临时目录，读取该版本 README、AGENTS
   和 `docs/quality-gates.md`；核对 tag 的 commit 与 `template.json`。记录来源
   commit 供交付，不悄悄改用 main。下载失败时说明错误，不用旧缓存冒充最新。
2. 将版本化模板文件（含点文件）复制到目标，排除模板 `.git`、依赖和构建产物。
   先在目标 `npm ci --registry=https://registry.npmjs.org` 安装模板工具链，
   再用目标的有效小写包名运行：
   `node tools/instantiate.mjs --name <项目名> --type <类型>`。
   此工具执行变量替换与对应分层裁剪。保留 MIT 与 NOTICE 来源归属。
3. 在目标运行 `npm ci --registry=https://registry.npmjs.org`。新目录用 `git init`
   建本地仓后运行 `npm run hooks:install`；不擅自创建远程或发布包。
   若已有 Git/hook 管理，先检查所有者，集成现有 hook，避免覆盖。
4. 运行 `npm run check`；按选定类型解释剩余接入项。MCP 没有 SDK/运行中的
   服务，Web 没有 UI/打包器；不要声称已交付这些应用能力。
5. 回报目录、类型、模板版本/commit、检查与 hook 结果，并说明：
   **`npm run check` 即合同前自检。**

下载方式可选 Git tag clone 或 release tag archive；`gh repo create --template`
只在用户要求新建远程时使用。`npx degit` 是可选第三方复制器，模板不是 npm 包。

## harden <项目目录>

先阅读模板 v1.0.0 的 [docs/harden.md](https://github.com/Tsutomu-miku/ts-quality-gates-starter/blob/v1.0.0/docs/harden.md)。
用单独临时模板工具链安装依赖；**首次只读，不在目标装依赖、装 hook、改配置或重构**。

1. 读取目标 AGENTS、package/lock、lint、依赖检查、tsconfig、hook 与 CI 配置，
   基线现有脚本。可从临时模板根运行
   `node tools/audit-project.mjs <目标绝对路径>`。
   该工具只读，输出超长文件、空 catch/空兜底、平台语法和字面量跨层 import
   候选。按真实所有者补查自定义路径、alias、生命周期；区分实测与推断。
2. 输出差距清单、现有债务、误报候选、分级步骤、具体将改哪些文件、验证和回滚。
   **默认 gate 是停在报告，等用户针对具体采用范围授权后再写。** 若当前任务已经
   明确授权同样的具体阶段，不重复索要许可。仅说“审计/看看”不授权写入。
3. 获授权后按模板的 staged adoption guide 合并：先非冲突工具/说明，再映射
   依赖与增量门，最后逐项转阻断。保留现有包管理器、锁文件、hook 和业务边界。
   不一次性大重构、不机械改目录、不把旧债务作为全局忽略。
4. 每个获准阶段运行原有回归与新增门的正反例，交付实际通过项和剩余债务。

## 升级

模板是规则唯一维护处。升级时先比较已记录的模板版本/commit 与目标新 release，
阅读变更，审查工具/配置/策略测试差异，协调项目本地定制，再验证正例和反例。
更新项目来源记录以及本技能的对应版本；不要重新复制模板覆盖现存项目。
未审阅新 release 时继续 pin v1.0.0，并准确说明该版本范围。
