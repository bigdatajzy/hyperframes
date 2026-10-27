# 简体中文 Studio（本地分支）

基于上游 v0.8.206。界面默认简体中文，右上角可选择 English；偏好保存在当前 Studio 来源的 localStorage，切换时重新加载，请先结束正在进行的操作。工作台改变端口后将采用新来源的默认中文。

本轮覆盖常用面板、时间线按钮、设计属性和渲染操作的静态界面词条；未收录的复杂提示和诊断保留英文。素材名称、用户文本、文件路径、时间线标识、HTML 内容和导出画面不会经过翻译函数。

词条位于 packages/studio/src/i18n/zh-CN.ts，英文为稳定查找键。新增 UI 文案在渲染位置调用 t()，不要翻译状态值、命令或用户内容。此分支不使用在线翻译，不增加云端费用。

## 构建

使用 Bun 安装依赖后，在仓库根目录执行 bun run build。随后修改词条可执行 bun run --cwd packages/studio build，再执行 bun run --cwd packages/cli build 将 Studio 拷入 CLI 发布目录。生产入口为 packages/cli/bin/hyperframes.mjs。

工作台可通过 HYPERFRAMES_LOCAL_CLI 环境变量指定该入口；不设置时使用工作台自身安装的引擎。请保持 CLI 与工作台约定版本一致。
