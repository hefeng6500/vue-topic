  计数器:{{ count }} {{ $store.state.count }}

  <hr />
  double:{{ double }} {{ $store.getters.double }}

  <!-- 严格模式 -->
  <button @click="$store.state.count++">错误修改</button>

  <!-- 同步修改 -->
  <button @click="add">同步修改</button>
  <button @click="asyncAdd">异步修改</button>