import {forEachValue} from  './utils'
import {reactive} from 'vue'
import {storeKey} from './injectKey' 
export default class Store {
    constructor(options) {
        // vuex3 内部会创造一个vue的实例 ，但是 vuex4 直接采用vue3 提供的响应式方法
        const store = this;
        // store._state.data
        store._state = reactive({ data: options.state }); // new Vue
        // vuex 里面有一个比较中的api  replaceState

        const _getters = options.getters; // {double:function  => getter}

        store.getters = {}
        forEachValue(_getters, function(fn, key) {
            Object.defineProperty(store.getters, key, {
                enumerable:true,
                get: () => fn(store.state) // computed,很遗憾 在vuex中不能用computed实现  如果组件销毁了会移除计算属性 ， vue3.2 会改掉这个bug
            })
        });

        store._mutations = Object.create(null);
        store._actions = Object.create(null);
        const _mutations = options.mutations;
        const _actions = options.actions;
        forEachValue(_mutations, (mutation, key) => {
            store._mutations[key] = (payload) => {
                mutation.call(store, store.state, payload);
            }
        })
        forEachValue(_actions, (action, key) => {
            store._actions[key] = (payload) => {
                action.call(store, store, payload);
            }
        })
    }
    commit = (type, payload) => { // bind 方法
        this._mutations[type](payload)
    }
    dispatch = (type, payload) => {
        this._actions[type](payload)
    }
    get state() { // 类的属性访问器
        return this._state.data;
    }
    install(app, injectKey) { // createApp().use(store,'my')
        // 全局暴露一个变量 暴露的是store的实例
        app.provide(injectKey || storeKey, this); // 给根app增加一个_provides ,子组件会去向上查找
        // Vue.prototype.$store = this
        app.config.globalProperties.$store = this; // 增添$store属性
    }
}
