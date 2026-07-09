import React from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import AppLayout from './components/AppLayout'
import AddRecord from './pages/AddRecord'
import RecordList from './pages/RecordList'
import Statistics from './pages/Statistics'
import Categories from './pages/Categories'

// 根组件 — 配置中文语言包、路由和整体布局
const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          // 主题色：活力橙，呼应"奶龙"的可爱风格
          colorPrimary: '#ff7a45',
          borderRadius: 8,
        },
      }}
    >
      <HashRouter>
        <AppLayout>
          <Routes>
            <Route path="/add" element={<AddRecord />} />
            <Route path="/records" element={<RecordList />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/categories" element={<Categories />} />
            {/* 默认跳转到记一笔页面 */}
            <Route path="*" element={<Navigate to="/add" replace />} />
          </Routes>
        </AppLayout>
      </HashRouter>
    </ConfigProvider>
  )
}

export default App
