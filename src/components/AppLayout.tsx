import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import {
  EditOutlined,
  UnorderedListOutlined,
  PieChartOutlined,
  AppstoreOutlined,
  SettingOutlined,
  RocketOutlined,
} from '@ant-design/icons'

const { Sider, Content, Header } = Layout

// 侧边导航菜单项
const menuItems = [
  { key: '/add', icon: <EditOutlined />, label: '记一笔' },
  { key: '/records', icon: <UnorderedListOutlined />, label: '账单列表' },
  { key: '/statistics', icon: <PieChartOutlined />, label: '月度统计' },
  { key: '/categories', icon: <AppstoreOutlined />, label: '分类管理' },
  { key: '/game', icon: <RocketOutlined />, label: '奶龙大战' },
  { key: '/settings', icon: <SettingOutlined />, label: '系统设置' },
]

interface AppLayoutProps {
  children: React.ReactNode
}

// 整体布局组件 — 左侧导航 + 右侧内容区
const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [greeting, setGreeting] = useState('你好呀')

  // 根据当前时间设置温馨的动态问候语
  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 5) {
      setGreeting('夜猫子时间，注意休息哦 😴')
    } else if (hour < 9) {
      setGreeting('早上好！一日之计在于晨 🌅')
    } else if (hour < 12) {
      setGreeting('上午好！今天又是元气满满的一天 🥤')
    } else if (hour < 14) {
      setGreeting('中午好！吃个美味的午餐吧 🍔')
    } else if (hour < 18) {
      setGreeting('下午好！来杯下午茶放松一下 ☕')
    } else if (hour < 22) {
      setGreeting('晚上好！来记录一下今天的收获吧 📝')
    } else {
      setGreeting('深夜啦，准备洗漱入睡吧 💤')
    }
  }, [location.pathname]) // 路由切换时重新判断时间问候

  return (
    <Layout style={{ height: '100vh' }}>
      {/* 左侧导航栏 */}
      <Sider
        theme="light"
        width={190}
        style={{
          borderRight: '2px dashed #ffe8cc',
          boxShadow: '4px 0 16px rgba(255, 152, 41, 0.03)',
          background: '#fffdfa',
        }}
      >
        {/* 应用标题 */}
        <div
          style={{
            height: 72,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '2px dashed #ffe8cc',
            margin: '0 12px',
          }}
          className="animate-wiggle"
        >
          <span style={{ fontSize: 26, marginRight: 6 }}>🐉</span>
          <span style={{ fontSize: 19, fontWeight: 800, color: '#ff9829', letterSpacing: '0.5px' }}>
            奶龙记账
          </span>
        </div>
        {/* 导航菜单 */}
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 'none', marginTop: 16, padding: '0 8px' }}
        />
      </Sider>

      {/* 右侧内容区 */}
      <Layout>
        <Header
          style={{
            background: '#fffdfa',
            padding: '0 24px',
            height: 72,
            lineHeight: '72px',
            borderBottom: '2px dashed #ffe8cc',
            fontSize: 16,
            fontWeight: 700,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#4a362f',
          }}
        >
          {/* 左侧标题 */}
          <span>
            {menuItems.find((item) => item.key === location.pathname)?.label || '奶龙记账'}
          </span>
          {/* 右侧动态温暖问候语 */}
          <span style={{ fontSize: 13, color: '#ff9829', fontWeight: 500, opacity: 0.9 }}>
            {greeting}
          </span>
        </Header>
        <Content
          style={{
            padding: 24,
            overflow: 'auto',
            background: '#fdf9f4',
          }}
        >
          <div className="animate-fade-in" style={{ height: '100%' }}>
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default AppLayout
