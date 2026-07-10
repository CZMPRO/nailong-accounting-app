import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import { initDatabase, getDatabase, saveDatabase, resetDatabaseToDefault } from './database'

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
    // 如果需要开发时打开调试工具，可以取消注释下面这行
    // mainWindow.webContents.openDevTools()
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

  // --- 系统设置相关（数据导入/导出/清空/重置） ---
  // 辅助函数：CSV 字段转义
  const escapeCsvCell = (value: string | number): string => {
    const str = String(value ?? '')
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  // 辅助函数：解析 CSV 的一行数据
  const parseCsvLine = (line: string): string[] => {
    const result: string[] = []
    let currentField = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          currentField += '"'
          i++ // 跳过下一个引号
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(currentField)
        currentField = ''
      } else {
        currentField += char
      }
    }
    result.push(currentField)
    return result
  }

  // 辅助函数：把整个 CSV 字符串切分成一行行数组
  const parseCsvContent = (content: string): string[][] => {
    const lines: string[] = []
    let currentLine = ''
    let inQuotes = false

    for (let i = 0; i < content.length; i++) {
      const char = content[i]
      if (char === '"') {
        inQuotes = !inQuotes
        currentLine += char
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && content[i + 1] === '\n') {
          i++ // 跳过 \n
        }
        if (currentLine.trim()) {
          lines.push(currentLine)
        }
        currentLine = ''
      } else {
        currentLine += char
      }
    }
    if (currentLine.trim()) {
      lines.push(currentLine)
    }

    return lines.map(parseCsvLine)
  }

  // 1. 导出 CSV
  ipcMain.handle('export-to-csv', async () => {
    if (!mainWindow) return { success: false, message: '主窗口不存在' }

    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
      title: '导出账单数据',
      defaultPath: `nailong_bookkeeping_export_${new Date().toISOString().slice(0, 10)}.csv`,
      filters: [{ name: 'CSV Files', extensions: ['csv'] }]
    })

    if (canceled || !filePath) {
      return { success: false, message: '操作已取消' }
    }

    try {
      const db = getDatabase()
      const headers = ['日期', '类型', '金额', '大类', '大类图标', '小类', '备注', '创建时间']

      const rows = db.records.map((r) => {
        const cat = db.categories.find((c) => c.id === r.category_id)
        const sub = db.subcategories.find((s) => s.id === r.subcategory_id)
        return [
          r.date,
          r.type === 'income' ? '收入' : '支出',
          r.amount,
          cat ? cat.name : '未知分类',
          cat ? cat.icon : '❓',
          sub ? sub.name : '未知小类',
          r.note,
          r.created_at
        ]
      })

      // Excel 在 Windows 系统上打开 CSV 若含有中文字符，需要增加 UTF-8 BOM 标记（﻿）
      const bom = '﻿'
      const csvContent = bom + [
        headers.map(escapeCsvCell).join(','),
        ...rows.map(row => row.map(escapeCsvCell).join(','))
      ].join('\r\n')

      fs.writeFileSync(filePath, csvContent, 'utf-8')
      return { success: true, message: '账单数据已成功导出！' }
    } catch (e: any) {
      return { success: false, message: `导出失败: ${e.message}` }
    }
  })

  // 2. 导入 CSV
  ipcMain.handle('import-from-csv', async () => {
    if (!mainWindow) return { success: false, message: '主窗口不存在' }

    const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
      title: '导入账单数据',
      filters: [{ name: 'CSV Files', extensions: ['csv'] }],
      properties: ['openFile']
    })

    if (canceled || filePaths.length === 0) {
      return { success: false, message: '操作已取消' }
    }

    try {
      const filePath = filePaths[0]
      const fileContent = fs.readFileSync(filePath, 'utf-8')

      // 去除可能含有的 BOM 头部
      const cleanContent = fileContent.startsWith('﻿')
        ? fileContent.slice(1)
        : fileContent

      const parsedRows = parseCsvContent(cleanContent)
      if (parsedRows.length <= 1) {
        return { success: false, message: 'CSV文件无有效账目数据' }
      }

      const headers = parsedRows[0].map(h => h.trim())
      const recordsToImport = parsedRows.slice(1)

      const dateIndex = headers.indexOf('日期')
      const typeIndex = headers.indexOf('类型')
      const amountIndex = headers.indexOf('金额')
      const catIndex = headers.indexOf('大类')
      const catIconIndex = headers.indexOf('大类图标')
      const subIndex = headers.indexOf('小类')
      const noteIndex = headers.indexOf('备注')
      const createdIndex = headers.indexOf('创建时间')

      if (dateIndex === -1 || typeIndex === -1 || amountIndex === -1 || catIndex === -1 || subIndex === -1) {
        return { success: false, message: 'CSV 列头不匹配，请确保包含：日期、类型、金额、大类、小类' }
      }

      const db = getDatabase()
      let importCount = 0

      const categories = db.categories
      const subcategories = db.subcategories

      let nextRecordId = db.records.length > 0 ? Math.max(...db.records.map(r => r.id)) + 1 : 1
      let nextCategoryId = categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1
      let nextSubcategoryId = subcategories.length > 0 ? Math.max(...subcategories.map(s => s.id)) + 1 : 1

      for (const row of recordsToImport) {
        if (row.length < 5 || !row[dateIndex]) continue

        const date = row[dateIndex].trim()
        const rawType = row[typeIndex].trim()
        const amount = parseFloat(row[amountIndex].trim())
        const catName = row[catIndex].trim()
        const catIcon = catIconIndex !== -1 ? row[catIconIndex].trim() : ''
        const subName = row[subIndex].trim()
        const note = noteIndex !== -1 ? row[noteIndex] : ''
        const created_at = (createdIndex !== -1 && row[createdIndex])
          ? row[createdIndex].trim()
          : new Date().toLocaleString('zh-CN', { hour12: false })

        if (isNaN(amount) || !date) continue

        const type: 'expense' | 'income' = rawType === '收入' ? 'income' : 'expense'

        // 1. 查找或创建一级大类
        let category = categories.find(c => c.name === catName && c.type === type)
        if (!category) {
          category = {
            id: nextCategoryId++,
            name: catName,
            icon: catIcon || (type === 'income' ? '💼' : '🍔'),
            sort_order: categories.length,
            type
          }
          categories.push(category)
        }

        // 2. 查找或创建二级小类
        let subcategory = subcategories.find(s => s.name === subName && s.category_id === category!.id)
        if (!subcategory) {
          subcategory = {
            id: nextSubcategoryId++,
            category_id: category.id,
            name: subName,
            sort_order: subcategories.filter(s => s.category_id === category!.id).length
          }
          subcategories.push(subcategory)
        }

        // 3. 构造并录入账单
        db.records.push({
          id: nextRecordId++,
          amount,
          category_id: category.id,
          subcategory_id: subcategory.id,
          note,
          date,
          created_at,
          type
        })
        importCount++
      }

      saveDatabase()
      return { success: true, message: `成功从备份文件导入 ${importCount} 条账单记录！` }
    } catch (e: any) {
      return { success: false, message: `导入失败: ${e.message}` }
    }
  })

  // 3. 清空账单记录 (保留自定义分类结构)
  ipcMain.handle('clear-all-records', async () => {
    try {
      const db = getDatabase()
      db.records = []
      saveDatabase()
      return { success: true, message: '所有的流水账单数据已清空！' }
    } catch (e: any) {
      return { success: false, message: `清空失败: ${e.message}` }
    }
  })

  // 4. 重置数据库（出厂设置）
  ipcMain.handle('factory-reset-db', async () => {
    try {
      resetDatabaseToDefault()
      return { success: true, message: '数据库已重置为初始状态！' }
    } catch (e: any) {
      return { success: false, message: `重置失败: ${e.message}` }
    }
  })
}
