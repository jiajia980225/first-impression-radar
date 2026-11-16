# 初见雷达

选一张单人人像，查看这张照片带来的第一印象与五项照片观察。也可以直接打开示例报告并下载分享卡。

## 本地体验

用浏览器打开 `docs/index.html`，点「先看示例」。也可在项目根目录执行：

```sh
python3 -m http.server 8765 --bind 127.0.0.1 --directory docs
```

浏览器访问 `http://127.0.0.1:8765/`。本地版本支持查看示例、下载分享卡和预览本人照片。在线 AI 需要先部署下方的接口。

## 发布

GitHub Pages 提供静态页面。Cloudflare Worker 保存密钥、转发照片并校验模型返回的报告。照片和报告不写入本站的存储。耐久对象只记录按日统计的请求次数，限流绑定服务按来源 IP 限流。

### 1. 开通阿里云百炼

登录 [阿里云百炼](https://bailian.console.aliyun.com/)，选择 **华北2（北京）**。在该业务空间创建 API Key，并记下业务空间 ID。在配置文件里只使用业务空间 ID，API Key 通过 Worker 的 Secret 设置。

- [API Key 获取方式](https://help.aliyun.com/zh/model-studio/get-api-key)
- [业务空间专属域名](https://help.aliyun.com/zh/model-studio/regions)
- [千问 Qwen3.6 Plus](https://help.aliyun.com/zh/model-studio/qwen3-6-plus)

### 2. 发布测评接口

登录 [Cloudflare 控制台](https://dash.cloudflare.com/)，启用 Workers。在 `worker/wrangler.jsonc` 填写：

- `SITE_ORIGIN` 为 `https://你的用户名.github.io`，只填来源域名。
- `DASHSCOPE_WORKSPACE_ID` 为百炼北京业务空间 ID。
- `DAILY_LIMIT` 为全站每天允许请求模型的次数，默认 50，北京时间零点重置。每个来源 IP 每分钟初始限 3 次。

使用 Node.js 和 Wrangler 部署，运行如下：

```sh
cd worker
npx wrangler login
npx wrangler deploy
npx wrangler secret put DASHSCOPE_API_KEY
```

在最后一条命令的交互提示中粘贴百炼 API Key。也可以在 Cloudflare 的 Worker 设置中添加同名的 Secret。请勿把密钥写进源代码、静态资源、终端命令或聊天。

### 3. 发布 GitHub Pages

1. 把 `docs/config.js` 中的 `RADAR_API_URL` 设为 Wrangler 返回的 Worker HTTPS 地址加 `/analyze`。
2. 推送源码到 GitHub 仓库的 `main` 分支。
3. 在仓库的 **Settings → Pages** 选择 **Deploy from a branch**，分支选 **main**，目录选 **/docs**，保存。
4. GitHub 给出网址后，打开示例并保存分享卡。再用一张获准使用的单人照片实测，确认拿到标有「AI 分析」的报告。

[GitHub Pages 发布来源配置](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) · [Cloudflare Worker 密钥设置](https://developers.cloudflare.com/workers/configuration/secrets/)

## 示例照片

[Michael Dam / Unsplash](https://unsplash.com/photos/mEZ3PoFGs_k)。示例文案为人工撰写。
