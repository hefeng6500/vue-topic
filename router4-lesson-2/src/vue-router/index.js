import { createWebHashHistory } from './history/hash'
import { createWebHistory } from './history/html5'
import { ref, shallowRef, computed, reactive, unref } from 'vue'
import { RouterLink } from './router-link'
import { RouterView } from './router-view'
import { createRouterMatcher } from './matcher'
// 数据处理 options.routes 是用户的配置 ， 难理解不好维护

// /  =>  record {Home}
// /a =>  record {A,parent:Home}
// /b => record {B,parent:Home}
// /about=>record


const START_LOCATION_NORMALIZED = { // 初始化路由系统中的默认参数
    path: '/',
    // params:{}, // 路径参数
    // query:{},
    matched: [], // 当前路径匹配到的记录
}

function useCallback() {
    const handlers = [];

    function add(handler) {
        handlers.push(handler)
    }
    return {
        add,
        list: () => handlers
    }
}

function extractChangeRecords(to, from) {
    const leavingRecords = [];
    const updatingRecords = [];
    const enteringRecords = [];
    const len = Math.max(to.matched.length, from.matched.length);

    for (let i = 0; i < len; i++) {
        const recordFrom = from.matched[i];
        if (recordFrom) { // /a   [home,A]  /b [home,B]
            // 去的和来的都有 那么就是要更新
            if (to.matched.find(record => record.path == recordFrom.path)) {
                updatingRecords.push(recordFrom);
            } else {
                leavingRecords.push(recordFrom)
            }
        }
        const recrodTo = to.matched[i]
        if (recrodTo) {
            if(!from.matched.find(record=>record.path === recrodTo.path)){
                enteringRecords.push(recrodTo)
            }
        }
    }
    return [leavingRecords,updatingRecords,enteringRecords]

}

function guardToPromise(guard,to,from,record){
    return ()=> new Promise((resolve,reject)=>{
        const next = () => resolve()
        let guardReturn = guard.call(record,to,from,next)
        // 如果不调用next最终也会调用next， 用户可以不调用next方法
        return Promise.resolve(guardReturn).then(next)
    })
}
function extractComponentsGuards(matched,guradType,to,from){ // guradType beforeRouteLeave
    const guards = [];
    for(const record of matched){
       let rawComponent =  record.components.default
       const guard = rawComponent[guradType];
       // 我需要将钩子 全部串联在一起？  promise
       guard && guards.push(guardToPromise(guard,to,from,record))
    }
    return guards;
}
// promise的组合函数
function runGuardQueue(guards){ // []
    return guards.reduce((promise,guard)=>promise.then(()=>guard()),Promise.resolve())
}

function createRouter(options) {
    const routerHistory = options.history;

    const matcher = createRouterMatcher(options.routes); // 格式化路由的配置 拍平  

    // 后续改变这个数据的value 就可以更新视图了
    const currentRoute = shallowRef(START_LOCATION_NORMALIZED);

    const beforeGuards = useCallback();
    const beforeResolveGuards = useCallback();
    const afterGuards = useCallback();

    // vue2 中有两个属性 $router 里面包含的时方法  $route 里面包含的属性


    // 将数据用计算属性 再次包裹
    function resolve(to) { // to="/"   to={path:'/'}
        if (typeof to === 'string') {
            return matcher.resolve({ path: to })
        }
    }
    let ready;

    function markAsReady() {
        if (ready) return
        ready = true; // 用来标记已经渲染完毕了
        routerHistory.listen((to) => {
            const targetLocation = resolve(to);
            const from = currentRoute.value;
            finalizeNavigation(targetLocation, from, true); // 在切换前进后退 是 替换模式不是push模式
        })
    }

    function finalizeNavigation(to, from, replaced) {
        if (from === START_LOCATION_NORMALIZED || replaced) {
            routerHistory.replace(to.path);
        } else {
            routerHistory.push(to.path);
        }
        currentRoute.value = to; // 更新最新的路径

        console.log(currentRoute.value)
        markAsReady();
        // 如果是初始化 我们还需要注入一个listen 去更新currentRoute的值，这样数据变化后可以重新渲染视图
    }

    async function navigate(to, from) {
        // 在做导航的时候 我要知道哪个组件是进入，哪个组件是离开的，还要知道哪个组件是更新的

        const [leavingRecords, updatingRecords, enteringRecords] = extractChangeRecords(to, from)

        // 我离开的时候 需要从后往前   /home/a  -> about

        let guards = extractComponentsGuards(
            leavingRecords.reverse(),
            'beforeRouteLeave',
            to,
            from
        )
        return runGuardQueue(guards).then(()=>{
            guards = [];
            for(const guard of beforeGuards.list()){
                guards.push(guardToPromise(guard,to,from,guard))
            }
            return runGuardQueue(guards)
        }).then(()=>{
            guards = extractComponentsGuards(
                updatingRecords,
                'beforeRouteUpdate',
                to,
                from
            )
            return runGuardQueue(guards)
        }).then(()=>{
            guards = [];
            for(const record of to.matched){
                if(record.beforeEnter){
                    guards.push(guardToPromise(record.beforeEnter,to,from,record))
                }
            }
            return runGuardQueue(guards)
        }).then(()=>{
            guards = extractComponentsGuards(
                enteringRecords,
                'beforeRouteEnter',
                to,
                from
            )
            return runGuardQueue(guards)
        }).then(()=>{
            guards = []
            for(const guard of beforeResolveGuards.list()){
                guards.push(guardToPromise(guard,to,from,guard))
            }
            return runGuardQueue(guards)
        })
    }

    function pushWithRedirect(to) { // 通过路径匹配到对应的记录，更新currentRoute
        const targetLocation = resolve(to);
        const from = currentRoute.value;
        // 路由的钩子 在跳转前我们可以做路由的拦截


        // 路由的导航守卫 有几种呢？ 全局钩子 路由钩子 组件上的钩子 
        navigate(targetLocation, from).then(() => {
            return finalizeNavigation(targetLocation, from)
        }).then(() => {
            // 当导航切换完毕后执行 afterEach
            for (const guard of afterGuards.list()) guard(to, from)
        })

        // 根据是不是第一次，来决定是 push 还是replace

    }

    function push(to) {
        return pushWithRedirect(to);
    }
    // reactive computed
    const router = {
        push,
        beforeEach: beforeGuards.add, // 可以注册多个 所以是一个发布订阅模式
        afterEach: afterGuards.add,
        beforeResolve: beforeResolveGuards.add,
        install(app) { // 路由的核心就是 页面切换 ，重新渲染
            const router = this;
            app.config.globalProperties.$router = router; // 方法
            Object.defineProperty(app.config.globalProperties, '$route', { // 属性
                enumerable: true,
                get: () => unref(currentRoute)
            })
            const reactiveRoute = {};
            for (let key in START_LOCATION_NORMALIZED) { //
                reactiveRoute[key] = computed(() => currentRoute.value[key]);
            }

            // vuex const store = useStore()
            app.provide('router', router); // 暴露路由对象 
            app.provide('route location', reactive(reactiveRoute)); // 用于实现useApi
            // let router = useRouter(); // inject('router')

            // let route = useRoute();// inject('route location')

            app.component('RouterLink', RouterLink);
            app.component('RouterView', RouterView);

            if (currentRoute.value == START_LOCATION_NORMALIZED) {
                // 默认就是初始化, 需要通过路由系统先进行一次跳转 发生匹配
                push(routerHistory.location)
            }

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