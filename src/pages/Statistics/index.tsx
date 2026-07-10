import React, { useState, useEffect } from 'react'
import { Card, DatePicker, Statistic, Row, Col, List, Avatar, Empty, Spin, Segmented, Space, Progress } from 'antd'
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
import { ArrowUpOutlined, ArrowDownOutlined, AccountBookOutlined } from '@ant-design/icons'

// 精致温馨马卡龙调色板
const PIE_COLORS = [
  '#ff9829', // 暖桔
  '#6ed13d', // 嫩绿
  '#ff6270', // 莓粉
  '#ffcd29', // 柠檬黄
  '#4fc3f7', // 浅蓝
  '#ba68c8', // 紫罗兰
  '#a1887f', // 暖沙
  '#4db6ac', // 薄荷绿
  '#ff8a65', // 珊瑚色
  '#90a4ae', // 蓝灰
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

  // 自定义环形图中心标签
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    // 如果占比小于 5%，不渲染字样，避免拥挤
    if (percent < 0.05) return null

    return (
      <text
        x={x}
        y={y}
        fill="#ffffff"
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: 11, fontWeight: 700 }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  // 自定义双柱状图 Tooltip
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#ffffff', border: '2px solid #ffe8cc', padding: '8px 12px', borderRadius: 12, boxShadow: '0 4px 12px rgba(255,152,41,0.04)' }}>
          <p style={{ margin: '0 0 6px', color: '#4a362f', fontWeight: 700 }}>{label}</p>
          {payload.map((item: any, idx: number) => (
            <p key={idx} style={{ margin: 0, color: item.color, fontSize: 13, fontWeight: 600 }}>
              {item.name}: ¥{Number(item.value).toFixed(2)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // 自定义环形图 Tooltip
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div style={{ background: '#ffffff', border: '2px solid #ffe8cc', padding: '8px 12px', borderRadius: 12, boxShadow: '0 4px 12px rgba(255,152,41,0.04)' }}>
          <p style={{ margin: 0, color: '#4a362f', fontWeight: 700, fontSize: 13 }}>
            {data.name}: ¥{Number(data.value).toFixed(2)}
          </p>
        </div>
      )
    }
    return null
  }

  // 获取前三名排行榜奖牌或数字
  const getRankBadge = (index: number) => {
    const badges = [
      { bg: 'linear-gradient(135deg, #ffd700, #ffa500)', text: '🥇' },
      { bg: 'linear-gradient(135deg, #c0c0c0, #808080)', text: '🥈' },
      { bg: 'linear-gradient(135deg, #cd7f32, #8b4513)', text: '🥉' }
    ]
    if (index < 3) {
      return (
        <Avatar
          style={{
            background: badges[index].bg,
            color: '#fff',
            fontWeight: 'bold',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            fontSize: 16,
          }}
        >
          {badges[index].text}
        </Avatar>
      )
    }
    return (
      <Avatar
        style={{
          background: '#ebdcd3',
          color: '#4a362f',
          fontWeight: 700,
        }}
      >
        {index + 1}
      </Avatar>
    )
  }

  return (
    <div>
      {/* 顶部统计总览面板 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {/* 日期选择 */}
        <Col xs={24} md={6}>
          <Card
            className="nailong-card"
            style={{
              height: '100%',
              borderRadius: 16,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <span style={{ color: '#88746a', fontSize: 13, fontWeight: 600 }}>选择统计月份</span>
              <DatePicker
                picker="month"
                value={selectedMonth}
                onChange={(val) => val && setSelectedMonth(val)}
                allowClear={false}
                format="YYYY年MM月"
                style={{ width: '100%', borderRadius: 12 }}
              />
            </Space>
          </Card>
        </Col>

        {/* 本月收入 */}
        <Col xs={12} md={6}>
          <Card
            className="nailong-card"
            style={{
              borderRadius: 16,
              background: 'linear-gradient(135deg, #ffffff, #f6ffed)',
              borderColor: '#d9f7be',
            }}
          >
            <Statistic
              title={
                <span style={{ color: '#52c41a', fontWeight: 600 }}>
                  <ArrowUpOutlined /> 本月总收入
                </span>
              }
              value={stats?.monthIncome ?? 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#6ed13d', fontWeight: 800, fontFamily: 'Courier New, monospace' }}
              loading={loading}
            />
          </Card>
        </Col>

        {/* 本月支出 */}
        <Col xs={12} md={6}>
          <Card
            className="nailong-card"
            style={{
              borderRadius: 16,
              background: 'linear-gradient(135deg, #ffffff, #fff0f6)',
              borderColor: '#ffadd2',
            }}
          >
            <Statistic
              title={
                <span style={{ color: '#ff4d4f', fontWeight: 600 }}>
                  <ArrowDownOutlined /> 本月总支出
                </span>
              }
              value={stats?.monthExpense ?? 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#ff6270', fontWeight: 800, fontFamily: 'Courier New, monospace' }}
              loading={loading}
            />
          </Card>
        </Col>

        {/* 本月结余 */}
        <Col xs={24} md={6}>
          <Card
            className="nailong-card"
            style={{
              borderRadius: 16,
              background: 'linear-gradient(135deg, #ffffff, #fff7e6)',
              borderColor: '#ffd591',
            }}
          >
            <Statistic
              title={
                <span style={{ color: '#ff9829', fontWeight: 600 }}>
                  <AccountBookOutlined /> 本月结余
                </span>
              }
              value={Math.abs(balance)}
              precision={2}
              prefix={balance >= 0 ? '¥' : '-¥'}
              valueStyle={{
                color: balance >= 0 ? '#ff9829' : '#88746a',
                fontWeight: 800,
                fontFamily: 'Courier New, monospace',
              }}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      {loading ? (
        <Card style={{ borderRadius: 16, textAlign: 'center', padding: 40 }} className="nailong-card">
          <Spin size="large" />
        </Card>
      ) : !hasAnyData ? (
        <Card style={{ borderRadius: 16 }} className="nailong-card">
          <Empty description="本月暂无记账数据，快去记一笔吧 📝" />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {/* 左侧：分类占比分析饼图（环形图） */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <span style={{ fontWeight: 700, color: '#4a362f' }}>
                  📊 分类占比分析
                </span>
              }
              className="nailong-card"
              style={{ borderRadius: 16 }}
              extra={
                <Segmented
                  options={[
                    { label: '支出占比', value: 'expense' },
                    { label: '收入占比', value: 'income' },
                  ]}
                  value={analysisType}
                  onChange={(val) => setAnalysisType(val as 'expense' | 'income')}
                  size="small"
                  style={{ borderRadius: 8 }}
                />
              }
            >
              {hasPieData ? (
                <div style={{ position: 'relative' }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60} // 改造为 Donut 环形图，腾出留白更清爽
                        outerRadius={95}
                        dataKey="value"
                        label={renderCustomizedLabel}
                        labelLine={false}
                      >
                        {pieData.map((_, index) => (
                          <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Donut 中部提示 */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                      pointerEvents: 'none',
                    }}
                  >
                    <div style={{ fontSize: 12, color: '#88746a', fontWeight: 500 }}>
                      {analysisType === 'expense' ? '支出总额' : '收入总额'}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#4a362f', marginTop: 2 }}>
                      ¥
                      {(analysisType === 'expense' ? stats?.monthExpense : stats?.monthIncome)?.toFixed(0)}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Empty description={analysisType === 'expense' ? '本月暂无支出占比数据' : '本月暂无收入占比数据'} />
                </div>
              )}
            </Card>
          </Col>

          {/* 右侧：每日收支对比趋势图 */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <span style={{ fontWeight: 700, color: '#4a362f' }}>
                  📈 每日收支对比趋势
                </span>
              }
              className="nailong-card"
              style={{ borderRadius: 16 }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#fff2e6" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#88746a', fontWeight: 500 }} />
                  <YAxis tick={{ fontSize: 11, fill: '#88746a', fontWeight: 500 }} tickFormatter={(v) => `¥${v}`} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  {/* 支出柱子 (莓粉) 🆚 收入柱子 (嫩绿) */}
                  <Bar dataKey="收入 (元)" fill="#6ed13d" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="支出 (元)" fill="#ff6270" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          {/* 下方：当前类型下的分类排行榜 */}
          <Col span={24}>
            <Card
              title={
                <span style={{ fontWeight: 700, color: '#4a362f' }}>
                  {analysisType === 'expense' ? '🏆 支出排行榜' : '🏆 收入排行榜'}
                </span>
              }
              className="nailong-card"
              style={{ borderRadius: 16 }}
            >
              {hasPieData ? (
                <List
                  dataSource={currentCategoryStats}
                  renderItem={(item, index) => {
                    const totalMonthAmount = analysisType === 'expense' ? (stats?.monthExpense ?? 1) : (stats?.monthIncome ?? 1)
                    const percent = totalMonthAmount > 0 ? (item.total / totalMonthAmount) * 100 : 0
                    return (
                      <List.Item
                        extra={
                          <span
                            style={{
                              color: analysisType === 'income' ? '#6ed13d' : '#ff6270',
                              fontWeight: 800,
                              fontSize: 16,
                              fontFamily: 'Courier New, monospace',
                            }}
                          >
                            ¥{item.total.toFixed(2)}
                          </span>
                        }
                      >
                        <List.Item.Meta
                          avatar={getRankBadge(index)}
                          title={
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 400 }}>
                              <span style={{ fontWeight: 700, color: '#4a362f' }}>
                                {item.icon} {item.name}
                              </span>
                              <span style={{ fontSize: 12, color: '#88746a', fontWeight: 500 }}>
                                占比 {percent.toFixed(1)}%
                              </span>
                            </div>
                          }
                          description={
                            <div style={{ marginTop: 6, maxWidth: 400 }}>
                              <Progress
                                percent={parseFloat(percent.toFixed(1))}
                                strokeColor={analysisType === 'income' ? '#6ed13d' : '#ff9829'}
                                trailColor="#fff2e6"
                                showInfo={false}
                                strokeWidth={8}
                              />
                            </div>
                          }
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
