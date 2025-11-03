<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="企业名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入企业名称" />
      </el-form-item>
      <el-form-item label="营业执照号" prop="licenseNo">
        <el-input v-model="formData.licenseNo" placeholder="请输入营业执照号" />
      </el-form-item>
      <el-form-item label="法定代表人" prop="legalPerson">
        <el-input v-model="formData.legalPerson" placeholder="请输入法定代表人" />
      </el-form-item>
      <el-form-item label="地址" prop="address">
        <el-input v-model="formData.address" placeholder="请输入地址" />
      </el-form-item>
      <el-form-item label="电话" prop="tel">
        <el-input v-model="formData.tel" placeholder="请输入电话" />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="formData.email" placeholder="请输入邮箱" />
      </el-form-item>
      <el-form-item label="开户银行" prop="bankName">
        <el-input v-model="formData.bankName" placeholder="请输入开户银行" />
      </el-form-item>
      <el-form-item label="银行账号" prop="bankAccount">
        <el-input v-model="formData.bankAccount" placeholder="请输入银行账号" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :value="1">启用</el-radio>
          <el-radio :value="0">禁用</el-radio>
        </el-radio-group>
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
import { WorkorderCompanyApi, type WorkorderCompanyVO } from '@/api/workorder/company'

defineOptions({ name: 'CompanyForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  name: '',
  licenseNo: '',
  legalPerson: '',
  address: '',
  tel: '',
  email: '',
  logoUrl: '',
  bankName: '',
  bankAccount: '',
  remark: '',
  status: 1
})
const formRules = reactive({
  name: [{ required: true, message: '企业名称不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增企业' : '修改企业'
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      const data = await WorkorderCompanyApi.get(id)
      formData.value = {
        id: data.id,
        name: data.name || '',
        licenseNo: data.licenseNo || '',
        legalPerson: data.legalPerson || '',
        address: data.address || '',
        tel: data.tel || '',
        email: data.email || '',
        logoUrl: data.logoUrl || '',
        bankName: data.bankName || '',
        bankAccount: data.bankAccount || '',
        remark: data.remark || '',
        status: data.status ?? 1
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
    const data: WorkorderCompanyVO = {
      id: formData.value.id,
      name: formData.value.name,
      licenseNo: formData.value.licenseNo,
      legalPerson: formData.value.legalPerson,
      address: formData.value.address,
      tel: formData.value.tel,
      email: formData.value.email,
      logoUrl: formData.value.logoUrl,
      bankName: formData.value.bankName,
      bankAccount: formData.value.bankAccount,
      remark: formData.value.remark,
      status: formData.value.status
    }
    if (formType.value === 'create') {
      await WorkorderCompanyApi.create(data)
      message.success(t('common.createSuccess'))
    } else {
      await WorkorderCompanyApi.update(data)
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
    licenseNo: '',
    legalPerson: '',
    address: '',
    tel: '',
    email: '',
    logoUrl: '',
    bankName: '',
    bankAccount: '',
    remark: '',
    status: 1
  }
  formRef.value?.resetFields()
}
</script>

