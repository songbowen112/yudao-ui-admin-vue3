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
        <el-button type="primary" plain @click="openForm('create')" v-hasPermi="['workorder:quoted-price-order:create']"><Icon icon="ep:plus" class="mr-5px" /> 新增</el-button>
        <el-button type="success" plain @click="handleExport" :loading="exportLoading" v-hasPermi="['workorder:quoted-price-order:export']"><Icon icon="ep:download" class="mr-5px" /> 导出</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table row-key="id" v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column type="selection" width="55" />
      <el-table-column label="工单ID" align="center" prop="id" />
      <el-table-column label="工单名称" align="center" prop="name" />
      <el-table-column label="确认单" align="center" prop="confirmOrderName" />
      <el-table-column label="收款企业" align="center" prop="receiptCompanyName" />
      <el-table-column label="付款企业" align="center" prop="paymentCompanyName" />
      <el-table-column label="单价" align="center" prop="price" />
      <el-table-column label="数量" align="center" prop="quantity" />
      <el-table-column label="总价" align="center" prop="totalPrice" />
      <el-table-column label="预付款" align="center" prop="advancePayment" />
      <el-table-column label="尾款" align="center" prop="finalPayment" />
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">{{ statusMap[scope.row.status] ?? scope.row.status }}</template>
      </el-table-column>
      <el-table-column label="文件类型" align="center" prop="fileType">
        <template #default="scope">{{ getFileTypeName(scope.row.fileType) }}</template>
      </el-table-column>
      <el-table-column label="文件路径" align="center" prop="fileUrl" min-width="200" :show-overflow-tooltip="true" />
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column label="创建时间" align="center" prop="createTime" width="180px" :formatter="dateFormatter" />
      <el-table-column label="操作" align="center" min-width="240px">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('update', scope.row.id)" v-hasPermi="['workorder:quoted-price-order:update']">编辑</el-button>
          <el-button link type="info" @click="handlePreview(scope.row)" v-if="scope.row.fileUrl">预览</el-button>
          <el-button link type="success" @click="handleDownload(scope.row)" v-if="scope.row.fileUrl">下载</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)" v-hasPermi="['workorder:quoted-price-order:delete']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination :total="total" v-model:page="queryParams.pageNo" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <QuotedPriceOrderForm ref="formRef" @success="getList" />

  <!-- 文件预览弹窗 -->
  <Dialog v-model="previewDialogVisible" :title="previewTitle" width="90%" align-center>
    <div v-loading="previewLoading" class="preview-container" :style="{ height: previewHeight }">
      <iframe
        v-if="previewUrl"
        :src="previewUrl"
        frameborder="0"
        class="w-full h-full"
      ></iframe>
      <div v-else class="flex items-center justify-center h-full text-gray-500">
        <p>加载预览中...</p>
      </div>
    </div>
    <template #footer>
      <el-button @click="previewDialogVisible = false">关 闭</el-button>
      <el-button type="primary" @click="handleDownloadFromPreview" v-if="currentPreviewRow?.fileUrl">下载</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import download from '@/utils/download'
import { dateFormatter } from '@/utils/formatTime'
import { QuotedPriceOrderApi, type QuotedPriceOrderVO } from '@/api/workorder/quotedPriceOrder'
import QuotedPriceOrderForm from './QuotedPriceOrderForm.vue'

defineOptions({ name: 'QuotedPriceOrder' })

const message = useMessage()
const { t } = useI18n()

const statusOptions = [
  { label: '初始化', value: 1 },
  { label: '通知完成', value: 2 },
  { label: '通知失败', value: 3 }
]
const statusMap: Record<number, string> = Object.fromEntries(statusOptions.map((i) => [i.value, i.label]))

const loading = ref(true)
const list = ref<QuotedPriceOrderVO[]>([])
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
const formRef = ref<InstanceType<typeof QuotedPriceOrderForm>>() // 表单 Ref

// 文件类型映射
const fileTypeMap: Record<number, string> = {
  1: 'PDF',
  2: 'DOC',
  3: 'XLS'
}

