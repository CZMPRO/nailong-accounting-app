import React, { useState, useEffect } from 'react'
import { Card, Collapse, Tag, Spin, Segmented, Empty } from 'antd'
import type { CategoryWithChildren } from '../../types'

const { Panel } = Collapse

// 分类管理页面 — 分组展示支出分类和收入分类
const Categories: React.FC = () => {
  const [categories, setCategories] = useState<CategoryWithChildren[]>([])
  const [loading, setLoading] = useState(false)

  // 当前展示分类大类类型：'expense' 支出分类，'income' 收入分类
  const [categoryType, setCategoryType] = useState<'expense' | 'income'>('expense')

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setLoading(true)
    try {
      const data = await window.api.getAllCategories()
      setCategories(data)
    } catch {
      // 保持空
    } finally {
      setLoading(false)
    }
  }

  // 过滤当前展示的分类列表
  const displayedCategories = categories.filter((cat) => cat.type === categoryType)

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {/* 分类管理卡片 */}
      <Card
        title="📋 分类总览"
        style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        extra={
          <Segmented
            options={[
              { label: '🔴 支出分类', value: 'expense' },
              { label: '🟢 收入分类', value: 'income' },
            ]}
            value={categoryType}
            onChange={(val) => setCategoryType(val as 'expense' | 'income')}
            size="small"
          />
        }
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : displayedCategories.length === 0 ? (
          <Empty description="暂无分类数据" />
        ) : (
          <Collapse
            bordered={false}
            style={{ background: 'transparent' }}
            defaultActiveKey={displayedCategories.map((c) => String(c.id))}
          >
            {displayedCategories.map((cat) => (
              <Panel
                key={String(cat.id)}
                header={
                  <span style={{ fontSize: 15, fontWeight: 500 }}>
                    <span style={{ marginRight: 8 }}>{cat.icon}</span>
                    {cat.name}
                    <Tag
                      color={categoryType === 'income' ? 'green' : 'orange'}
                      style={{ marginLeft: 12, fontWeight: 'normal', fontSize: 12 }}
                    >
                      {cat.children.length} 个小类
                    </Tag>
                  </span>
                }
                style={{
                  marginBottom: 8,
                  background: '#fafafa',
                  borderRadius: 8,
                  border: '1px solid #f0f0f0',
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '4px 0' }}>
                  {cat.children.map((sub) => (
                    <Tag
                      key={sub.id}
                      style={{
                        padding: '4px 12px',
                        fontSize: 13,
                        borderRadius: 20,
                        // 根据分类类型渲染不同颜色：支出用橙红色，收入用绿色
                        border: categoryType === 'income' ? '1px solid #d9f7be' : '1px solid #ffd8bf',
                        background: categoryType === 'income' ? '#f6ffed' : '#fff2e8',
                        color: categoryType === 'income' ? '#389e0d' : '#d4380d',
                      }}
                    >
                      {sub.name}
                    </Tag>
                  ))}
                </div>
              </Panel>
            ))}
          </Collapse>
        )}
      </Card>
    </div>
  )
}

export default Categories
