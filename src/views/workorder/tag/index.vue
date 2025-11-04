<template>
  <ContentWrap>
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="88px"
    >
      <el-form-item label="标签名称" prop="tagName">
        <el-input
          v-model="queryParams.tagName"
          placeholder="请输入标签名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="一级标签" prop="parentTagId">
        <el-select
          v-model="queryParams.parentTagId"
          placeholder="请选择一级标签"
          clearable
          @change="handleParentTagChange"
          class="!w-240px"
        >
          <el-option
            v-for="item in parentTagList"
            :key="item.id"
            :label="item.tagName"
            :value="item.id!"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="二级标签" prop="tagId">
        <el-select
          v-model="queryParams.tagId"
          placeholder="请选择二级标签"
          clearable
          class="!w-240px"
          :disabled="!queryParams.parentTagId"
        >
          <el-option
            v-for="item in secondTagList"
            :key="item.id"
            :label="item.tagName"
            :value="item.id!"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="!w-240px">
          <el-option :value="1" label="启用" />
          <el-option :value="0" label="禁用" />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-220px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['workorder:tag:create']"
          ><Icon icon="ep:plus" class="mr-5px" /> 新增</el-button
        >
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table
      row-key="id"
      v-loading="loading"
      :data="list"
      :stripe="true"
      :show-overflow-tooltip="true"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column label="标签ID" align="center" prop="id" />
      <el-table-column label="标签名称" align="center" prop="tagName" />
      <el-table-column label="父级标签ID" align="center" prop="parentTagId" />
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">{{ scope.row.status === 1 ? '启用' : '禁用' }}</template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        width="120px"
        :formatter="dateFormatter2"
      />
      <el-table-column label="操作" align="center" min-width="120px">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['workorder:tag:update']"
            >编辑</el-button
          >
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['workorder:tag:delete']"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <TagForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import download from '@/utils/download'
import { dateFormatter2 } from '@/utils/formatTime'
import { WorkorderTagApi, type WorkorderTagVO } from '@/api/workorder/tag'
import TagForm from './TagForm.vue'

defineOptions({ name: 'WorkorderTag' })

const message = useMessage()
const { t } = useI18n()

const loading = ref(true)
const list = ref<WorkorderTagVO[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  tagName: undefined,
  parentTagId: undefined,
  tagId: undefined,
  status: undefined,
  createTime: [] as string[]
})
const queryFormRef = ref()
const exportLoading = ref(false)
const parentTagList = ref<WorkorderTagVO[]>([])
const secondTagList = ref<WorkorderTagVO[]>([])
const formRef = ref<InstanceType<typeof TagForm>>() // 表单 Ref

const getList = async () => {
  loading.value = true
  try {
    const data = await WorkorderTagApi.getPage(queryParams)
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
  secondTagList.value = []
  handleQuery()
}

// 获取一级标签列表
const getParentTagList = async () => {
  try {
    const data = await WorkorderTagApi.getParentTagList()
    parentTagList.value = data
  } catch {}
}

// 一级标签改变时，加载对应的二级标签
const handleParentTagChange = async (parentTagId: number | undefined) => {
  // 清空二级标签选择
  queryParams.tagId = undefined
  secondTagList.value = []

  if (parentTagId) {
    try {
      const data = await WorkorderTagApi.getTagListByParent(parentTagId)
      secondTagList.value = data
    } catch {}
  }
}

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await WorkorderTagApi.delete(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await WorkorderTagApi.export(queryParams)
    download.excel(data, '标签.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

onMounted(() => {
  getList()
  getParentTagList()
})
</script>
