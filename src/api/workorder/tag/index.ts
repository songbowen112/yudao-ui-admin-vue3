import request from '@/config/axios'

export interface WorkorderTagVO {
  id?: number
  tagName?: string
  parentTagId?: number
  status?: number
  createTime?: string
}

export const WorkorderTagApi = {
  getPage: async (params: any) => {
    return await request.get({ url: `/workorder/tag/page`, params })
  },
  get: async (id: number) => {
    return await request.get({ url: `/workorder/tag/get?id=` + id })
  },
  create: async (data: WorkorderTagVO) => {
    return await request.post({ url: `/workorder/tag/create`, data })
  },
  update: async (data: WorkorderTagVO) => {
    return await request.put({ url: `/workorder/tag/update`, data })
  },
  delete: async (id: number) => {
    return await request.delete({ url: `/workorder/tag/delete?id=` + id })
  },
  export: async (params: any) => {
    return await request.download({ url: `/workorder/tag/export-excel`, params })
  },
  // 获取所有一级标签
  getParentTagList: async () => {
    return await request.get({ url: `/workorder/tag/list-parent` })
  },
  // 根据一级标签获取二级标签
  getTagListByParent: async (parentTagId: number) => {
    return await request.get({ url: `/workorder/tag/list-by-parent?parentTagId=` + parentTagId })
  }
}


