<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="工单名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入工单名称" />
      </el-form-item>
      <el-form-item label="收款企业" prop="receiptCompanyId">
        <el-select
          v-model="formData.receiptCompanyId"
          placeholder="请选择收款企业"
          clearable
          filterable
          class="w-full"
          @change="handleReceiptCompanyChange"
        >
          <el-option
            v-for="item in companyList"
            :key="item.id"
            :label="item.name"
            :value="item.id!"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="付款企业" prop="paymentCompanyId">
        <el-select
          v-model="formData.paymentCompanyId"
          placeholder="请选择付款企业"
          clearable
          filterable
          class="w-full"
          @change="handlePaymentCompanyChange"
        >
          <el-option
            v-for="item in companyList"
            :key="item.id"
            :label="item.name"
            :value="item.id!"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="一级标签" prop="parentTagIds">
        <el-select
          v-model="formData.parentTagIds"
          placeholder="请选择一级标签（可多选）"
          multiple
          clearable
          class="w-full"
          @change="handleParentTagChange"
        >
          <el-option
            v-for="item in parentTagList"
            :key="item.id"
            :label="item.tagName"
            :value="item.id!"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="二级标签" prop="tagIds">
        <el-select
          v-model="formData.tagIds"
          placeholder="请选择二级标签（可多选）"
          multiple
          clearable
          class="w-full"
          :disabled="!formData.parentTagIds || formData.parentTagIds.length === 0"
        >
          <el-option
            v-for="item in secondTagList"
            :key="item.id"
            :label="item.tagName"
            :value="item.id!"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="文件类型" prop="fileType">
        <el-select v-model="formData.fileType" placeholder="请选择文件类型" class="w-full">
          <el-option :value="1" label="PDF" />
          <el-option :value="2" label="DOC" />
          <el-option :value="3" label="XLS" />
        </el-select>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="formData.remark"
          type="textarea"
          :rows="3"
          placeholder="请输入备注"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ConfirmOrderApi, type ConfirmOrderVO } from '@/api/workorder/confirmOrder'
import { WorkorderCompanyApi, type WorkorderCompanyVO } from '@/api/workorder/company'
import { WorkorderTagApi, type WorkorderTagVO } from '@/api/workorder/tag'

