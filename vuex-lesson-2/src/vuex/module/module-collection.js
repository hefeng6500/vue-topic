import { forEachValue } from '../utils'
import Module from './module'
export default class ModuleCollection {
    constructor(rootModule) {
        this.root = null;
        this.register(rootModule, []) // root => a b  a=>c
    }
    register(rawModule, path) {
        const newModule = new Module(rawModule);
        // rawModule.newModule = newModule; // 把新的模块 添加到原始对象上
        if (path.length == 0) { // 是一个根模块
            this.root = newModule
        } else {
            const parent = path.slice(0, -1).reduce((module, current) => {
                return module.getChild(current)
            }, this.root);
            parent.addChild(path[path.length - 1], newModule)
        }
        if (rawModule.modules) {
            forEachValue(rawModule.modules, (rawChildModule, key) => {
                this.register(rawChildModule, path.concat(key))
            })
        }
        return newModule
    }
    getNamespaced(path) {
        let module = this.root // [a,c] a/c
        return path.reduce((namespaceStr, key) => {
            module = module.getChild(key); // 子模块
            return namespaceStr + (module.namespaced ? key + '/' : '')
        }, '')
    }
}