import React, { useState, useEffect } from 'react'
import { Card, Tag, Spin, Segmented, Empty, Row, Col } from 'antd'
import type { CategoryWithChildren } from '../../types'

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
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* 分类管理顶层卡片 */}
      <Card
        title={
          <span style={{ fontWeight: 700, color: '#4a362f' }}>
            📋 预设账单分类总览
          </span>
        }
        className="nailong-card"
        style={{ borderRadius: 16 }}
        extra={
          <Segmented
            options={[
              { label: '支出分类', value: 'expense' },
              { label: '收入分类', value: 'income' },
            ]}
            value={categoryType}
            onChange={(val) => setCategoryType(val as 'expense' | 'income')}
            size="small"
            style={{ borderRadius: 8 }}
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
          /* 重构为更加高雅、排版透气的分组卡片网格系统，替代原本暗淡的 Collapse */
          <Row gutter={[16, 16]}>
            {displayedCategories.map((cat) => (
              <Col xs={24} sm={12} key={cat.id}>
                <div
                  style={{
                    background: '#fffdfa',
                    border: '1.5px solid #ffe8cc',
                    borderRadius: 16,
                    padding: 16,
                    height: '100%',
                    boxShadow: '0 2px 8px rgba(255, 152, 41, 0.02)',
                    transition: 'all 0.3s ease',
                  }}
                  className="animate-fade-in"
                >
                  {/* 大类标题 */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '2px dashed #ffe8cc',
                      paddingBottom: 10,
                      marginBottom: 12,
                    }}
                  >
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#4a362f' }}>
                      <span style={{ marginRight: 8, fontSize: 18 }}>{cat.icon}</span>
                      {cat.name}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: categoryType === 'income' ? '#52c41a' : '#ff9829',
                        background: categoryType === 'income' ? '#f6ffed' : '#fff2e8',
                        padding: '2px 8px',
                        borderRadius: 10,
                        fontWeight: 600,
                        border: categoryType === 'income' ? '1px solid #d9f7be' : '1px solid #ffd8bf',
                      }}
                    >
                      {cat.children.length} 个小类
                    </span>
                  </div>

                  {/* 二级子分类胶囊徽章列表 */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {cat.children.map((sub) => (
                      <Tag
                        key={sub.id}
                        style={{
                          padding: '4px 12px',
                          fontSize: 13,
                          borderRadius: 20,
                          fontWeight: 500,
                          margin: 0,
                          cursor: 'default',
                          transition: 'all 0.2s ease',
                          border: categoryType === 'income' ? '1px solid #d9f7be' : '1px solid #ffd8bf',
                          background: categoryType === 'income' ? '#f6ffed' : '#fff2e8',
                          color: categoryType === 'income' ? '#389e0d' : '#d4380d',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.06)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)'
                        }}
                      >
                        {sub.name}
                      </Tag>
                    ))}
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        )}
      </Card>
    </div>
  )
}

export default Categories