defineOptions({ name: 'ConfirmOrderForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  name: '',
  receiptCompanyId: undefined as number | undefined,
  receiptCompanyName: '',
  paymentCompanyId: undefined as number | undefined,
  paymentCompanyName: '',
  parentTagIds: [] as number[],
  tagIds: [] as number[],
  fileType: 1,
  remark: ''
})
const formRules = reactive({
  name: [{ required: true, message: '工单名称不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

const companyList = ref<WorkorderCompanyVO[]>([]) // 企业列表
const parentTagList = ref<WorkorderTagVO[]>([]) // 一级标签列表
const secondTagList = ref<WorkorderTagVO[]>([]) // 二级标签列表

/** 获取企业列表 */
const getCompanyList = async () => {
  try {
    const data = await WorkorderCompanyApi.getList({ status: 1 })
    companyList.value = data
  } catch {}
}

/** 获取一级标签列表 */
const getParentTagList = async () => {
  try {
    const data = await WorkorderTagApi.getParentTagList()
    parentTagList.value = data
  } catch {}
}

/** 一级标签改变时，加载对应的二级标签 */
const handleParentTagChange = async (parentTagIds: number[] | undefined) => {
  // 清空二级标签选择
  formData.value.tagIds = []
  secondTagList.value = []

  if (parentTagIds && parentTagIds.length > 0) {
    try {
      const data = await WorkorderTagApi.getTagListByParents(parentTagIds)
      secondTagList.value = data
    } catch {}
  }
}

/** 收款企业改变时，更新企业名称 */
const handleReceiptCompanyChange = (companyId: number | undefined) => {
  if (companyId) {
    const company = companyList.value.find((item) => item.id === companyId)
    formData.value.receiptCompanyName = company?.name || ''
  } else {
    formData.value.receiptCompanyName = ''
  }
}

/** 付款企业改变时，更新企业名称 */
const handlePaymentCompanyChange = (companyId: number | undefined) => {
  if (companyId) {
    const company = companyList.value.find((item) => item.id === companyId)
    formData.value.paymentCompanyName = company?.name || ''
  } else {
    formData.value.paymentCompanyName = ''
  }
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增确认单' : '修改确认单'
  formType.value = type
  resetForm()
  // 加载下拉框数据
  await Promise.all([getCompanyList(), getParentTagList()])
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      const data = await ConfirmOrderApi.get(id)
      formData.value = {
        id: data.id,
        name: data.name || '',
        receiptCompanyId: data.receiptCompanyId,
        receiptCompanyName: data.receiptCompanyName || '',
        paymentCompanyId: data.paymentCompanyId,
        paymentCompanyName: data.paymentCompanyName || '',
        tagIds: data.tagIds ? data.tagIds.split(',').map(Number).filter((id) => id > 0) : [],
        fileType: data.fileType ?? 1,
        remark: data.remark || ''
      }
      // 如果有选中的二级标签，加载对应的一级标签和二级标签列表
      if (formData.value.tagIds.length > 0) {
        // 需要根据二级标签反推一级标签，遍历所有一级标签找到匹配的
        const matchedParentTagIds: number[] = []
        for (const parentTag of parentTagList.value) {
          try {
            const secondTags = await WorkorderTagApi.getTagListByParent(parentTag.id!)
            const hasMatch = secondTags.some((tag) => formData.value.tagIds.includes(tag.id!))
            if (hasMatch) {
              matchedParentTagIds.push(parentTag.id!)
            }
          } catch {
            // 忽略错误，继续查找
          }
        }
        // 如果找到了匹配的一级标签，加载对应的二级标签列表
        if (matchedParentTagIds.length > 0) {
          formData.value.parentTagIds = matchedParentTagIds
          try {
            const allSecondTags = await WorkorderTagApi.getTagListByParents(matchedParentTagIds)
            secondTagList.value = allSecondTags
          } catch {
            // 忽略错误
          }
        }
      }
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const tagIdsArray = formData.value.tagIds as number[]
    // 将二级标签数组转换为逗号分隔的字符串
    const tagIdsString = Array.isArray(tagIdsArray) && tagIdsArray.length > 0 
      ? tagIdsArray.join(',') 
      : ''
    
    const data: ConfirmOrderVO = {
      id: formData.value.id,
      name: formData.value.name,
      receiptCompanyId: formData.value.receiptCompanyId,
      receiptCompanyName: formData.value.receiptCompanyName,
      paymentCompanyId: formData.value.paymentCompanyId,
      paymentCompanyName: formData.value.paymentCompanyName,
      tagIds: tagIdsString,
      fileType: formData.value.fileType,
      remark: formData.value.remark
    }
    // 确保企业名称已设置
    if (data.receiptCompanyId && !data.receiptCompanyName) {
      const company = companyList.value.find((item) => item.id === data.receiptCompanyId)
      if (company) {
        data.receiptCompanyName = company.name || ''
      }
    }
    if (data.paymentCompanyId && !data.paymentCompanyName) {
      const company = companyList.value.find((item) => item.id === data.paymentCompanyId)
      if (company) {
        data.paymentCompanyName = company.name || ''
      }
    }
    if (formType.value === 'create') {
      await ConfirmOrderApi.create(data)
      message.success(t('common.createSuccess'))
    } else {
      await ConfirmOrderApi.update(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    name: '',
    receiptCompanyId: undefined,
    receiptCompanyName: '',
    paymentCompanyId: undefined,
    paymentCompanyName: '',
    parentTagIds: [],
    tagIds: [],
    fileType: 1,
    remark: ''
  }
  secondTagList.value = []
  formRef.value?.resetFields()
}
</script>
