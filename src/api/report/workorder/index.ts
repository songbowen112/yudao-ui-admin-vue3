import request from '@/config/axios'
import { ref } from 'vue'

// 工单信息 VO
export interface WorkOrderVO {
  id: number // 工单ID
  name: string // 工单名称
  remark: string // 备注
  areaId: number // 区域ID
  tagIds: string // 标签ID列表，多个用逗号分隔
  status: number // 工单状态：1-待处理 2-待审核 3-审核完成 4-审核失败 5-通知完成 6-通知失败
}

// 工单信息 API
export const WorkOrderApi = {
  // 查询工单信息分页
  getWorkOrderPage: async (params: any) => {
    return await request.get({ url: `/report/work-order/page`, params })
  },

  // 查询工单信息详情
  getWorkOrder: async (id: number) => {
    return await request.get({ url: `/report/work-order/get?id=` + id })
  },

  // 新增工单信息
  createWorkOrder: async (data: WorkOrderVO) => {
    return await request.post({ url: `/report/work-order/create`, data })
  },

  // 修改工单信息
  updateWorkOrder: async (data: WorkOrderVO) => {
    return await request.put({ url: `/report/work-order/update`, data })
  },

  // 删除工单信息
  deleteWorkOrder: async (id: number) => {
    return await request.delete({ url: `/report/work-order/delete?id=` + id })
  },

  // 导出工单信息 Excel
  exportWorkOrder: async (params) => {
    return await request.download({ url: `/report/work-order/export-excel`, params })
  }
}
