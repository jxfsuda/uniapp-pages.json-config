/**
 *  
 */
var path = require("path")
var fs = require('fs');

class PluginLigic {

	constructor(node_env, dir, replaceFile,rootDir) {
		this.node_env = node_env
		this.dir = dir;
		this.replaceFile = replaceFile;
		this.rootDir = rootDir;
		this.errorText=[];
		this.releaseData = {}; //最终数据
	}

	process() {
		let files = fs.readdirSync(this.dir, 'utf-8');

		let fileMap = {}
		files.some((f) => {
			let p = this.dir + "/" + f;
			let stat = fs.lstatSync(p);
			if (stat.isDirectory()) {
				fileMap[f] = p;
			}
		})
	
		this.processNodes(fileMap)
	}


	processNodes(nodeMap) {
		for (let k in nodeMap) {
			try{
				if(k=="condition"){
					if (this.node_env == 'production') { //发行版 不导出条件编译 
						continue;
					}
				}
				let data = this.processNode(k, nodeMap[k]); 
				if(k=='condition'){
					data= {
						"current": 0,
						"list": data ||[]
					}
				}
				this.releaseData[k] = data || {"error":k+"节点解析返回undefined,请检查"}
			}catch(e){
				console.error("处理配置文件失败",k,nodeMap[k], e);
			} 
		}
		if(this.errorText.length>0){
			console.error("⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇");
		 
			console.warn("⧭配置被略过⧭请检查: "+ this.dir +"文件夹内 ⟱"); 
			console.warn("\t\t\t\t"+ this.errorText.join('\r\t\t\t'));
			 
			console.error("⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬⧬");
		
		}
		 console.log("pages.json 组装完毕")
	 	fs.writeFileSync(this.replaceFile, JSON.stringify(this.releaseData,null,4), { "flag": "w" });

	}

 

	processNode(moduleName, path) {
		let files = fs.readdirSync(path, 'utf-8');
		let returnVal = [];
		for(let key of files) { 
				if (key.indexOf('.js') < 0) continue; 
				// console.log("处理", this.node_env)
				let obj = require(path+"/"+ key)
				if (obj instanceof Array) { //是数组 
						if (key.indexOf('excludes')>=0) { //仅处理数组节点
							if (this.node_env == 'production') { //发行版需要个性替换的参数
								continue;
							}
						}
						
						let arr = [];
						for(let a of obj){
							if(a){
								if(moduleName=="pages"){
									if(!this.checkFileExists(a.path)){
										this.errorText.push( moduleName +"/"+ key + " 内缺失文件 " + a.path)
										continue;
									}
								}else if(moduleName=="subPackages"){
									let sas = a.pages;
									let sarr = [];
									for(let sa of sas){
										let sap = a.root+"/"+sa.path;
										if(!this.checkFileExists(sap)){
											this.errorText.push(moduleName +"/"+ key + " 内缺失文件 " + sap)
											continue;
										}
										sarr.push(sa);
									}
									 a.pages = sarr;
								}else if(moduleName=="condition"){
									if(!this.checkFileExists(a.path)){
										this.errorText.push( moduleName +"/"+ key + " 内缺失文件 " + a.path)
										continue;
									}
									let prefix = "";
									if(key.indexOf("index")<0){
										prefix = key.substr(0,key.length-3);
									}
									a.name= prefix+"_$_"+a.name;
									// console.log(moduleName,a)
								}
								arr.push(a);
							}
						}
				
					if (key == 'index.js') {
						returnVal.unshift(...arr)
					} else { 
						returnVal.push(...arr)
					}
					
				}else {
					returnVal = obj;
					break;
				}
		} 
		return returnVal;
	} 
	
	checkFileExists(path){
		let file = this.rootDir+"/"+ path+".vue";
 
		return fs.existsSync(file) 
	}
 

}









function vitePluginReplaceUniappConfig(options) {
	var name = 'vite-plugin-replace-uniapp_config';

	return {
		name: name,
		enforce: 'post',
		config: function() {
			options.forEach(function(option) {
				var node_env = option.node_env; // 执行环境  production(发行)  其他任意字符 开发
				let dir = option.dir; // 需要处理的目录
				let rootDir = option.rootDir
				let replaceFile = option.replaceFile; //需要替换的文件
				try {
					let pluginLogic = new PluginLigic(node_env, dir, replaceFile,rootDir);
					pluginLogic.process();
					// fs.writeFileSync(path, file, { "flag": "w" });
				} catch (err) {
					throw new Error(err);
				}
			});
		}
	};
}
export default vitePluginReplaceUniappConfig;
