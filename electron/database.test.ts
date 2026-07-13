import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import {
  initDatabase,
  getDatabase,
  saveDatabase,
  resetDatabaseToDefault,
} from './database'

/**
 * 账本数据库单元测试
 * 全部写入系统临时目录，绝不触碰用户真实 userData 账本
 */
describe('本地 JSON 账本 database', () => {
  let tempDir: string

  beforeEach(() => {
    // 每次用例使用独立临时文件夹，避免互相污染
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nailong-db-test-'))
    initDatabase(tempDir)
  })

  afterEach(() => {
    // 清理临时目录
    try {
      fs.rmSync(tempDir, { recursive: true, force: true })
    } catch {
      // 忽略清理失败，不影响测试结论
    }
  })

  it('初始化后应写入 bookkeeping_data.json 文件', () => {
    const dbFile = path.join(tempDir, 'bookkeeping_data.json')
    expect(fs.existsSync(dbFile)).toBe(true)
  })

  it('全新初始化应预置支出与收入大类，且流水为空', () => {
    const db = getDatabase()

    expect(db.records).toEqual([])
    expect(db.categories.length).toBeGreaterThan(0)
    expect(db.subcategories.length).toBeGreaterThan(0)

    const expenseCount = db.categories.filter((c) => c.type === 'expense').length
    const incomeCount = db.categories.filter((c) => c.type === 'income').length

    // 种子数据：13 个支出大类 + 4 个收入大类
    expect(expenseCount).toBe(13)
    expect(incomeCount).toBe(4)
  })

  it('预置分类应包含餐饮美食（支出）与职业工资（收入）', () => {
    const db = getDatabase()
    const names = db.categories.map((c) => c.name)

    expect(names).toContain('餐饮美食')
    expect(names).toContain('职业工资')

    const food = db.categories.find((c) => c.name === '餐饮美食')
    const salary = db.categories.find((c) => c.name === '职业工资')
    expect(food?.type).toBe('expense')
    expect(salary?.type).toBe('income')
  })

  it('saveDatabase 应把内存中的流水持久化到磁盘', () => {
    const db = getDatabase()
    const cat = db.categories[0]
    const sub = db.subcategories.find((s) => s.category_id === cat.id)

    expect(sub).toBeTruthy()

    db.records.push({
      id: 1,
      amount: 12.5,
      category_id: cat.id,
      subcategory_id: sub!.id,
      note: '单元测试记账',
      date: '2026-07-13',
      created_at: '2026-07-13 12:00:00',
      type: cat.type,
    })
    saveDatabase()

    const raw = fs.readFileSync(path.join(tempDir, 'bookkeeping_data.json'), 'utf-8')
    const parsed = JSON.parse(raw)
    expect(parsed.records).toHaveLength(1)
    expect(parsed.records[0].amount).toBe(12.5)
    expect(parsed.records[0].note).toBe('单元测试记账')
  })

  it('再次 initDatabase 同一目录应读回已保存的流水', () => {
    const db = getDatabase()
    const cat = db.categories[0]
    const sub = db.subcategories.find((s) => s.category_id === cat.id)!

    db.records.push({
      id: 1,
      amount: 30,
      category_id: cat.id,
      subcategory_id: sub.id,
      note: '二次加载',
      date: '2026-07-01',
      created_at: '2026-07-01 08:00:00',
      type: 'expense',
    })
    saveDatabase()

    // 模拟重启：再次初始化同一路径
    initDatabase(tempDir)
    const reloaded = getDatabase()
    expect(reloaded.records).toHaveLength(1)
    expect(reloaded.records[0].note).toBe('二次加载')
    expect(reloaded.records[0].amount).toBe(30)
  })

  it('resetDatabaseToDefault 应清空流水并恢复默认分类结构', () => {
    const db = getDatabase()
    db.records.push({
      id: 99,
      amount: 1,
      category_id: 1,
      subcategory_id: 1,
      note: '将被清空',
      date: '2026-01-01',
      created_at: '2026-01-01 00:00:00',
      type: 'expense',
    })
    // 故意弄乱分类，验证出厂重置会重建
    db.categories = []
    db.subcategories = []

    resetDatabaseToDefault()

    const after = getDatabase()
    expect(after.records).toEqual([])
    expect(after.categories.filter((c) => c.type === 'expense').length).toBe(13)
    expect(after.categories.filter((c) => c.type === 'income').length).toBe(4)
  })

  it('旧数据缺少 type 时，迁移应补成 expense 并补齐收入大类', () => {
    // 写入一份“老版本”JSON：分类和流水都没有 type，且没有收入大类
    const legacyPath = path.join(tempDir, 'bookkeeping_data.json')
    const legacy = {
      categories: [
        { id: 1, name: '餐饮美食', icon: '🍔', sort_order: 0 },
      ],
      subcategories: [
        { id: 1, category_id: 1, name: '午餐', sort_order: 0 },
      ],
      records: [
        {
          id: 1,
          amount: 20,
          category_id: 1,
          subcategory_id: 1,
          note: '旧账',
          date: '2025-01-01',
          created_at: '2025-01-01 12:00:00',
        },
      ],
    }
    fs.writeFileSync(legacyPath, JSON.stringify(legacy), 'utf-8')

    initDatabase(tempDir)
    const db = getDatabase()

    expect(db.categories.find((c) => c.id === 1)?.type).toBe('expense')
    expect(db.records[0].type).toBe('expense')
    expect(db.categories.some((c) => c.type === 'income')).toBe(true)
    // 旧流水应保留
    expect(db.records).toHaveLength(1)
    expect(db.records[0].note).toBe('旧账')
  })
})
