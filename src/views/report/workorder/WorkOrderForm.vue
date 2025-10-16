<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="工单名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入工单名称" />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" placeholder="请输入备注" />
      </el-form-item>
      <el-form-item label="区域ID" prop="areaId">
        <el-input v-model="formData.areaId" placeholder="请输入区域ID" />
      </el-form-item>
      <el-form-item label="标签ID列表" prop="tagIds">
        <el-checkbox-group v-model="formData.tagIds">
          <el-checkbox
            v-for="dict in getStrDictOptions(DICT_TYPE.TAG_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-checkbox-group>
      </el-form-item>
      <el-form-item v-if="formType === 'update'" label="工单状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.WORK_ORDER_STATUS)"
            :key="dict.value"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { getIntDictOptions, getStrDictOptions, DICT_TYPE } from '@/utils/dict'
import { WorkOrderApi, WorkOrder } from '@/api/report/workorder'

/** 工单信息 表单 */
defineOptions({ name: 'WorkOrderForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  name: undefined,
  remark: undefined,
  areaId: undefined,
  tagIds: [],
  status: undefined
})
const formRules = reactive({
  name: [{ required: true, message: '工单名称不能为空', trigger: 'blur' }],
  areaId: [{ required: true, message: '区域ID不能为空', trigger: 'blur' }],
  tagIds: [{ required: false, message: '标签ID列表不能为空', trigger: 'blur' }],
  status: [{ required: false, message: '工单状态不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      const data = await WorkOrderApi.getWorkOrder(id)
      // ✅ 关键修复：后端返回的 tagIds 若为字符串，则转为数组
      if (typeof data.tagIds === 'string' && data.tagIds.length > 0) {
        data.tagIds = data.tagIds.split(',')
      } else if (!data.tagIds) {
        data.tagIds = []
      }
      formData.value = data
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
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as WorkOrder
    data.tagIds = Array.isArray(data.tagIds) ? data.tagIds.join(',') : data.tagIds

    if (formType.value === 'create') {
      await WorkOrderApi.createWorkOrder(data)
      message.success(t('common.createSuccess'))
    } else {
      await WorkOrderApi.updateWorkOrder(data)
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
    name: undefined,
    remark: undefined,
    areaId: undefined,
    tagIds: [],
    status: undefined
  }
  formRef.value?.resetFields()
}
</script>
