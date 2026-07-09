import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import {
  EditOutlined,
  UnorderedListOutlined,
  PieChartOutlined,
  AppstoreOutlined,
} from '@ant-design/icons'

const { Sider, Content, Header } = Layout

// 侧边导航菜单项
const menuItems = [
  { key: '/add', icon: <EditOutlined />, label: '记一笔' },
  { key: '/records', icon: <UnorderedListOutlined />, label: '账单列表' },
  { key: '/statistics', icon: <PieChartOutlined />, label: '月度统计' },
  { key: '/categories', icon: <AppstoreOutlined />, label: '分类管理' },
]

interface AppLayoutProps {
  children: React.ReactNode
}

// 整体布局组件 — 左侧导航 + 右侧内容区
const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <Layout style={{ height: '100vh' }}>
      {/* 左侧导航栏 */}
      <Sider
        theme="light"
        width={180}
        style={{
          borderRight: '1px solid #f0f0f0',
          boxShadow: '2px 0 8px rgba(0,0,0,0.06)',
        }}
      >
        {/* 应用标题 */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <span style={{ fontSize: 24, marginRight: 8 }}>🐲</span>
          <span style={{ fontSize: 18, fontWeight: 'bold', color: '#ff7a45' }}>
            奶龙记账
          </span>
        </div>
        {/* 导航菜单 */}
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 'none', marginTop: 8 }}
        />
      </Sider>

      {/* 右侧内容区 */}
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            height: 64,
            lineHeight: '64px',
            borderBottom: '1px solid #f0f0f0',
            fontSize: 16,
            fontWeight: 500,
          }}
        >
          {/* 根据当前路由显示页面标题 */}
          {menuItems.find((item) => item.key === location.pathname)?.label || '奶龙记账'}
        </Header>
        <Content
          style={{
            padding: 24,
            overflow: 'auto',
            background: '#f5f5f5',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

export default AppLayout
