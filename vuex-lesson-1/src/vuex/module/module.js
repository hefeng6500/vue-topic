import { forEachValue } from "../utils";
export default class Module {
    constructor(rawModule) {
        this._raw = rawModule;
        this._children = {};
        this.state = rawModule.state;
    }
    // 方便扩展
    addChild(key,module){
        this._children[key] = module
    }
    getChild(key){
        return this._children[key]
    }
    forEachChild(fn){
        forEachValue(this._children,fn)
    }
}
