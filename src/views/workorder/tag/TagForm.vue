<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="一级标签" prop="parentTagId">
        <el-select
          v-model="formData.parentTagId"
          placeholder="请选择一级标签（不选则为一级标签）"
          clearable
          class="w-full"
        >
          <el-option
            v-for="item in parentTagList"
            :key="item.id"
            :label="item.tagName"
            :value="item.id!"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="标签名称" prop="tagName">
        <el-input v-model="formData.tagName" placeholder="请输入标签名称" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :value="1">启用</el-radio>
          <el-radio :value="0">禁用</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { WorkorderTagApi, type WorkorderTagVO } from '@/api/workorder/tag'

defineOptions({ name: 'WorkorderTagForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  tagName: '',
  parentTagId: undefined as number | undefined,
  status: 1
})
const formRules = reactive({
  tagName: [{ required: true, message: '标签名称不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const parentTagList = ref<WorkorderTagVO[]>([]) // 一级标签列表

/** 获取一级标签列表 */
const getParentTagList = async () => {
  try {
    const data = await WorkorderTagApi.getParentTagList()
    parentTagList.value = data
  } catch {}
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增标签' : '修改标签'
  formType.value = type
  resetForm()
  // 加载一级标签列表
  await getParentTagList()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      const data = await WorkorderTagApi.get(id)
      formData.value = {
        id: data.id,
        tagName: data.tagName || '',
        parentTagId: data.parentTagId,
        status: data.status ?? 1
      }
      // 如果 parentTagId 为 -1、null 或 undefined，则设为 undefined（表示一级标签）
      if (
        formData.value.parentTagId === -1 ||
        formData.value.parentTagId === null ||
        formData.value.parentTagId === undefined
      ) {
        formData.value.parentTagId = undefined
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
    const data = { ...formData.value } as WorkorderTagVO
    // 如果 parentTagId 为 undefined 或 null，设置为 -1（表示一级标签）
    if (data.parentTagId === undefined || data.parentTagId === null) {
      data.parentTagId = -1
    }
    if (formType.value === 'create') {
      await WorkorderTagApi.create(data)
      message.success(t('common.createSuccess'))
    } else {
      await WorkorderTagApi.update(data)
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
    tagName: '',
    parentTagId: undefined,
    status: 1
  }
  formRef.value?.resetFields()
}
</script>
