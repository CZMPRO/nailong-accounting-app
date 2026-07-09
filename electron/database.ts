import * as fs from 'fs'
import * as path from 'path'

// 定义 JSON 数据库的结构
export interface LocalDatabase {
  categories: Array<{
    id: number
    name: string
    icon: string
    sort_order: number
    type: 'expense' | 'income'
  }>
  subcategories: Array<{
    id: number
    category_id: number
    name: string
    sort_order: number
  }>
  records: Array<{
    id: number
    amount: number
    category_id: number
    subcategory_id: number
    note: string
    date: string
    created_at: string
    type: 'expense' | 'income'
  }>
}

let dbData: LocalDatabase = {
  categories: [],
  subcategories: [],
  records: []
}

let dbFilePath = ''

// 获取数据库数据
export function getDatabase() {
  return dbData
}

// 往 JSON 文件同步保存数据
export function saveDatabase() {
  if (dbFilePath) {
    fs.writeFileSync(dbFilePath, JSON.stringify(dbData, null, 2), 'utf-8')
  }
}

// 初始化数据库 — 如果文件不存在，则创建并预置默认分类数据；若存在，自动检查平滑升级
export function initDatabase(userDataPath: string) {
  dbFilePath = path.join(userDataPath, 'bookkeeping_data.json')

  // 如果文件已经存在，直接读取它并执行版本升级校验
  if (fs.existsSync(dbFilePath)) {
    try {
      const content = fs.readFileSync(dbFilePath, 'utf-8')
      dbData = JSON.parse(content)

      // 数据平滑升级检查与兼容
      migrateDatabase()
      return
    } catch (e) {
      console.error('加载本地 JSON 账本数据失败，将重新初始化:', e)
    }
  }

  // 否则，进行全新数据初始化
  seedDefaultData()
}

// 检查升级已有数据（如果没有 type 则补齐，如果缺失收入分类则自动追加）
function migrateDatabase() {
  let modified = false

  // 1. 兼容旧分类：给没有 type 的大类默认设置为 'expense' 支出
  if (dbData.categories) {
    dbData.categories.forEach((cat) => {
      if (!cat.type) {
        cat.type = 'expense'
        modified = true
      }
    })
  } else {
    dbData.categories = []
    modified = true
  }

  if (!dbData.subcategories) {
    dbData.subcategories = []
    modified = true
  }

  // 2. 兼容旧记录：给没有 type 的流水默认设置为 'expense' 支出
  if (dbData.records) {
    dbData.records.forEach((rec) => {
      if (!rec.type) {
        rec.type = 'expense'
        modified = true
      }
    })
  } else {
    dbData.records = []
    modified = true
  }

  // 3. 检查是否缺失收入大类。如果没有 type 为 'income' 的大类，自动补齐预置收入大类和对应小类
  const hasIncome = dbData.categories.some((cat) => cat.type === 'income')
  if (!hasIncome) {
    const incomeCategoriesList = [
      { name: '职业工资', icon: '💼', subs: ['基本工资', '加班费', '奖金'] },
      { name: '副业兼职', icon: '📱', subs: ['劳务报酬', '自媒体', '外卖配送'] },
      { name: '投资理财', icon: '📈', subs: ['基金分红', '利息收入', '理财收益'] },
      { name: '其他收入', icon: '🎁', subs: ['红包', '退款', '闲置转让', '未分类'] },
    ]

    const nextCategoryId = dbData.categories.length > 0
      ? Math.max(...dbData.categories.map((c) => c.id)) + 1
      : 1
    const nextSubcategoryId = dbData.subcategories.length > 0
      ? Math.max(...dbData.subcategories.map((s) => s.id)) + 1
      : 1

    let catIdCounter = nextCategoryId
    let subIdCounter = nextSubcategoryId
    const startSortOrder = dbData.categories.length

    incomeCategoriesList.forEach((cat, catIndex) => {
      const categoryId = catIdCounter++
      dbData.categories.push({
        id: categoryId,
        name: cat.name,
        icon: cat.icon,
        sort_order: startSortOrder + catIndex,
        type: 'income'
      })

      cat.subs.forEach((subName, subIndex) => {
        dbData.subcategories.push({
          id: subIdCounter++,
          category_id: categoryId,
          name: subName,
          sort_order: subIndex
        })
      })
    })

    modified = true
  }

  // 若数据结构有升级改变，同步持久化到磁盘
  if (modified) {
    saveDatabase()
  }
}