// 预览相关
const previewDialogVisible = ref(false) // 预览弹窗是否显示
const previewLoading = ref(false) // 预览加载状态
const previewUrl = ref('') // 预览URL
const currentPreviewRow = ref<QuotedPriceOrderVO | null>(null) // 当前预览的行数据
const previewHeight = ref('calc(100vh - 300px)') // 预览区域高度

/** 预览弹窗标题 */
const previewTitle = computed(() => {
  if (currentPreviewRow.value) {
    return `预览文件 - ${currentPreviewRow.value.name || `报价单_${currentPreviewRow.value.id}`}`
  }
  return '预览文件'
})

/** 获取文件类型名称 */
const getFileTypeName = (fileType?: number): string => {
  return fileType ? fileTypeMap[fileType] || '-' : '-'
}

const getList = async () => {
  loading.value = true
  try {
    const data = await QuotedPriceOrderApi.getPage(queryParams)
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

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await QuotedPriceOrderApi.delete(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await QuotedPriceOrderApi.export(queryParams)
    download.excel(data, '报价单.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 下载文件 */
const handleDownload = async (row: QuotedPriceOrderVO) => {
  if (!row.id) {
    message.warning('报价单ID不存在，无法下载')
    return
  }
  
  try {
    // 获取文件名，如果没有则使用默认名称
    const fileName = row.name || `报价单_${row.id}`
    const fileExtension = getFileExtension(row.fileType)
    const fullFileName = `${fileName}${fileExtension}`
    
    // 调用后端下载接口
    const data = await QuotedPriceOrderApi.download(row.id)
    
    // 根据文件类型选择合适的下载方法和MIME类型
    let mimeType = 'application/octet-stream'
    switch (row.fileType) {
      case 1: // PDF
        mimeType = 'application/pdf'
        break
      case 2: // DOC
        mimeType = 'application/msword'
        break
      case 3: // XLS
        mimeType = 'application/vnd.ms-excel'
        break
    }
    
    // 使用通用下载方法
    const blob = new Blob([data], { type: mimeType })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fullFileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    message.success('文件下载成功')
  } catch (error) {
    console.error('下载文件失败:', error)
    message.error('文件下载失败，请稍后重试')
  }
}

/** 根据文件类型获取文件扩展名 */
const getFileExtension = (fileType?: number): string => {
  const extensionMap: Record<number, string> = {
    1: '.pdf',
    2: '.doc',
    3: '.xls'
  }
  return extensionMap[fileType || 1] || '.pdf'
}

/** 预览文件 */
const handlePreview = async (row: QuotedPriceOrderVO) => {
  if (!row.id) {
    message.warning('报价单ID不存在，无法预览')
    return
  }
  
  // PDF文件支持预览，DOC和XLS不支持在线预览
  if (row.fileType !== 1) {
    message.info('该文件类型暂不支持在线预览，请使用下载功能查看')
    return
  }
  
  currentPreviewRow.value = row
  previewDialogVisible.value = true
  previewLoading.value = true
  previewUrl.value = ''
  
  try {
    // 通过下载接口获取文件blob，然后创建blob URL用于预览
    const data = await QuotedPriceOrderApi.download(row.id)
    
    // 创建blob URL用于预览
    const blob = new Blob([data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    previewUrl.value = url
  } catch (error) {
    console.error('预览文件失败:', error)
    message.error('预览文件失败，请稍后重试')
  } finally {
    previewLoading.value = false
  }
}

// 监听预览弹窗关闭，释放blob URL
watch(previewDialogVisible, (visible) => {
  if (!visible && previewUrl.value) {
    // 释放之前创建的blob URL
    window.URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
  }
})

/** 从预览弹窗下载文件 */
const handleDownloadFromPreview = () => {
  if (currentPreviewRow.value) {
    previewDialogVisible.value = false
    handleDownload(currentPreviewRow.value)
  }
}

onMounted(() => {
  getList()
})
</script>


