import ElementPlus from 'element-plus'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'

import zhCn from 'element-plus/es/locale/lang/zh-cn'

import router from './router'

import '@/assets/styles/global.scss'
import datePlugin from '@/plugins/date'

const app = createApp(App)

// 注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(datePlugin)
app.use(ElementPlus, {
  locale: zhCn,
} as Record<string, unknown>)

app.mount('#app')
