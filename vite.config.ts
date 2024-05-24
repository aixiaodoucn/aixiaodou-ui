import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
export default defineConfig({
  plugins: [
    vue(),
  ],
  build: {
    lib: {
      entry: './lib/main.ts',
      name: 'aixiaodou-ui',
      fileName: 'aixiaodou-ui'
    },
    rollupOptions:{
      external:['vue'],
      output:{
        format:'umd',
        exports:'named',
        globals:{
          vue:'Vue'
        },
      },
    },
    minify:'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 生产环境下去除console
        drop_debugger: true, // 生产环境下去除debugger
      }
    }
  }
})
