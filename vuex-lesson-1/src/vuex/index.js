import { inject, reactive } from "vue"
import {useStore} from './injectKey'
import Store from './store';
// 创建容器 返回一个store


function createStore(options) {
    return new Store(options)
}


export {
    useStore,
    createStore
}

