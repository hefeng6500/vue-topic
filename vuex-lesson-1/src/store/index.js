import { createStore } from '@/vuex' // new Store

export default createStore({
    state: { // 组件中的data
        count: 0
    },
    getters: { // 计算属性 vuex4 他并没有实现计算属性的功能
        double(state) {
            return state.count * 2
        }
    },
    mutations: { // 可以更改状态 必须是同步更改的
        add(state, payload) {
            state.count += payload
        }
    },
    actions: { // 可以调用其他action，或者调用mutation
        asyncAdd({ commit }, payload) {
            setTimeout(() => {
                commit('add', payload)
            }, 1000);
        }
    },
    modules: { // 子模块 实现逻辑的拆分 
        aCount: {
            namespaced: true,
            state: { count: 0 },
            mutations: {
                add(state, payload) {
                    state.count += payload
                }
            },
            modules: {
                cCount: {
                    state: { count: 0 },
                    mutations: {
                        add(state, payload) {
                            state.count += payload
                        }
                    },
                }
            }
        },
        bCount: {
            state: { count: 0 },
            namespaced: true,
            mutations: {
                add(state, payload) {
                    state.count += payload
                }
            },
        }

    }
})

// 严格模式
// dispatch(action) => commit(mutation) => 修改状态


// 有一个功能 在a页面需要调用一个接口 影响的可能是a数据    b页面也需要调用同一个接口 改的是b数据