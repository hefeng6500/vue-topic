import { createWebHashHistory } from './history/hash'
import { createWebHistory } from './history/html5'


// 数据处理 options.routes 是用户的配置 ， 难理解不好维护

// /  =>  record {Home}
// /a =>  record {A,parent:Home}
// /b => record {B,parent:Home}
// /about=>record

function normalizeRouteRecord(record) { // 格式化用户的参数
    return {
        path: record.path, // 状态机 解析路径的分数，算出匹配规则
        meta: record.meta || {},
        beforeEnter: record.beforeEnter,
        name: record.name,
        components: {
            default: record.component // 循环
        },
        children: record.children || []
    };
}

function createRouteRecordMatcher(record,parent){ // 创造匹配记录 ，构建父子关系
    // record 中的path 做一些修改 正则的情况 
    const matcher = {
        path:record.path,
        record,
        parent,
        children:[]
    }
    if(parent){
        parent.children.push(matcher);
    }
    return matcher;
}
// 树的遍历
function createRouterMatcher(routes) {
    const matchers = [];
    function addRoute(route,parent) {
        let normalizedRecord = normalizeRouteRecord(route);
        if(parent){
            normalizedRecord.path = parent.path + normalizedRecord.path
        }
        const matcher = createRouteRecordMatcher(normalizedRecord,parent);
        if ('children' in normalizedRecord) {
            let children = normalizedRecord.children;
            for (let i = 0; i < children.length; i++) {
                addRoute(children[i],matcher);
            }
        }
        matchers.push(matcher)
    }
    routes.forEach(route => addRoute(route));

    return {
        addRoute // 动态的添加路由， 面试问路由 如何动态添加 就是这个api
    }
}


function createRouter(options) {
    const routerHistory = options.history;
    const matcher = createRouterMatcher(options.routes); // 格式化路由的配置 拍平  
    const router = {
        install(app) { // 路由的核心就是 页面切换 ，重新渲染
            console.log('路由的安装')
            app.component('RouterLink', {
                setup: (props, { slots }) => () => <a>{slots.default && slots.default()}</a>
            });
            app.component('RouterView', {
                setup: (props, { slots }) => () => <div></div>
            })
            // 后续还有逻辑
            // 解析路径 ， RouterLink RouterView 实现， 页面的钩子 从离开到进入 到解析完成
        }
    }
    return router;
}

export {
    createWebHashHistory,
    createWebHistory,
    createRouter
}
