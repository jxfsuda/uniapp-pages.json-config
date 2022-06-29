# uniapp-pages.json-config
uniapp pages.json 管理工具 vite插件版
注意,项目需要先有一个可运行的pages.json 否则项目无法运行,也就无法执行到vite.config
### 2022-06-29 修复热更新时,condition节点名称重复问题
### 2022-06-28 修复不设置tabbar时的执行错误
### 增加配置目录.js文件变更,触发重新组装,进而触发hbuilder差量编译.达到热更新的目的


```
// vite.config.js or vite.config.ts
import {
	defineConfig
} from "vite";
import uni from "@dcloudio/vite-plugin-uni"; 
import vitePluginReplaceUniappConfig from "./project-config/vite.uni-configs.js"  
 
export default defineConfig({
	plugins: [ 
		uni(), 
		vitePluginReplaceUniappConfig([{
			 node_env:process.env.NODE_ENV,
			 dir:  __dirname+"/project-config/pages.json/",  //配置文件放置的基础目录
			 replaceFile:  __dirname+"/pages.json", //要生成的文件路径
			 user: process.env.USER,  // unicloud 用户名，用于条件编译
			 rootDir:   process.env.UNI_INPUT_DIR //项目根目录
		}]) 
	]
});


```
在 {dir} 目录下,分别建立
condition easycom  globalStyle pages ....  目录 ,就是 pages.json中的第一级节点
每个目录里面至少有一个index.js  
内容为各自节点的数据
如 globalStyle/index.js 
```
   module.exports ={
		"navigationStyle": "default",
		"navigationBarTextStyle": "black",
		"navigationBarTitleText": "uni-app",
		"navigationBarBackgroundColor": "#F8F8F8",
		"backgroundColor": "#F8F8F8"
	}
```

对于像 pages 这样的 数组节点, index.js中放的是 首页以及部分内容
如:
```
module.exports = [
    	//pages数组中第一项表示应用启动页，参考：https://uniapp.dcloud.io/collocation/pages
    	{
    		"path": "pages/tabbar/index/index",
    		"style": {
    			"navigationBarTitleText": "发现"
    		}
    	},
    	{
    		"path": "pages/tabbar/tabbar-2/tabbar-2",
    		"style": {}
    	}, 
    ]
```
还可以放其他按照模块或者开发者名字的js 格式一致,这样达到团队开发不冲突的目的.

特殊:   名称带有 excludes 的文件, 发行时不合并
如: moduleA_excludes.js


