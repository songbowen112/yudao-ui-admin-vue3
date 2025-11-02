import request from '@/config/axios'

export interface ConfirmOrderVO {
  id?: number
  name?: string
  receiptCompanyId?: number
  receiptCompanyName?: string
  paymentCompanyId?: number
  paymentCompanyName?: string
  tagIds?: string
  status?: number
  fileType?: number
  fileUrl?: string
  remark?: string
  createTime?: string
}

export const ConfirmOrderApi = {
  getPage: async (params: any) => {
    return await request.get({ url: `/workorder/confirm-order/page`, params })
  },
  get: async (id: number) => {
    return await request.get({ url: `/workorder/confirm-order/get?id=` + id })
  },
  create: async (data: ConfirmOrderVO) => {
    return await request.post({ url: `/workorder/confirm-order/create`, data })
  },
  update: async (data: ConfirmOrderVO) => {
    return await request.put({ url: `/workorder/confirm-order/update`, data })
  },
  delete: async (id: number) => {
    return await request.delete({ url: `/workorder/confirm-order/delete?id=` + id })
  },
  export: async (params: any) => {
    return await request.download({ url: `/workorder/confirm-order/export-excel`, params })
  },
  // 下载文件
  download: async (id: number) => {
    return await request.download({ url: `/workorder/confirm-order/download?id=` + id })
  },
  // 获取初始化状态的确认单列表
  listInitStatus: async () => {
    return await request.get({ url: `/workorder/confirm-order/list-init` })
  }
}