// 预置默认分类数据（支出 + 收入）
function seedDefaultData() {
  const expenseCategoriesList = [
    { name: '餐饮美食', icon: '🍔', subs: ['早餐', '午餐', '晚餐', '零食饮料', '外卖'] },
    { name: '日用百货', icon: '🛒', subs: ['生活用品', '个人护理', '清洁用品'] },
    { name: '交通出行', icon: '🚌', subs: ['公共交通', '打车', '加油', '停车费'] },
    { name: '居住生活', icon: '🏠', subs: ['房租/房贷', '水电燃气', '物业费', '维修'] },
    { name: '服饰鞋包', icon: '👗', subs: ['衣服', '鞋子', '包', '配饰'] },
    { name: '通讯网络', icon: '📱', subs: ['话费', '宽带', '会员订阅'] },
    { name: '医疗健康', icon: '🏥', subs: ['门诊', '药品', '体检', '保健品'] },
    { name: '学习教育', icon: '📚', subs: ['书籍', '课程', '培训', '文具'] },
    { name: '休闲娱乐', icon: '🎮', subs: ['电影/演出', '游戏', '运动健身', '旅行'] },
    { name: '亲子宠物', icon: '👶', subs: ['母婴用品', '玩具', '宠物用品', '宠物医疗'] },
    { name: '人情往来', icon: '🎁', subs: ['红包', '礼物', '请客', '份子钱'] },
    { name: '金融保险', icon: '💰', subs: ['保险费', '手续费', '利息', '投资亏损'] },
    { name: '其他支出', icon: '🔧', subs: ['其他/未分类'] },
  ]

  const incomeCategoriesList = [
    { name: '职业工资', icon: '💼', subs: ['基本工资', '加班费', '奖金'] },
    { name: '副业兼职', icon: '📱', subs: ['劳务报酬', '自媒体', '外卖配送'] },
    { name: '投资理财', icon: '📈', subs: ['基金分红', '利息收入', '理财收益'] },
    { name: '其他收入', icon: '🎁', subs: ['红包', '退款', '闲置转让', '未分类'] },
  ]

  const categories: LocalDatabase['categories'] = []
  const subcategories: LocalDatabase['subcategories'] = []

  let catIdCounter = 1
  let subIdCounter = 1

  // 1. 预置支出分类 (expense)
  expenseCategoriesList.forEach((cat, catIndex) => {
    const categoryId = catIdCounter++
    categories.push({
      id: categoryId,
      name: cat.name,
      icon: cat.icon,
      sort_order: catIndex,
      type: 'expense'
    })

    cat.subs.forEach((subName, subIndex) => {
      subcategories.push({
        id: subIdCounter++,
        category_id: categoryId,
        name: subName,
        sort_order: subIndex
      })
    })
  })

  // 2. 预置收入分类 (income)
  const startSortOrder = categories.length
  incomeCategoriesList.forEach((cat, catIndex) => {
    const categoryId = catIdCounter++
    categories.push({
      id: categoryId,
      name: cat.name,
      icon: cat.icon,
      sort_order: startSortOrder + catIndex,
      type: 'income'
    })

    cat.subs.forEach((subName, subIndex) => {
      subcategories.push({
        id: subIdCounter++,
        category_id: categoryId,
        name: subName,
        sort_order: subIndex
      })
    })
  })

  dbData = {
    categories,
    subcategories,
    records: []
  }

  // 同步到磁盘文件
  saveDatabase()
}
