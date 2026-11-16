# 初见雷达

选一张单人人像，查看这张照片带来的第一印象与五项照片观察。也可以直接打开示例报告并下载分享卡。

## 本地体验

用浏览器打开 `docs/index.html`，点「先看示例」。也可在项目根目录执行：

```sh
python3 -m http.server 8765 --bind 127.0.0.1 --directory docs
```

浏览器访问 `http://127.0.0.1:8765/`。本地版本支持查看示例、下载分享卡和预览本人照片。在线 AI 需要先部署下方的接口。

## 发布

GitHub Pages 提供静态页面，Cloudflare Worker 通过 AI binding 调用千问 Qwen3.8 27B，校验报告后返回。照片和报告不写入本站存储。

### 免费调用

当前账户保持 Workers Free。Workers AI 每日有 10,000 Neurons 免费额度，耗尽后拒绝调用，北京时间上午 8 点重置。本站额外限制每日 50 次模型请求，每个来源 IP 每分钟 3 次。每日次数按北京时间零点重置。模型实际可用次数也取决于共享免费额度。

### 发布测评接口

在 Cloudflare 免费账户下使用 Wrangler 登录并部署 `worker/wrangler.jsonc`。配置中的 AI binding 提供模型访问，`SITE_ORIGIN` 指定 GitHub Pages 来源。通过同名 Worker 更新部署。

[免费额度](https://developers.cloudflare.com/workers-ai/platform/pricing/) · [模型说明](https://developers.cloudflare.com/workers-ai/models/qwen3.8-27b/)

### 3. 发布 GitHub Pages

1. 把 `docs/config.js` 中的 `RADAR_API_URL` 设为 Wrangler 返回的 Worker HTTPS 地址加 `/analyze`。
2. 推送源码到 GitHub 仓库的 `main` 分支。
3. 在仓库的 **Settings → Pages** 选择 **Deploy from a branch**，分支选 **main**，目录选 **/docs**，保存。
4. GitHub 给出网址后，打开示例并保存分享卡。再用一张获准使用的单人照片实测，确认拿到标有「AI 分析」的报告。

[GitHub Pages 发布来源配置](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) · [Cloudflare Worker 密钥设置](https://developers.cloudflare.com/workers/configuration/secrets/)

## 示例照片

[Michael Dam / Unsplash](https://unsplash.com/photos/mEZ3PoFGs_k)。示例文案为人工撰写。
