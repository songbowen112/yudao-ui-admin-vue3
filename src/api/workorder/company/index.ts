import request from '@/config/axios'

export interface WorkorderCompanyVO {
  id?: number
  name?: string
  shortName?: string
  licenseNo?: string
  legalPerson?: string
  address?: string
  tel?: string
  email?: string
  logoUrl?: string
  bankName?: string
  bankAccount?: string
  remark?: string
  status?: number
  createTime?: string
}

export const WorkorderCompanyApi = {
  getPage: async (params: any) => {
    return await request.get({ url: `/workorder/company/page`, params })
  },
  get: async (id: number) => {
    return await request.get({ url: `/workorder/company/get?id=` + id })
  },
  create: async (data: WorkorderCompanyVO) => {
    return await request.post({ url: `/workorder/company/create`, data })
  },
  update: async (data: WorkorderCompanyVO) => {
    return await request.put({ url: `/workorder/company/update`, data })
  },
  delete: async (id: number) => {
    return await request.delete({ url: `/workorder/company/delete?id=` + id })
  },
  export: async (params: any) => {
    return await request.download({ url: `/workorder/company/export-excel`, params })
  }
}


