import { h, inject } from 'vue'

function useLink(props) {
    const router = inject('router')
    function navigate() {
        router.push(props.to)
    }
    return {
        navigate
    }
}
export const RouterLink = {
    name: 'RouterLink',
    props: {
        to: {
            type: [String, Object],
            required: true
        }
    },
    setup(props, { slots }) {
        const link = useLink(props);
        return () => {
            return h('a', { // 虚拟节点 -》 真实节点
                onClick: link.navigate
            }, slots.default && slots.default())
        }
    }
}