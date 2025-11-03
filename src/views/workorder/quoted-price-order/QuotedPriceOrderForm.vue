<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="120px"
    >
      <el-form-item label="确认单" prop="confirmOrderId">
        <el-select
          v-model="formData.confirmOrderId"
          placeholder="请选择确认单"
          clearable
          filterable
          class="w-full"
          :disabled="formType === 'update'"
          @change="handleConfirmOrderChange"
        >
          <el-option
            v-for="item in confirmOrderList"
            :key="item.id"
            :label="item.name"
            :value="item.id!"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="工单名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入工单名称" />
      </el-form-item>
      <el-form-item label="收款企业" prop="receiptCompanyId">
        <el-select
          v-model="formData.receiptCompanyId"
          placeholder="收款企业将自动填充"
          filterable
          class="w-full"
          disabled
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
          placeholder="请先选择确认单，付款企业将自动回填"
          filterable
          class="w-full"
          disabled
        >
          <el-option
            v-for="item in companyList"
            :key="item.id"
            :label="item.name"
            :value="item.id!"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="单价" prop="price">
        <el-input-number v-model="formData.price" :precision="2" :min="0" :max="999999999" controls-position="right" class="w-full" placeholder="请输入单价" @change="calculatePrices" />
      </el-form-item>
      <el-form-item label="数量" prop="quantity">
        <el-input-number v-model="formData.quantity" :precision="0" :min="1" :max="999999" controls-position="right" class="w-full" placeholder="请输入数量" @change="calculatePrices" />
      </el-form-item>
      <el-form-item label="总价" prop="totalPrice">
        <el-input-number v-model="formData.totalPrice" :precision="2" :min="0" :max="999999999" controls-position="right" class="w-full" placeholder="自动计算" disabled />
      </el-form-item>
      <el-form-item label="预付款" prop="advancePayment">
        <el-input-number v-model="formData.advancePayment" :precision="2" :min="0" :max="999999999" controls-position="right" class="w-full" placeholder="自动计算（总价的30%）" disabled />
      </el-form-item>
      <el-form-item label="尾款" prop="finalPayment">
        <el-input-number v-model="formData.finalPayment" :precision="2" :min="0" :max="999999999" controls-position="right" class="w-full" placeholder="自动计算（总价-预付款）" disabled />
      </el-form-item>
      <el-form-item label="文件类型" prop="fileType">
        <el-select v-model="formData.fileType" placeholder="请选择文件类型" class="w-full">
          <el-option :value="1" label="PDF" />
          <el-option :value="2" label="DOC" />
          <el-option :value="3" label="XLS" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { QuotedPriceOrderApi, type QuotedPriceOrderVO } from '@/api/workorder/quotedPriceOrder'
import { ConfirmOrderApi, type ConfirmOrderVO } from '@/api/workorder/confirmOrder'
import { WorkorderCompanyApi, type WorkorderCompanyVO } from '@/api/workorder/company'

