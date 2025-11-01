<template>
  <ContentWrap>
    <el-form class="-mb-15px" :model="queryParams" ref="queryFormRef" :inline="true" label-width="88px">
      <el-form-item label="企业名称" prop="name">
        <el-input v-model="queryParams.name" placeholder="请输入企业名称" clearable @keyup.enter="handleQuery" class="!w-240px" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="!w-240px">
          <el-option :value="1" label="启用" />
          <el-option :value="0" label="禁用" />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker v-model="queryParams.createTime" value-format="YYYY-MM-DD HH:mm:ss" type="daterange" start-placeholder="开始日期" end-placeholder="结束日期" :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]" class="!w-220px" />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button type="primary" plain @click="openForm('create')" v-hasPermi="['workorder:company:create']"><Icon icon="ep:plus" class="mr-5px" /> 新增</el-button>
        <el-button type="success" plain @click="handleExport" :loading="exportLoading" v-hasPermi="['workorder:company:export']"><Icon icon="ep:download" class="mr-5px" /> 导出</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table row-key="id" v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column type="selection" width="55" />
      <el-table-column label="企业ID" align="center" prop="id" />
      <el-table-column label="企业名称" align="center" prop="name" />
      <el-table-column label="简称" align="center" prop="shortName" />
      <el-table-column label="营业执照号" align="center" prop="licenseNo" />
      <el-table-column label="法定代表人" align="center" prop="legalPerson" />
      <el-table-column label="电话" align="center" prop="tel" />
      <el-table-column label="邮箱" align="center" prop="email" />
      <el-table-column label="开户银行" align="center" prop="bankName" />
      <el-table-column label="银行账号" align="center" prop="bankAccount" />
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">{{ scope.row.status === 1 ? '启用' : '禁用' }}</template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180px" :formatter="dateFormatter" />
      <el-table-column label="操作" align="center" min-width="120px">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('update', scope.row.id)" v-hasPermi="['workorder:company:update']">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)" v-hasPermi="['workorder:company:delete']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination :total="total" v-model:page="queryParams.pageNo" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </ContentWrap>
</template>

<script setup lang="ts">
import download from '@/utils/download'
import { dateFormatter } from '@/utils/formatTime'
import { WorkorderCompanyApi, type WorkorderCompanyVO } from '@/api/workorder/company'

defineOptions({ name: 'WorkorderCompany' })

const message = useMessage()
const { t } = useI18n()

const loading = ref(true)
const list = ref<WorkorderCompanyVO[]>([])
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
    const data = await WorkorderCompanyApi.getPage(queryParams)
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
    await WorkorderCompanyApi.delete(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await WorkorderCompanyApi.export(queryParams)
    download.excel(data, '企业.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

onMounted(() => {
  getList()
})
</script>


