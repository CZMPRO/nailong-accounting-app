import React, { useState, useEffect } from 'react'
import {
  Card,
  Form,
  InputNumber,
  Input,
  DatePicker,
  Button,
  message,
  Cascader,
  Segmented,
  Space,
} from 'antd'
import dayjs from 'dayjs'
import type { CategoryWithChildren } from '../../types'

// 记一笔页面 — 用户在这里录入每笔消费（支出/收入）
const AddRecord: React.FC = () => {
  const [form] = Form.useForm()
  const [categories, setCategories] = useState<CategoryWithChildren[]>([])
  const [loading, setLoading] = useState(false)

  // 监听当前记账类型：'expense' 支出，'income' 收入
  const [recordType, setRecordType] = useState<'expense' | 'income'>('expense')
  // 同步金额状态，用于数码计算屏幕显示
  const [amountValue, setAmountValue] = useState<number | null>(null)

  // 页面加载时获取分类数据
  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const data = await window.api.getAllCategories()
      setCategories(data)
    } catch {
      message.error('加载分类数据失败')
    }
  }

  // 切换记账类型时：更新类型，并清空当前已选分类，防止分类数据错乱
  const handleTypeChange = (value: string) => {
    const type = value as 'expense' | 'income'
    setRecordType(type)
    form.setFieldsValue({ category: undefined })
  }

  // 修改金额时同步显示
  const handleAmountChange = (value: number | null) => {
    setAmountValue(value)
  }

  // 快捷金额追加
  const handleQuickAdd = (value: number) => {
    const current = form.getFieldValue('amount') || 0
    // 保留两位小数
    const nextAmount = parseFloat((current + value).toFixed(2))
    form.setFieldsValue({ amount: nextAmount })
    setAmountValue(nextAmount)
  }

  // 重置金额
  const handleClearAmount = () => {
    form.setFieldsValue({ amount: undefined })
    setAmountValue(null)
  }

  // 根据当前选择的类型，过滤并转换出对应的级联分类数据
  const filteredCategories = categories.filter((cat) => cat.type === recordType)

  const cascaderOptions = filteredCategories.map((cat) => ({
    value: cat.id,
    label: `${cat.icon} ${cat.name}`,
    children: cat.children.map((sub) => ({
      value: sub.id,
      label: sub.name,
    })),
  }))

  // 提交表单 — 保存一笔账单记录
  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      const [categoryId, subcategoryId] = values.category
      await window.api.addRecord({
        amount: values.amount,
        category_id: categoryId,
        subcategory_id: subcategoryId,
        note: values.note || '',
        date: values.date.format('YYYY-MM-DD'),
        type: recordType,
      })
      message.success('记账成功！💰')
      form.resetFields()
      setAmountValue(null)
      // 重置后恢复默认日期为今天，并保持当前的支出/收入类型
      form.setFieldsValue({
        date: dayjs(),
        type: recordType,
      })
    } catch {
      message.error('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <Card
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>✏️</span>
            <span>记一笔账单</span>
          </span>
        }
        className="nailong-card"
        style={{ borderRadius: 16 }}
      >
        {/* 精致的模拟显示屏 */}
        <div className="nailong-display-screen">
          <div style={{ fontSize: 13, color: '#ff9829', marginBottom: 4, fontWeight: 500 }}>
            {recordType === 'expense' ? '🔴 当前记支出金额' : '🟢 当前记收入金额'}
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 800,
              fontFamily: 'Courier New, monospace',
              color: recordType === 'expense' ? '#ff6270' : '#6ed13d',
            }}
          >
            ¥ {amountValue !== null ? amountValue.toFixed(2) : '0.00'}
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            date: dayjs(),
            note: '',
          }}
        >
          {/* 支出/收入类型切换 */}
          <Form.Item label={<span style={{ fontWeight: 600 }}>账单类型</span>} style={{ marginBottom: 20 }}>
            <Segmented
              options={[
                { label: '🔴 记支出', value: 'expense' },
                { label: '🟢 记收入', value: 'income' },
              ]}
              value={recordType}
              onChange={handleTypeChange}
              block
              size="large"
              style={{ borderRadius: 12 }}
            />
          </Form.Item>

          {/* 金额输入 */}
          <Form.Item
            label={<span style={{ fontWeight: 600 }}>金额（元）</span>}
            name="amount"
            rules={[
              { required: true, message: '请输入金额' },
              {
                type: 'number',
                min: 0.01,
                message: '金额必须大于0',
              },
            ]}
            style={{ marginBottom: 12 }}
          >
            <InputNumber
              style={{ width: '100%', borderRadius: 12 }}
              prefix={<span style={{ color: '#ff9829', fontWeight: 'bold' }}>¥</span>}
              placeholder={recordType === 'expense' ? '请输入支出金额' : '请输入收入金额'}
              precision={2}
              size="large"
              min={0.01}
              max={9999999.99}
              onChange={handleAmountChange}
            />
          </Form.Item>

          {/* 快捷输入面板 */}
          <div style={{ marginBottom: 24 }}>
            <Space wrap size={8}>
              <Button size="small" className="quick-amount-btn" onClick={() => handleQuickAdd(10)}>+10</Button>
              <Button size="small" className="quick-amount-btn" onClick={() => handleQuickAdd(20)}>+20</Button>
              <Button size="small" className="quick-amount-btn" onClick={() => handleQuickAdd(50)}>+50</Button>
              <Button size="small" className="quick-amount-btn" onClick={() => handleQuickAdd(100)}>+100</Button>
              <Button size="small" className="quick-amount-btn" onClick={() => handleQuickAdd(200)}>+200</Button>
              <Button size="small" className="quick-amount-btn" onClick={() => handleQuickAdd(500)}>+500</Button>
              <Button size="small" danger type="dashed" style={{ borderRadius: 20 }} onClick={handleClearAmount}>清空</Button>
            </Space>
          </div>

          {/* 分类选择 */}
          <Form.Item
            label={<span style={{ fontWeight: 600 }}>分类</span>}
            name="category"
            rules={[{ required: true, message: '请选择分类' }]}
            style={{ marginBottom: 20 }}
          >
            <Cascader
              options={cascaderOptions}
              placeholder="先选大类，再选小类"
              size="large"
              expandTrigger="hover"
              style={{ width: '100%' }}
            />
          </Form.Item>

          {/* 日期选择 */}
          <Form.Item
            label={<span style={{ fontWeight: 600 }}>日期</span>}
            name="date"
            rules={[{ required: true, message: '请选择日期' }]}
            style={{ marginBottom: 20 }}
          >
            <DatePicker
              style={{ width: '100%' }}
              size="large"
              format="YYYY-MM-DD"
              allowClear={false}
            />
          </Form.Item>

          {/* 备注输入（可选） */}
          <Form.Item label={<span style={{ fontWeight: 600 }}>备注</span>} name="note" style={{ marginBottom: 24 }}>
            <Input.TextArea
              placeholder={recordType === 'expense' ? '可以记录消费详情，如：晚餐聚餐' : '可以记录收入来源，如：7月份基本工资'}
              rows={3}
              maxLength={200}
              showCount
              style={{ borderRadius: 12 }}
            />
          </Form.Item>

          {/* 提交按钮 */}
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
              style={{
                height: 48,
                fontSize: 16,
                fontWeight: 700,
                background: recordType === 'income' ? '#6ed13d' : '#ff9829',
                borderColor: recordType === 'income' ? '#6ed13d' : '#ff9829',
              }}
            >
              💾 保存
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default AddRecord
