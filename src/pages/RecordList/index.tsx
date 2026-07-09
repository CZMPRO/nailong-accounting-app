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
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
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
      width: 110,
    },
    {
      title: '收支类型',
      dataIndex: 'type',
      key: 'type',
      width: 90,
      render: (type: 'expense' | 'income') => {
        const isIncome = type === 'income'
        return (
          <Tag color={isIncome ? 'success' : 'error'}>
            {isIncome ? '收入' : '支出'}
          </Tag>
        )
      },
    },
    {
      title: '分类',
      key: 'category',
      width: 180,
      render: (_: any, record: ExpenseRecord) => {
        const isIncome = record.type === 'income'
        return (
          <Space>
            <span>{record.category_icon}</span>
            <span>{record.category_name}</span>
            <Tag color={isIncome ? 'green' : 'orange'}>{record.subcategory_name}</Tag>
          </Space>
        )
      },
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right' as const,
      render: (amount: number, record: ExpenseRecord) => {
        const isIncome = record.type === 'income'
        return (
          <span
            style={{
              color: isIncome ? '#52c41a' : '#ff4d4f',
              fontWeight: 'bold',
              fontSize: 15,
            }}
          >
            {isIncome ? '+' : '-'}¥{amount.toFixed(2)}
          </span>
        )
      },
    },
    {
      title: '备注',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
      render: (note: string) => note || <span style={{ color: '#ccc' }}>无</span>,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: ExpenseRecord) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除这条记录吗？"
            description="删除后无法恢复"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {/* 顶部筛选和统计面板 */}
      <Card style={{ marginBottom: 16, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <Row gutter={24} align="middle">
          <Col span={6}>
            <Space direction="vertical" size={4}>
              <span style={{ color: '#888', fontSize: 13 }}>选择查询月份</span>
              <DatePicker
                picker="month"
                value={selectedMonth}
                onChange={(date) => date && setSelectedMonth(date)}
                allowClear={false}
                format="YYYY年MM月"
                style={{ width: '100%' }}
              />
            </Space>
          </Col>
          <Col span={6} style={{ borderLeft: '1px solid #f0f0f0' }}>
            <Statistic
              title="本月总收入"
              value={totalIncome}
              precision={2}
              prefix="+"
              valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
            />
          </Col>
          <Col span={6} style={{ borderLeft: '1px solid #f0f0f0' }}>
            <Statistic
              title="本月总支出"
              value={totalExpense}
              precision={2}
              prefix="-"
              valueStyle={{ color: '#ff4d4f', fontWeight: 'bold' }}
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
            />
          </Col>
        </Row>
      </Card>

      {/* 记录表格 */}
      <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <Table
          columns={columns}
          dataSource={records}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 15,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          locale={{ emptyText: '这个月还没有记录哦 🐲' }}
        />
      </Card>

      {/* 编辑弹窗 */}
      <Modal
        title="✏️ 编辑记录"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditSave} style={{ marginTop: 15 }}>
          {/* 类型切换 */}
          <Form.Item label="账单类型" name="type">
            <Segmented
              options={[
                { label: '🔴 支出', value: 'expense' },
                { label: '🟢 收入', value: 'income' },
              ]}
              value={editRecordType}
              onChange={handleEditTypeChange}
              block
            />
          </Form.Item>

          <Form.Item
            label="金额（元）"
            name="amount"
            rules={[{ required: true, message: '请输入金额' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              prefix="¥"
              precision={2}
              min={0.01}
              max={9999999.99}
            />
          </Form.Item>

          <Form.Item
            label="分类"
            name="category"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Cascader options={cascaderOptions} expandTrigger="hover" />
          </Form.Item>

          <Form.Item
            label="日期"
            name="date"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" allowClear={false} />
          </Form.Item>

          <Form.Item label="备注" name="note">
            <Input.TextArea rows={3} maxLength={200} showCount />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setEditModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
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
