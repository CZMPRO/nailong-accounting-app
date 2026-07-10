import React, { useState } from 'react'
import { Card, Button, Space, Typography, Popconfirm, message, Divider, Alert, Row, Col } from 'antd'
import {
  DownloadOutlined,
  UploadOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SettingOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'

const { Text, Paragraph } = Typography

// 系统设置页面 — 提供数据导出备份、CSV数据导入和重置清空等数据管理功能
const Settings: React.FC = () => {
  const [loading, setLoading] = useState(false)

  // 导出 CSV 文件
  const handleExport = async () => {
    setLoading(true)
    try {
      const res = await window.api.exportToCsv()
      if (res.success) {
        message.success(res.message)
      } else {
        message.warning(res.message)
      }
    } catch {
      message.error('导出账单明细失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 导入 CSV 文件
  const handleImport = async () => {
    setLoading(true)
    try {
      const res = await window.api.importFromCsv()
      if (res.success) {
        message.success(res.message)
      } else {
        message.warning(res.message)
      }
    } catch {
      message.error('导入失败，请检查CSV备份文件格式是否正确')
    } finally {
      setLoading(false)
    }
  }

  // 清空流水账单数据
  const handleClearRecords = async () => {
    setLoading(true)
    try {
      const res = await window.api.clearAllRecords()
      if (res.success) {
        message.success(res.message)
      } else {
        message.error(res.message)
      }
    } catch {
      message.error('清空账单数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 数据库彻底恢复出厂设置
  const handleFactoryReset = async () => {
    setLoading(true)
    try {
      const res = await window.api.factoryResetDb()
      if (res.success) {
        message.success(res.message)
      } else {
        message.error(res.message)
      }
    } catch {
      message.error('重置出厂数据库失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Card
        title={
          <span style={{ fontWeight: 700, color: '#4a362f', display: 'flex', alignItems: 'center', gap: 8 }}>
            <SettingOutlined /> 系统数据设置
          </span>
        }
        className="nailong-card"
        style={{ borderRadius: 16 }}
      >
        <Paragraph style={{ color: '#88746a', marginBottom: 20 }}>
          在这里您可以对本地的记账数据进行全面管理。系统支持导出数据用于 Excel 查看备份，或者在更换设备时导入恢复。
        </Paragraph>

        {/* 提示 Alert，奶橘色拟物化描边 */}
        <Alert
          message="温馨提示与导入说明"
          description="导出生成的是兼容性极佳的 CSV 格式，可在 Excel、WPS 等软件中直接查看编辑。导入数据时，请严格使用由本应用导出的 CSV 备份文件，确保列头结构不被篡改，否则将引发解析异常。"
          type="info"
          showIcon
          icon={<InfoCircleOutlined style={{ color: '#ff9829' }} />}
          style={{
            borderRadius: 12,
            backgroundColor: '#fffdf4',
            borderColor: '#ffe8cc',
            marginBottom: 24,
            borderWidth: '1.5px',
          }}
        />

        <Row gutter={[24, 24]}>
          {/* 左侧：数据备份与恢复 (BOM CSV) */}
          <Col xs={24} md={12}>
            <Card
              type="inner"
              title={
                <span style={{ fontWeight: 700, color: '#4a362f' }}>
                  💾 数据备份与恢复
                </span>
              }
              style={{
                borderRadius: 16,
                borderColor: '#ffe8cc',
                borderWidth: '1.5px',
                height: '100%',
                background: '#fffdfa'
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size={16}>
                <div>
                  <Text style={{ display: 'block', fontWeight: 700, color: '#4a362f', marginBottom: 4 }}>数据导出备份</Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    将本地数据库中的所有流水账单明细快速整理并保存为电脑中的 CSV 文件。
                  </Text>
                </div>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={handleExport}
                  loading={loading}
                  block
                  style={{
                    borderRadius: 20,
                    fontWeight: 700,
                    height: 40,
                    background: '#ff9829',
                    borderColor: '#ff9829',
                    boxShadow: '0 2px 6px rgba(255, 152, 41, 0.15)',
                  }}
                >
                  导出账单明细 (CSV)
                </Button>

                <Divider style={{ margin: '8px 0', borderStyle: 'dashed', borderColor: '#ffe8cc' }} />

                <div>
                  <Text style={{ display: 'block', fontWeight: 700, color: '#4a362f', marginBottom: 4 }}>数据导入恢复</Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    读取本地备份的 CSV 文件并将数据重新导入回数据库，遇到新分类会自动同步创建。
                  </Text>
                </div>
                <Button
                  icon={<UploadOutlined />}
                  onClick={handleImport}
                  loading={loading}
                  block
                  style={{
                    borderRadius: 20,
                    fontWeight: 700,
                    height: 40,
                    borderColor: '#ff9829',
                    color: '#ff9829',
                    background: '#ffffff'
                  }}
                >
                  导入账单明细 (CSV)
                </Button>
              </Space>
            </Card>
          </Col>

          {/* 右侧：危险操作防误删区域 */}
          <Col xs={24} md={12}>
            <Card
              type="inner"
              title={
                <span style={{ fontWeight: 700, color: '#ff6270' }}>
                  ⚠️ 敏感危险操作区
                </span>
              }
              style={{
                borderRadius: 16,
                borderColor: '#ffccd1',
                borderWidth: '1.5px',
                height: '100%',
                backgroundColor: '#fffbfa'
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size={16}>
                <div>
                  <Text style={{ display: 'block', fontWeight: 700, color: '#ff6270', marginBottom: 4 }}>清空账单流水</Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    一键擦除所有的历史账目流水，但会为您保留已经创建和修改的一、二级分类结构。
                  </Text>
                </div>
                <Popconfirm
                  title="警告：确定要清空所有账单记录吗？"
                  description="清空后所有账单明细将彻底消失，且无法挽回！"
                  onConfirm={handleClearRecords}
                  okText="确定清空"
                  cancelText="取消"
                  okButtonProps={{ danger: true, style: { borderRadius: 12, fontWeight: 600 } }}
                  cancelButtonProps={{ style: { borderRadius: 12 } }}
                >
                  <Button
                    danger
                    type="dashed"
                    icon={<DeleteOutlined />}
                    loading={loading}
                    block
                    style={{
                      borderRadius: 20,
                      fontWeight: 700,
                      height: 40,
                      borderStyle: 'dashed'
                    }}
                  >
                    清空所有账单明细
                  </Button>
                </Popconfirm>

                <Divider style={{ margin: '8px 0', borderStyle: 'dashed', borderColor: '#ffccd1' }} />

                <div>
                  <Text style={{ display: 'block', fontWeight: 700, color: '#ff6270', marginBottom: 4 }}>重置出厂设置</Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    完全清除所有自定义一二级分类与全部记账流水，系统数据库重置为软件刚下载的状态。
                  </Text>
                </div>
                <Popconfirm
                  title="超级警告：确定要完全重置数据库吗？"
                  description="重置后，您的所有账单以及您自定义的分类结构将被彻底抹除！"
                  onConfirm={handleFactoryReset}
                  okText="完全重置"
                  cancelText="我再想想"
                  okButtonProps={{ danger: true, style: { borderRadius: 12, fontWeight: 600 } }}
                  cancelButtonProps={{ style: { borderRadius: 12 } }}
                >
                  <Button
                    danger
                    type="primary"
                    icon={<ReloadOutlined />}
                    loading={loading}
                    block
                    style={{
                      borderRadius: 20,
                      fontWeight: 700,
                      height: 40,
                      background: '#ff6270',
                      borderColor: '#ff6270',
                      boxShadow: '0 2px 6px rgba(255, 98, 112, 0.15)',
                    }}
                  >
                    完全重置出厂状态
                  </Button>
                </Popconfirm>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default Settings