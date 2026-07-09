import { contextBridge, ipcRenderer } from 'electron'

// 预加载脚本 — 前端界面和后端数据库的安全通道
contextBridge.exposeInMainWorld('api', {
  getAllCategories: () => ipcRenderer.invoke('get-all-categories'),

  addRecord: (data: {
    amount: number
    category_id: number
    subcategory_id: number
    note: string
    date: string
  }) => ipcRenderer.invoke('add-record', data),

  getRecords: (params: { year?: number; month?: number; limit?: number; offset?: number }) =>
    ipcRenderer.invoke('get-records', params),

  updateRecord: (data: {
    id: number
    amount: number
    category_id: number
    subcategory_id: number
    note: string
    date: string
  }) => ipcRenderer.invoke('update-record', data),

  deleteRecord: (id: number) => ipcRenderer.invoke('delete-record', id),

  getMonthlyStats: (year: number, month: number) =>
    ipcRenderer.invoke('get-monthly-stats', year, month),
})
