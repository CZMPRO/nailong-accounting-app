// 类型声明 — 告诉 TypeScript 前端可以通过 window.api 调用哪些方法

// 分类相关类型
export interface Category {
  id: number
  name: string
  icon: string
  sort_order: number
  type: 'expense' | 'income'
}

export interface Subcategory {
  id: number
  category_id: number
  name: string
  sort_order: number
}

// 带子分类的完整分类结构
export interface CategoryWithChildren extends Category {
  children: Subcategory[]
}

// 消费记录类型
export interface Record {
  id: number
  amount: number
  category_id: number
  subcategory_id: number
  note: string
  date: string
  created_at: string
  type: 'expense' | 'income'
  // 联表查询附带的字段
  category_name?: string
  category_icon?: string
  subcategory_name?: string
}

// 月度统计类型
export interface MonthlyStats {
  categoryStats: Array<{
    id: number
    name: string
    icon: string
    total: number
    type: 'expense' | 'income'
  }>
  dailyStats: Array<{
    date: string
    expenseTotal: number // 当日总支出
    incomeTotal: number // 当日总收入
  }>
  monthTotal: number // 保持向下兼容
  monthIncome: number // 当月总收入
  monthExpense: number // 当月总支出
}

// window.api 的类型声明
declare global {
  interface Window {
    api: {
      getCategories: () => Promise<Category[]>
      getSubcategories: (categoryId: number) => Promise<Subcategory[]>
      getAllCategories: () => Promise<CategoryWithChildren[]>
      addRecord: (data: {
        amount: number
        category_id: number
        subcategory_id: number
        note: string
        date: string
        type: 'expense' | 'income'
      }) => Promise<number>
      getRecords: (params: {
        year?: number
        month?: number
        limit?: number
        offset?: number
      }) => Promise<Record[]>
      updateRecord: (data: {
        id: number
        amount: number
        category_id: number
        subcategory_id: number
        note: string
        date: string
        type: 'expense' | 'income'
      }) => Promise<any>
      deleteRecord: (id: number) => Promise<any>
      getMonthlyStats: (year: number, month: number) => Promise<MonthlyStats>
    }
  }
}

export {}
