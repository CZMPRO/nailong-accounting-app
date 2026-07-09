import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { initDatabase, getDatabase, saveDatabase } from './database'

// 主窗口引用
let mainWindow: BrowserWindow | null = null

// 创建主窗口
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    title: '奶龙记账',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // 开发环境加载本地服务，生产环境加载打包文件
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools() // 开发时打开调试工具
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// 应用就绪后创建窗口
app.whenReady().then(() => {
  // 初始化数据库
  initDatabase(app.getPath('userData'))
  // 注册所有数据库操作的通信通道
  registerIpcHandlers()
  // 创建窗口
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// 所有窗口关闭时退出（Mac 除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// ============ IPC 通信处理 ============
function registerIpcHandlers() {
  // --- 分类相关 ---
  // 获取所有分类（大类+小类，嵌套结构）
  ipcMain.handle('get-all-categories', () => {
    const db = getDatabase()
    return db.categories.map((cat) => ({
      ...cat,
      children: db.subcategories
        .filter((sub) => sub.category_id === cat.id)
        .sort((a, b) => a.sort_order - b.sort_order),
    })).sort((a, b) => a.sort_order - b.sort_order)
  })

  // --- 记录相关 ---
  // 添加一笔记录
  ipcMain.handle(
    'add-record',
    (
      _event,
      data: {
        amount: number
        category_id: number
        subcategory_id: number
        note: string
        date: string
        type: 'expense' | 'income'
      }
    ) => {
      const db = getDatabase()
      const newId = db.records.length > 0 ? Math.max(...db.records.map(r => r.id)) + 1 : 1
      const newRecord = {
        id: newId,
        amount: data.amount,
        category_id: data.category_id,
        subcategory_id: data.subcategory_id,
        note: data.note || '',
        date: data.date,
        type: data.type || 'expense', // 若没传默认填 expense
        created_at: new Date().toLocaleString('zh-CN', { hour12: false })
      }
      db.records.push(newRecord)
      saveDatabase()
      return newId
    }
  )

  // 获取记录列表（支持按月筛选）
  ipcMain.handle(
    'get-records',
    (_event, params: { year?: number; month?: number; limit?: number; offset?: number }) => {
      const db = getDatabase()

      // 1. 过滤符合条件的记录
      let result = db.records.filter((r) => {
        if (params.year && params.month) {
          const monthStr = String(params.month).padStart(2, '0')
          return r.date.startsWith(`${params.year}-${monthStr}`)
        }
        return true
      })

      // 2. 联表查询，挂载分类和大类名字及 icon
      const recordsWithJoin = result.map((r) => {
        const category = db.categories.find((c) => c.id === r.category_id)
        const subcategory = db.subcategories.find((s) => s.id === r.subcategory_id)
        return {
          ...r,
          category_name: category ? category.name : '未知分类',
          category_icon: category ? category.icon : '❓',
          subcategory_name: subcategory ? subcategory.name : '未知小类',
        }
      })

      // 3. 排序：按日期倒序，同日期按创建时间倒序
      recordsWithJoin.sort((a, b) => {
        if (a.date !== b.date) {
          return b.date.localeCompare(a.date)
        }
        return b.created_at.localeCompare(a.created_at)
      })

      // 4. 分页支持
      let paginatedResult = recordsWithJoin
      if (params.limit !== undefined) {
        const offset = params.offset || 0
        paginatedResult = recordsWithJoin.slice(offset, offset + params.limit)
      }

      return paginatedResult
    }
  )

  // 更新一笔记录
  ipcMain.handle(
    'update-record',
    (
      _event,
      data: {
        id: number
        amount: number
        category_id: number
        subcategory_id: number
        note: string
        date: string
        type: 'expense' | 'income'
      }
    ) => {
      const db = getDatabase()
      const index = db.records.findIndex((r) => r.id === data.id)
      if (index !== -1) {
        db.records[index] = {
          ...db.records[index],
          amount: data.amount,
          category_id: data.category_id,
          subcategory_id: data.subcategory_id,
          note: data.note || '',
          date: data.date,
          type: data.type || 'expense'
        }
        saveDatabase()
        return true
      }
      return false
    }
  )

  // 删除一笔记录
  ipcMain.handle('delete-record', (_event, id: number) => {
    const db = getDatabase()
    const index = db.records.findIndex((r) => r.id === id)
    if (index !== -1) {
      db.records.splice(index, 1)
      saveDatabase()
      return true
    }
    return false
  })

  // --- 统计相关 ---
  // 获取月度统计 (全新重构，统计总收入、总支出及各自的大类占比)
  ipcMain.handle('get-monthly-stats', (_event, year: number, month: number) => {
    const db = getDatabase()
    const monthStr = String(month).padStart(2, '0')
    const prefix = `${year}-${monthStr}`

    // 过滤出当月的所有记录
    const monthlyRecords = db.records.filter((r) => r.date.startsWith(prefix))

    // 1. 各大类支出/收入汇总
    const categoryMap: { [key: number]: number } = {}
    monthlyRecords.forEach((r) => {
      categoryMap[r.category_id] = (categoryMap[r.category_id] || 0) + r.amount
    })

    const categoryStats = db.categories
      .map((cat) => {
        const total = categoryMap[cat.id] || 0
        return {
          id: cat.id,
          name: cat.name,
          icon: cat.icon,
          total: total,
          type: cat.type
        }
      })
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total)

    // 2. 每日收支明细汇总
    const dailyExpenseMap: { [key: string]: number } = {}
    const dailyIncomeMap: { [key: string]: number } = {}

    monthlyRecords.forEach((r) => {
      if (r.type === 'income') {
        dailyIncomeMap[r.date] = (dailyIncomeMap[r.date] || 0) + r.amount
      } else {
        dailyExpenseMap[r.date] = (dailyExpenseMap[r.date] || 0) + r.amount
      }
    })

    // 合并获取当月所有出现过账目的日期
    const allDates = Array.from(new Set([
      ...Object.keys(dailyExpenseMap),
      ...Object.keys(dailyIncomeMap)
    ])).sort((a, b) => a.localeCompare(b))

    const dailyStats = allDates.map((date) => ({
      date,
      expenseTotal: dailyExpenseMap[date] || 0,
      incomeTotal: dailyIncomeMap[date] || 0
    }))

    // 3. 计算月度总收入与总支出
    let monthIncome = 0
    let monthExpense = 0
    monthlyRecords.forEach((r) => {
      if (r.type === 'income') {
        monthIncome += r.amount
      } else {
        monthExpense += r.amount
      }
    })

    return {
      categoryStats,
      dailyStats,
      monthTotal: monthExpense, // 兼容原字段（当作支出）
      monthIncome,
      monthExpense
    }
  })
}
