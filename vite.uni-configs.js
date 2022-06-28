var path = require("path")
var fs = require('fs');
class PluginLigic {

	constructor(node_env, dir, replaceFile,rootDir,user,watchDir) {
		this.node_env = node_env
		this.user = user;
		this.dir = dir;
		this.replaceFile = replaceFile;
		this.rootDir = rootDir;
		this.errorText=[];
		this.releaseData = {}; //最终数据
		if(watchDir){ //监听配置目录文件变更,重新组装文件,触发差量编译
			this.watchDirChange()
		}
	}

	watchDirChange(){
		 
		console.log(`uniapp-pages-config插件正在监听配置目录`+this.dir);
		fs.watch(this.dir,{recursive:true},(event,filename)=>{
			//console.log(`监听 `,event,filename);
		    if (filename && filename.indexOf(".js")>0){
		        console.log(`${filename}文件发生变更`);
				this.process()
		    }
		})
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
				let data;
				if(k=="condition" && this.node_env == 'production'){
					 //发行版 不导出条件编译 
						continue;
					 
				}else if(k=="subPackages"){
					  data = this.processSubpackages(k, nodeMap[k]);
					  if(data.length==0){
						  continue;
					  }
				}else{
					data = this.processNode(k, nodeMap[k]);
					if(k=='condition'){
						data= {
							"current": 0,
							"list": data ||[]
						}
					}
					
				} 
				if(data){
					this.releaseData[k] = data
				}else{
					console.log("info :"+ k+" 节点解析返回undefined")
				}
				
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
		  // console.log("处理", path)
		for(let key of files) { 
				if (key.indexOf('.js') < 0) continue; 
				if(moduleName=="condition"){
					// console.log(key,this.user)
						if(key!="index.js" && key.indexOf(this.user)<0){
							continue;
						}
				}
				
				
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
								}else if(path.indexOf("subPackages")>=0){
									let sp = moduleName +  "/"+ a.path
									if(!this.checkFileExists(sp)){
										this.errorText.push( moduleName +"/"+ key + " 内缺失文件 " + sp)
										continue;
									} 
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
	
	/**
	 * 处理subpackage ,逻辑和pages其实一样,只是最后组装成subpackages需要的数组
	 */
	processSubpackages(moduleName, dir){
		let arr=[]
		
		let dirs = fs.readdirSync(dir, 'utf-8');
		
		dirs.forEach((pac)=>{
			//每个子目录一个 子包
			// console.log(moduleName,  dir + "/" + pac);
			let p =  dir + "/" + pac ;
			let stat = fs.lstatSync(p);
			if (stat.isDirectory()) {
				 let data = this.processNode(pac, p );
				 // console.log(data)
				 if(!data || data.length==0){
				 	return;
				 }
				 arr.push({
				 	root: pac,
				 	pages: data
				 });
			}
			
		})  
		return arr;
	}
	
	
	
	
	
	
	checkFileExists(path){
		let file = this.rootDir+"/"+ path+".vue";
 
		return fs.existsSync(file) 
	}
 

}









module.exports=(options)=> {
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
				let user = option.user
				let watchDir = option.watchDir;
				if(watchDir!==false){
					watchDir=true;
				}
				
				try {
					let pluginLogic = new PluginLigic(node_env, dir, replaceFile,rootDir,user,watchDir);
					pluginLogic.process();
					// fs.writeFileSync(path, file, { "flag": "w" });
				} catch (err) {
					throw new Error(err);
				}
			});
		}
	};
} 