defineOptions({ name: 'QuotedPriceOrderForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  name: '',
  confirmOrderId: undefined as number | undefined,
  confirmOrderName: '',
  receiptCompanyId: undefined as number | undefined,
  receiptCompanyName: '',
  paymentCompanyId: undefined as number | undefined,
  paymentCompanyName: '',
  price: 0,
  quantity: 1,
  totalPrice: 0,
  advancePayment: 0,
  finalPayment: 0,
  fileType: 1
})
const formRules = reactive({
  confirmOrderId: [{ required: true, message: '确认单不能为空', trigger: 'change' }],
  name: [{ required: true, message: '工单名称不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

const confirmOrderList = ref<ConfirmOrderVO[]>([]) // 确认单列表（初始化状态）
const companyList = ref<WorkorderCompanyVO[]>([]) // 企业列表

const selectedConfirmOrder = ref<ConfirmOrderVO | null>(null) // 选中的确认单


/** 获取初始化状态的确认单列表 */
const getInitStatusConfirmOrderList = async () => {
  try {
    const data = await ConfirmOrderApi.listInitStatus()
    confirmOrderList.value = data
  } catch {}
}

/** 获取企业列表 */
const getCompanyList = async () => {
  try {
    const data = await WorkorderCompanyApi.getList({ status: 1 })
    companyList.value = data
  } catch {}
}

/** 获取收款企业（根据isOwn=1） */
const getReceiptCompany = async () => {
  try {
    const data = await WorkorderCompanyApi.getByIsOwn(1)
    if (data && data.id) {
      formData.value.receiptCompanyId = data.id
      formData.value.receiptCompanyName = data.name || ''
      // 如果企业不在列表中，添加到列表以便显示
      const existsInList = companyList.value.some(item => item.id === data.id)
      if (!existsInList) {
        companyList.value.push(data)
      }
    }
  } catch (error) {
    console.error('获取收款企业失败:', error)
  }
}

/** 计算总价、预付款、尾款 */
const calculatePrices = () => {
  // 总价 = 单价 × 数量
  formData.value.totalPrice = Number((formData.value.price * formData.value.quantity).toFixed(2))
  // 预付款 = 总价 × 30%
  formData.value.advancePayment = Number((formData.value.totalPrice * 0.3).toFixed(2))
  // 尾款 = 总价 - 预付款
  formData.value.finalPayment = Number((formData.value.totalPrice - formData.value.advancePayment).toFixed(2))
}

/** 确认单改变时，自动回填企业信息和工单名称 */
const handleConfirmOrderChange = async (confirmOrderId: number | undefined) => {
  formData.value.confirmOrderName = ''
  selectedConfirmOrder.value = null

  if (confirmOrderId) {
    // 获取确认单详情
    try {
      const data = await ConfirmOrderApi.get(confirmOrderId)
      selectedConfirmOrder.value = data
      formData.value.confirmOrderName = data.name || ''
      
      // 根据确认单的工单名称自动回填报价单工单名称
      if (data.name) {
        formData.value.name = data.name
      }
      
      // 根据确认单的标的企业自动回填付款企业
      if (data.contractCompanyId) {
        formData.value.paymentCompanyId = data.contractCompanyId
        formData.value.paymentCompanyName = data.contractCompanyName || ''
      }
    } catch {
      // 忽略错误
    }
  } else {
    // 清空确认单时，清空相关回填信息
    formData.value.name = ''
    formData.value.paymentCompanyId = undefined
    formData.value.paymentCompanyName = ''
  }
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增报价单' : '修改报价单'
  formType.value = type
  resetForm()
  // 加载下拉框数据
  await Promise.all([getInitStatusConfirmOrderList(), getCompanyList()])
  // 新增时，自动获取并填充收款企业
  if (type === 'create') {
    await getReceiptCompany()
  }
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      const data = await QuotedPriceOrderApi.get(id)
      formData.value = {
        id: data.id,
        name: data.name || '',
        confirmOrderId: data.confirmOrderId,
        confirmOrderName: data.confirmOrderName || '',
        receiptCompanyId: data.receiptCompanyId,
        receiptCompanyName: data.receiptCompanyName || '',
        paymentCompanyId: data.paymentCompanyId,
        paymentCompanyName: data.paymentCompanyName || '',
        price: data.price ?? 0,
        quantity: data.quantity ?? 1,
        totalPrice: data.totalPrice ?? 0,
        advancePayment: data.advancePayment ?? 0,
        finalPayment: data.finalPayment ?? 0,
        fileType: data.fileType ?? 1
      }
      
      // 修改时自动计算价格（如果单价和数量已存在）
      calculatePrices()
      
      // 修改时，确保收款企业信息完整（如果企业不在列表中，添加到列表）
      if (data.receiptCompanyId) {
        const existsInList = companyList.value.some(item => item.id === data.receiptCompanyId)
        if (!existsInList && data.receiptCompanyName) {
          companyList.value.push({
            id: data.receiptCompanyId,
            name: data.receiptCompanyName
          })
        }
      }
      
      // 如果修改时有确认单ID，加载确认单信息（但不允许修改）
      if (data.confirmOrderId) {
        try {
          const confirmOrderData = await ConfirmOrderApi.get(data.confirmOrderId)
          selectedConfirmOrder.value = confirmOrderData
          formData.value.confirmOrderName = confirmOrderData.name || ''
          
          // 如果当前确认单不在列表中（可能不是初始化状态），添加到列表中以便显示名称
          const existsInList = confirmOrderList.value.some(item => item.id === data.confirmOrderId)
          if (!existsInList && confirmOrderData) {
            confirmOrderList.value.push(confirmOrderData)
          }
          
          // 修改时，如果工单名称为空，则根据确认单自动回填
          if (!formData.value.name && confirmOrderData.name) {
            formData.value.name = confirmOrderData.name
          }
          
          // 修改时，如果付款企业为空，则根据确认单的标的企业自动回填
          if (!formData.value.paymentCompanyId && confirmOrderData.contractCompanyId) {
            formData.value.paymentCompanyId = confirmOrderData.contractCompanyId
            formData.value.paymentCompanyName = confirmOrderData.contractCompanyName || ''
          }
        } catch {
          // 忽略错误
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
    // 确保价格已计算
    calculatePrices()
    
    const data: QuotedPriceOrderVO = {
      id: formData.value.id,
      name: formData.value.name,
      confirmOrderId: formData.value.confirmOrderId,
      confirmOrderName: formData.value.confirmOrderName,
      receiptCompanyId: formData.value.receiptCompanyId,
      receiptCompanyName: formData.value.receiptCompanyName,
      paymentCompanyId: formData.value.paymentCompanyId,
      paymentCompanyName: formData.value.paymentCompanyName,
      price: formData.value.price,
      quantity: formData.value.quantity,
      totalPrice: formData.value.totalPrice,
      advancePayment: formData.value.advancePayment,
      finalPayment: formData.value.finalPayment,
      fileType: formData.value.fileType
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
    // 确保确认单名称已设置
    if (data.confirmOrderId && !data.confirmOrderName) {
      const confirmOrder = confirmOrderList.value.find((item) => item.id === data.confirmOrderId)
      if (confirmOrder) {
        data.confirmOrderName = confirmOrder.name || ''
      }
    }
    if (formType.value === 'create') {
      await QuotedPriceOrderApi.create(data)
      message.success(t('common.createSuccess'))
    } else {
      await QuotedPriceOrderApi.update(data)
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
    confirmOrderId: undefined,
    confirmOrderName: '',
    receiptCompanyId: undefined,
    receiptCompanyName: '',
    paymentCompanyId: undefined,
    paymentCompanyName: '',
    price: 0,
    quantity: 1,
    totalPrice: 0,
    advancePayment: 0,
    finalPayment: 0,
    fileType: 1
  }
  selectedConfirmOrder.value = null
  formRef.value?.resetFields()
}
</script>
