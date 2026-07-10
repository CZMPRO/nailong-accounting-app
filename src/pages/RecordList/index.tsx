import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  DatePicker,
  Space,
  Tag,
  Popconfirm,
  message,
  Modal,
  Form,
  InputNumber,
  Input,
  Cascader,
  Segmented,
  Row,
  Col,
  Statistic,
} from 'antd'
import { DeleteOutlined, EditOutlined, ArrowUpOutlined, ArrowDownOutlined, AccountBookOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { Record as ExpenseRecord, CategoryWithChildren } from '../../types'

// 账单列表页面 — 查看、编辑、删除消费和收入记录
const RecordList: React.FC = () => {
  const [records, setRecords] = useState<ExpenseRecord[]>([])
  const [categories, setCategories] = useState<CategoryWithChildren[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(dayjs())
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<ExpenseRecord | null>(null)
  const [editForm] = Form.useForm()

  // 临时状态，用于记录编辑弹窗里的账单类型
  const [editRecordType, setEditRecordType] = useState<'expense' | 'income'>('expense')

  // 页面加载时获取数据
  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    loadRecords()
  }, [selectedMonth])

  const loadCategories = async () => {
    try {
      const data = await window.api.getAllCategories()
      setCategories(data)
    } catch {
      message.error('加载分类失败')
    }
  }

  // 加载指定月份的记录
  const loadRecords = async () => {
    setLoading(true)
    try {
      const data = await window.api.getRecords({
        year: selectedMonth.year(),
        month: selectedMonth.month() + 1,
      })
      setRecords(data)
    } catch {
      message.error('加载记录失败')
    } finally {
      setLoading(false)
    }
  }

  // 删除记录
  const handleDelete = async (id: number) => {
    try {
      await window.api.deleteRecord(id)
      message.success('已删除')
      loadRecords()
    } catch {
      message.error('删除失败')
    }
  }

  // 打开编辑弹窗
  const handleEdit = (record: ExpenseRecord) => {
    setEditingRecord(record)
    setEditRecordType(record.type || 'expense')
    editForm.setFieldsValue({
      amount: record.amount,
      type: record.type || 'expense',
      category: [record.category_id, record.subcategory_id],
      date: dayjs(record.date),
      note: record.note,
    })
    setEditModalOpen(true)
  }

  // 编辑弹窗内切换类型时，清空当前选中的分类，防止数据类型混淆
  const handleEditTypeChange = (value: string) => {
    const type = value as 'expense' | 'income'
    setEditRecordType(type)
    editForm.setFieldsValue({ category: undefined })
  }

  // 保存编辑
  const handleEditSave = async (values: any) => {
    if (!editingRecord) return
    try {
      const [categoryId, subcategoryId] = values.category
      await window.api.updateRecord({
        id: editingRecord.id,
        amount: values.amount,
        category_id: categoryId,
        subcategory_id: subcategoryId,
        note: values.note || '',
        date: values.date.format('YYYY-MM-DD'),
        type: editRecordType,
      })
      message.success('修改成功')
      setEditModalOpen(false)
      loadRecords()
    } catch {
      message.error('修改失败')
    }
  }

  // 过滤出编辑弹窗中合适类型的级联选择器选项
  const filteredCategories = categories.filter((cat) => cat.type === editRecordType)
  const cascaderOptions = filteredCategories.map((cat) => ({
    value: cat.id,
    label: `${cat.icon} ${cat.name}`,
    children: cat.children.map((sub) => ({
      value: sub.id,
      label: sub.name,
    })),
  }))

  // 计算当月总支出、总收入以及结余
  const totalExpense = records
    .filter((r) => r.type === 'expense' || !r.type)
    .reduce((sum, r) => sum + r.amount, 0)

  const totalIncome = records
    .filter((r) => r.type === 'income')
    .reduce((sum, r) => sum + r.amount, 0)

  const balance = totalIncome - totalExpense

  // 表格列定义
  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: string) => (
        <span style={{ fontWeight: 500, color: '#604c46' }}>{date}</span>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 90,
      render: (type: 'expense' | 'income') => {
        const isIncome = type === 'income'
        return (
          <Tag
            color={isIncome ? 'success' : 'error'}
            style={{
              borderRadius: 20,
              padding: '2px 10px',
              fontWeight: 600,
              border: isIncome ? '1px solid #d9f7be' : '1px solid #fff0f6',
            }}
          >
            {isIncome ? '收入' : '支出'}
          </Tag>
        )
      },
    },
    {
      title: '分类',
      key: 'category',
      width: 200,
      render: (_: any, record: ExpenseRecord) => {
        const isIncome = record.type === 'income'
        return (
          <Space>
            {/* 拟物化 Emoji 圆形彩章底色 */}
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: isIncome ? '#f6ffed' : '#fff2e8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                border: isIncome ? '1px solid #d9f7be' : '1px solid #ffd8bf',
              }}
            >
              {record.category_icon || '🦖'}
            </div>
            <span style={{ fontWeight: 600, color: '#4a362f' }}>{record.category_name}</span>
            <Tag
              color={isIncome ? 'green' : 'orange'}
              style={{
                borderRadius: 4,
                fontWeight: 'normal',
                fontSize: 11,
              }}
            >
              {record.subcategory_name}
            </Tag>
          </Space>
        )
      },
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      align: 'right' as const,
      render: (amount: number, record: ExpenseRecord) => {
        const isIncome = record.type === 'income'
        return (
          <span
            style={{
              color: isIncome ? '#6ed13d' : '#ff6270',
              fontWeight: 800,
              fontSize: 16,
              fontFamily: 'Courier New, monospace',
            }}
          >
            {isIncome ? '+' : '-'}¥{amount.toFixed(2)}
          </span>
        )
      },
    },
    {
      title: '备注说明',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
      render: (note: string) => note || <span style={{ color: '#ccc', fontStyle: 'italic' }}>暂无备注</span>,
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      align: 'center' as const,
      render: (_: any, record: ExpenseRecord) => (
        <Space size={4}>
          <Button
            type="link"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
            style={{ color: '#ff9829', fontWeight: 500 }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除这条记录吗？"
            description="删除后无法恢复"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
            okButtonProps={{ danger: true, style: { borderRadius: 12 } }}
            cancelButtonProps={{ style: { borderRadius: 12 } }}
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small" style={{ fontWeight: 500 }}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {/* 顶部筛选和统计面板 — 重构为彩色轻黏土质感小卡片 */}
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
              <span style={{ color: '#88746a', fontSize: 13, fontWeight: 600 }}>选择查询月份</span>
              <DatePicker
                picker="month"
                value={selectedMonth}
                onChange={(date) => date && setSelectedMonth(date)}
                allowClear={false}
                format="YYYY年MM月"
                style={{ width: '100%', borderRadius: 12 }}
              />
            </Space>
          </Card>
        </Col>

        {/* 收入绿卡 */}
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
              value={totalIncome}
              precision={2}
              prefix="+"
              valueStyle={{ color: '#6ed13d', fontWeight: 800, fontFamily: 'Courier New, monospace' }}
            />
          </Card>
        </Col>

        {/* 支出红卡 */}
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
              value={totalExpense}
              precision={2}
              prefix="-"
              valueStyle={{ color: '#ff6270', fontWeight: 800, fontFamily: 'Courier New, monospace' }}
            />
          </Card>
        </Col>

        {/* 结余黄卡 */}
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
            />
          </Card>
        </Col>
      </Row>

      {/* 记录表格 */}
      <Card
        title={
          <span style={{ fontWeight: 700, color: '#4a362f' }}>
            📁 账单明细列表
          </span>
        }
        className="nailong-card"
        style={{ borderRadius: 16 }}
      >
        <Table
          columns={columns}
          dataSource={records}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 15,
            showTotal: (total) => `共 ${total} 条明细`,
          }}
          locale={{ emptyText: '这个月还没有记录明细哦 🐲' }}
          style={{ borderRadius: 12, overflow: 'hidden' }}
        />
      </Card>

      {/* 编辑弹窗 */}
      <Modal
        title={
          <span style={{ fontWeight: 700, color: '#4a362f' }}>
            ✏️ 修改账单记录
          </span>
        }
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        footer={null}
        destroyOnClose
        styles={{
          body: {
            paddingTop: 12,
          }
        }}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditSave}>
          {/* 类型切换 */}
          <Form.Item label={<span style={{ fontWeight: 600 }}>账单类型</span>} name="type">
            <Segmented
              options={[
                { label: '支出', value: 'expense' },
                { label: '收入', value: 'income' },
              ]}
              value={editRecordType}
              onChange={handleEditTypeChange}
              block
              style={{ borderRadius: 12 }}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontWeight: 600 }}>金额（元）</span>}
            name="amount"
            rules={[{ required: true, message: '请输入金额' }]}
          >
            <InputNumber
              style={{ width: '100%', borderRadius: 12 }}
              prefix="¥"
              precision={2}
              min={0.01}
              max={9999999.99}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontWeight: 600 }}>分类</span>}
            name="category"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Cascader options={cascaderOptions} expandTrigger="hover" style={{ borderRadius: 12 }} />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontWeight: 600 }}>日期</span>}
            name="date"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" allowClear={false} />
          </Form.Item>

          <Form.Item label={<span style={{ fontWeight: 600 }}>备注说明</span>} name="note">
            <Input.TextArea rows={3} maxLength={200} showCount style={{ borderRadius: 12 }} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setEditModalOpen(false)} style={{ borderRadius: 12 }}>取消</Button>
              <Button type="primary" htmlType="submit" style={{ borderRadius: 12, fontWeight: 600 }}>
                保存修改
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default RecordList
