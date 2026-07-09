import React, { useState, useEffect } from 'react'
import { Card, DatePicker, Statistic, Row, Col, List, Avatar, Empty, Spin, Segmented, Space } from 'antd'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import dayjs, { Dayjs } from 'dayjs'
import type { MonthlyStats } from '../../types'

// 饼图颜色调色板
const PIE_COLORS = [
  '#ff7a45', '#ffa940', '#ffc53d', '#73d13d', '#36cfc9',
  '#40a9ff', '#9254de', '#f759ab', '#ff4d4f', '#faad14',
  '#52c41a', '#13c2c2', '#597ef7',
]

const Statistics: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs())
  const [stats, setStats] = useState<MonthlyStats | null>(null)
  const [loading, setLoading] = useState(false)

  // 控制当前饼图与排行展示的类型：'expense' 支出分析，'income' 收入分析
  const [analysisType, setAnalysisType] = useState<'expense' | 'income'>('expense')

  useEffect(() => {
    loadStats()
  }, [selectedMonth])

  const loadStats = async () => {
    setLoading(true)
    try {
      const data = await window.api.getMonthlyStats(
        selectedMonth.year(),
        selectedMonth.month() + 1
      )
      setStats(data)
    } catch {
      // 保持空状态
    } finally {
      setLoading(false)
    }
  }

  // 根据当前选择的分析类型（支出/收入），过滤并组织饼图数据
  const currentCategoryStats = stats?.categoryStats.filter(c => c.type === analysisType) || []
  const pieData = currentCategoryStats.map((item) => ({
    name: `${item.icon} ${item.name}`,
    value: item.total,
  }))

  // 整理柱状图数据：双柱状图（收入与支出并列显示）
  const barData = stats?.dailyStats.map((item) => ({
    date: item.date.slice(5), // 仅截取 MM-DD
    '支出 (元)': item.expenseTotal,
    '收入 (元)': item.incomeTotal,
  })) || []

  // 判断当前类型下是否有数据
  const hasPieData = pieData.length > 0
  const hasAnyData = (stats?.monthExpense ?? 0) > 0 || (stats?.monthIncome ?? 0) > 0

  const balance = (stats?.monthIncome ?? 0) - (stats?.monthExpense ?? 0)

  // 自定义双柱状图 Tooltip
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#fff', border: '1px solid #f0f0f0', padding: '8px 12px', borderRadius: 8 }}>
          <p style={{ margin: '0 0 4px', color: '#666', fontWeight: 500 }}>{label}</p>
          {payload.map((item: any, idx: number) => (
            <p key={idx} style={{ margin: 0, color: item.color }}>
              {item.name}: ¥{Number(item.value).toFixed(2)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div>
      {/* 顶部统计总览面板 */}
      <Card style={{ marginBottom: 16, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <Row gutter={24} align="middle">
          <Col span={6}>
            <Space direction="vertical" size={4}>
              <span style={{ color: '#888', fontSize: 13 }}>选择统计月份</span>
              <DatePicker
                picker="month"
                value={selectedMonth}
                onChange={(val) => val && setSelectedMonth(val)}
                allowClear={false}
                format="YYYY年MM月"
                style={{ width: '100%' }}
              />
            </Space>
          </Col>
          <Col span={6} style={{ borderLeft: '1px solid #f0f0f0' }}>
            <Statistic
              title="本月总收入"
              value={stats?.monthIncome ?? 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
              loading={loading}
            />
          </Col>
          <Col span={6} style={{ borderLeft: '1px solid #f0f0f0' }}>
            <Statistic
              title="本月总支出"
              value={stats?.monthExpense ?? 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#ff4d4f', fontWeight: 'bold' }}
              loading={loading}
            />
          </Col>
          <Col span={6} style={{ borderLeft: '1px solid #f0f0f0' }}>
            <Statistic
              title="本月结余"
              value={Math.abs(balance)}
              precision={2}
              prefix={balance >= 0 ? '¥' : '-¥'}
              valueStyle={{
                color: balance >= 0 ? '#ff7a45' : '#8c8c8c',
                fontWeight: 'bold',
              }}
              loading={loading}
            />
          </Col>
        </Row>
      </Card>

      {loading ? (
        <Card style={{ borderRadius: 12, textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
        </Card>
      ) : !hasAnyData ? (
        <Card style={{ borderRadius: 12 }}>
          <Empty description="本月暂无记账数据哦 📝" />
        </Card>
      ) : (
        <Row gutter={16}>
          {/* 左侧：分类占比分析饼图 */}
          <Col span={12}>
            <Card
              title="分类占比分析"
              style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
              extra={
                <Segmented
                  options={[
                    { label: '支出分析', value: 'expense' },
                    { label: '收入分析', value: 'income' },
                  ]}
                  value={analysisType}
                  onChange={(val) => setAnalysisType(val as 'expense' | 'income')}
                  size="small"
                />
              }
            >
              {hasPieData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name.split(' ')[1]} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={true}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [`¥${Number(value).toFixed(2)}`, '总额']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Empty description={analysisType === 'expense' ? '本月暂无支出占比数据' : '本月暂无收入占比数据'} />
                </div>
              )}
            </Card>
          </Col>

          {/* 右侧：每日收支对比趋势图 */}
          <Col span={12}>
            <Card title="每日收支趋势对比" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `¥${v}`} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  {/* 支出柱子 (橙色) 🆚 收入柱子 (绿色) */}
                  <Bar dataKey="收入 (元)" fill="#52c41a" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="支出 (元)" fill="#ff7a45" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          {/* 下方：当前类型下的分类排行榜 */}
          <Col span={24} style={{ marginTop: 16 }}>
            <Card
              title={analysisType === 'expense' ? '🏆 支出排行榜' : '🏆 收入排行榜'}
              style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            >
              {hasPieData ? (
                <List
                  dataSource={currentCategoryStats}
                  renderItem={(item, index) => {
                    const totalMonthAmount = analysisType === 'expense' ? (stats?.monthExpense ?? 1) : (stats?.monthIncome ?? 1)
                    return (
                      <List.Item
                        extra={
                          <span
                            style={{
                              color: analysisType === 'income' ? '#52c41a' : '#ff4d4f',
                              fontWeight: 'bold',
                              fontSize: 16,
                            }}
                          >
                            ¥{item.total.toFixed(2)}
                          </span>
                        }
                      >
                        <List.Item.Meta
                          avatar={
                            <Avatar
                              style={{
                                background: index < 3 ? (analysisType === 'income' ? '#52c41a' : '#ff7a45') : '#d9d9d9',
                                color: '#fff',
                                fontWeight: 'bold',
                              }}
                            >
                              {index + 1}
                            </Avatar>
                          }
                          title={`${item.icon} ${item.name}`}
                          description={`占比 ${(totalMonthAmount > 0 ? (item.total / totalMonthAmount) * 100 : 0).toFixed(1)}%`}
                        />
                      </List.Item>
                    )
                  }}
                />
              ) : (
                <Empty description="暂无排行榜数据" />
              )}
            </Card>
          </Col>
        </Row>
      )}
    </div>
  )
}

export default Statistics
