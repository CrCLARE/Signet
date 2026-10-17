import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";
import { tabsMarkdownPlugin } from "vitepress-plugin-tabs";

// 引入拆分的配置
import shared from "./shared.mts";
import zh from "./zh.mts";
import en from "./en.mts";

export default withMermaid(
  defineConfig({
    ...shared,

    // 把 docs/zh/ 映射到根路径
    rewrites: {
      "zh/:rest*": ":rest*",
    },

    locales: {
      // root 就是根路径 /，把中文配置展开在这里
      root: {
        ...zh,
        link: "/",
      },
      // 英文挂在 /en 下
      en: {
        ...en,
        link: "/en/",
      },
    },

    markdown: {
      // 继承 shared 里的 html: false
      ...shared.markdown,
      config(md) {
        md.use(tabsMarkdownPlugin);
        // 如果以后需要 mermaid 的 markdown 语法扩展，也可以放这里
      },
    },
  })
);
