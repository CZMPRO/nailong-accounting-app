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
        title="✏️ 记一笔"
        style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
      >
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
          <Form.Item label="账单类型" style={{ marginBottom: 20 }}>
            <Segmented
              options={[
                { label: '🔴 记支出', value: 'expense' },
                { label: '🟢 记收入', value: 'income' },
              ]}
              value={recordType}
              onChange={handleTypeChange}
              block
              size="large"
            />
          </Form.Item>

          {/* 金额输入 */}
          <Form.Item
            label="金额（元）"
            name="amount"
            rules={[
              { required: true, message: '请输入金额' },
              {
                type: 'number',
                min: 0.01,
                message: '金额必须大于0',
              },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              prefix="¥"
              placeholder={recordType === 'expense' ? '请输入支出金额' : '请输入收入金额'}
              precision={2}
              size="large"
              min={0.01}
              max={9999999.99}
            />
          </Form.Item>

          {/* 分类选择（级联：先选大类，再选小类） */}
          <Form.Item
            label="分类"
            name="category"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Cascader
              options={cascaderOptions}
              placeholder="先选大类，再选小类"
              size="large"
              expandTrigger="hover"
            />
          </Form.Item>

          {/* 日期选择 */}
          <Form.Item
            label="日期"
            name="date"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              size="large"
              format="YYYY-MM-DD"
              allowClear={false}
            />
          </Form.Item>

          {/* 备注输入（可选） */}
          <Form.Item label="备注" name="note">
            <Input.TextArea
              placeholder={recordType === 'expense' ? '可以记录消费详情，如：晚餐聚餐' : '可以记录收入来源，如：7月份基本工资'}
              rows={3}
              maxLength={200}
              showCount
            />
          </Form.Item>

          {/* 提交按钮 */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
              style={{
                height: 48,
                fontSize: 16,
                background: recordType === 'income' ? '#52c41a' : '#ff7a45',
                borderColor: recordType === 'income' ? '#52c41a' : '#ff7a45',
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
