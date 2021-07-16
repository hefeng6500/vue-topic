import { reroute } from "./reroute.js"


function urlRoute() {
    reroute()
}
// 浏览器兼容问题 如果不支持要退会hash， 在reroute方法中要实现批处理 防抖
window.addEventListener('hashchange', urlRoute)
window.addEventListener('popstate', urlRoute);

const routerEventsListeningTo = ['hashchange', 'popstate']

// 子应用 里面也可能会有路由系统，我需要先加载父应用的事件 在去调用子应用
// 需要先加载父应用 在加载子应用

export const capturedEventListeners = { // 父应用加载完子应用后再触发
    hashchange: [],
    popstate: []
}
const originalAddEventListener = window.addEventListener;
const originalRemoveEventLister = window.removeEventListener;

window.addEventListener = function(eventName, fn) {
    if (routerEventsListeningTo.includes(eventName) && !capturedEventListeners[eventName].some(l => fn == l)) {
        return capturedEventListeners[eventName].push(fn);
    }
    return originalAddEventListener.apply(this, arguments);
}

window.removeEventListener = function(eventName, fn) {
    if (routerEventsListeningTo.includes(eventName)) {
        return capturedEventListeners[eventName] = capturedEventListeners[eventName].filter(l => fn != l)
    }
    return originalRemoveEventLister.apply(this, arguments);
}

// 如果使用的是history.pushState 可以实现页面跳转，但是他不会触发popstate

history.pushState = function () { // 解决 historyApi调用时 可以触发popstate
    window.dispatchEvent(new PopStateEvent('popstate'))
}

setTimeout(() => {
    console.log(capturedEventListeners)
}, 1000);