import React from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import AppLayout from './components/AppLayout'
import AddRecord from './pages/AddRecord'
import RecordList from './pages/RecordList'
import Statistics from './pages/Statistics'
import Categories from './pages/Categories'
import Settings from './pages/Settings'
import TankGame from './pages/TankGame'

// 根组件 — 配置中文语言包、路由和整体布局
const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          // 主题色：暖奶黄橙，呼应"奶龙"的软糯可爱质感
          colorPrimary: '#ff9829',
          colorSuccess: '#6ed13d',
          colorError: '#ff6270',
          colorTextBase: '#4a362f', // 暖可可棕作为基准文字颜色，更显高档温暖
          colorBgLayout: '#fdf9f4', // 奶油香草背景
          colorBgContainer: '#ffffff',
          borderRadius: 12, // 增大圆角
        },
        components: {
          Layout: {
            colorBgHeader: '#ffffff',
            colorBgBody: '#fdf9f4',
          },
          Menu: {
            itemBg: 'transparent',
            itemSelectedBg: '#fff2e6', // 菜单选中底色
            itemSelectedColor: '#ff9829',
            itemHoverBg: '#fffaf5',
            itemColor: '#604c46',
            itemActiveBg: '#fff2e6',
          },
          Button: {
            borderRadius: 24, // 按钮更加圆润胶囊化
            controlHeightLG: 44,
          },
          Input: {
            colorBorder: '#ffe8cc',
            colorPrimary: '#ff9829',
          },
          InputNumber: {
            colorBorder: '#ffe8cc',
            colorPrimary: '#ff9829',
          },
          DatePicker: {
            colorBorder: '#ffe8cc',
            colorPrimary: '#ff9829',
          },
          Cascader: {
            colorBorder: '#ffe8cc',
            colorPrimary: '#ff9829',
          },
          Segmented: {
            itemSelectedBg: '#ff9829',
            itemSelectedColor: '#ffffff',
            trackBg: '#fff2e6',
          },
          Table: {
            headerBg: '#fff7ee', // 暖色表头
            headerColor: '#4a362f',
            rowHoverBg: '#fffbf7',
            headerBorderRadius: 12,
          },
          Collapse: {
            headerBg: '#fffaf5',
            contentBg: '#ffffff',
          },
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
            <Route path="/settings" element={<Settings />} />
            <Route path="/game" element={<TankGame />} />
            {/* 默认跳转到记一笔页面 */}
            <Route path="*" element={<Navigate to="/add" replace />} />
          </Routes>
        </AppLayout>
      </HashRouter>
    </ConfigProvider>
  )
}

export default App
