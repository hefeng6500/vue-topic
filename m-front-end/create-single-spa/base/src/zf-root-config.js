import { registerApplication, start } from "single-spa";


// registerApplication,start 
// 当路径匹配到后回去加载对应的子应用模块 ， 来实现微前端

registerApplication({
  name: "@single-spa/welcome", // 应用名字 随便起
  app: () => // 当路径匹配到的时候 执行这个方法
    System.import( // 加载了一个远程的模块， 这个模块会暴露 三个钩子 bootstrap mount unmount
      "https://unpkg.com/single-spa-welcome/dist/single-spa-welcome.js"
    ),
  activeWhen: location=>location.pathname == '/',
});
registerApplication({
  name: "@zf/vue", 
  app: () => System.import('@zf/vue'),
  activeWhen: ["/vue"], // 以/vue开头的就能匹配到,
  customProps:{a:1}
});
registerApplication({
  name: "@zf/react", 
  app: () => System.import('@zf/react'),
  activeWhen: ["/react"], // 以/vue开头的就能匹配到,
  customProps:{a:1}
});


start({ // 启动应用
  urlRerouteOnly: true,
});


// registerApplication, start