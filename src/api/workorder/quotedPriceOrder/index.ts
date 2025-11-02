import request from '@/config/axios'

export interface QuotedPriceOrderVO {
  id?: number
  name?: string
  confirmOrderId?: number
  confirmOrderName?: string
  receiptCompanyId?: number
  receiptCompanyName?: string
  paymentCompanyId?: number
  paymentCompanyName?: string
  price?: number
  quantity?: number
  totalPrice?: number
  advancePayment?: number
  finalPayment?: number
  discountPrice?: number
  status?: number
  tagIds?: string
  fileType?: number
  fileUrl?: string
  remark?: string
  createTime?: string
}

export const QuotedPriceOrderApi = {
  getPage: async (params: any) => {
    return await request.get({ url: `/workorder/quoted-price-order/page`, params })
  },
  get: async (id: number) => {
    return await request.get({ url: `/workorder/quoted-price-order/get?id=` + id })
  },
  create: async (data: QuotedPriceOrderVO) => {
    return await request.post({ url: `/workorder/quoted-price-order/create`, data })
  },
  update: async (data: QuotedPriceOrderVO) => {
    return await request.put({ url: `/workorder/quoted-price-order/update`, data })
  },
  delete: async (id: number) => {
    return await request.delete({ url: `/workorder/quoted-price-order/delete?id=` + id })
  },
  export: async (params: any) => {
    return await request.download({ url: `/workorder/quoted-price-order/export-excel`, params })
  },
  // 下载文件
  download: async (id: number) => {
    return await request.download({ url: `/workorder/quoted-price-order/download?id=` + id })
  }
}


