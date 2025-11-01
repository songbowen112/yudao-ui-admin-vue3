<template>
  <ContentWrap>
    <el-form class="-mb-15px" :model="queryParams" ref="queryFormRef" :inline="true" label-width="88px">
      <el-form-item label="工单名称" prop="name">
        <el-input v-model="queryParams.name" placeholder="请输入工单名称" clearable @keyup.enter="handleQuery" class="!w-240px" />
      </el-form-item>
      <el-form-item label="工单状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择工单状态" clearable class="!w-240px">
          <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker v-model="queryParams.createTime" value-format="YYYY-MM-DD HH:mm:ss" type="daterange" start-placeholder="开始日期" end-placeholder="结束日期" :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]" class="!w-220px" />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button type="primary" plain @click="openForm('create')" v-hasPermi="['workorder:confirm-order:create']"><Icon icon="ep:plus" class="mr-5px" /> 新增</el-button>
        <el-button type="success" plain @click="handleExport" :loading="exportLoading" v-hasPermi="['workorder:confirm-order:export']"><Icon icon="ep:download" class="mr-5px" /> 导出</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table row-key="id" v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column type="selection" width="55" />
      <el-table-column label="工单ID" align="center" prop="id" />
      <el-table-column label="工单名称" align="center" prop="name" />
      <el-table-column label="收款企业" align="center" prop="receiptCompanyName" />
      <el-table-column label="付款企业" align="center" prop="paymentCompanyName" />
      <el-table-column label="标签ID列表" align="center" prop="tagIds" />
      <el-table-column label="工单状态" align="center" prop="status">
        <template #default="scope">{{ statusMap[scope.row.status] ?? scope.row.status }}</template>
      </el-table-column>
      <el-table-column label="文件类型" align="center" prop="fileType" />
      <el-table-column label="文件路径" align="center" prop="fileUrl" />
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column label="创建时间" align="center" prop="createTime" width="180px" :formatter="dateFormatter" />
      <el-table-column label="操作" align="center" min-width="120px">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('update', scope.row.id)" v-hasPermi="['workorder:confirm-order:update']">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)" v-hasPermi="['workorder:confirm-order:delete']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination :total="total" v-model:page="queryParams.pageNo" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </ContentWrap>
</template>

<script setup lang="ts">
import download from '@/utils/download'
import { dateFormatter } from '@/utils/formatTime'
import { ConfirmOrderApi, type ConfirmOrderVO } from '@/api/workorder/confirmOrder'

defineOptions({ name: 'ConfirmOrder' })

const message = useMessage()
const { t } = useI18n()

const statusOptions = [
  { label: '初始化', value: 1 },
  { label: '报价完成', value: 2 },
  { label: '报价失败', value: 3 },
  { label: '通知完成', value: 4 },
  { label: '通知失败', value: 5 }
]
const statusMap: Record<number, string> = Object.fromEntries(statusOptions.map((i) => [i.value, i.label]))

const loading = ref(true)
const list = ref<ConfirmOrderVO[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: undefined as string | undefined,
  status: undefined as number | undefined,
  createTime: [] as string[]
})
const queryFormRef = ref()
const exportLoading = ref(false)

const getList = async () => {
  loading.value = true
  try {
    const data = await ConfirmOrderApi.getPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

const openForm = (type: string, id?: number) => {}

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await ConfirmOrderApi.delete(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await ConfirmOrderApi.export(queryParams)
    download.excel(data, '确认单.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

onMounted(() => {
  getList()
})
</script>


