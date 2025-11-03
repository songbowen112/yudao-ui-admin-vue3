<template>
  <!-- 筛选与汇总表格 -->
  <el-row :gutter="16" class="mb-16px">
    <el-col :span="24">
      <el-card shadow="never">
        <template #header>
          <div class="h-3 flex justify-between items-center">
            <span>报价单统计筛选</span>
            <div class="flex items-center gap-12px">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                value-format="YYYY-MM-DD HH:mm:ss"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
                class="!w-340px"
              />
              <el-button type="primary" @click="handleSearch"><Icon icon="ep:search" class="mr-5px" /> 查询</el-button>
              <el-button @click="handleReset"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
            </div>
          </div>
        </template>
        <div class="mb-12px flex items-center" style="gap: 24px;">
          <div>总数量：<b>{{ totalQuantityAll }}</b></div>
          <div>单价成本：<b>3 元</b></div>
          <div>总成本：<b>{{ totalCost.toFixed(2) }} 元</b></div>
        </div>
        <el-skeleton :loading="loading" animated>
          <el-table :data="statsTableData" row-key="month" :stripe="true" :show-overflow-tooltip="true">
            <el-table-column label="月份" prop="month" align="center" min-width="100" />
            <el-table-column label="总条数" prop="totalCount" align="center" min-width="100" />
            <el-table-column label="总数量" prop="totalQuantity" align="center" min-width="100" />
            <el-table-column label="总价款(元)" prop="totalPrice" align="center" min-width="140">
              <template #default="scope">{{ Number(scope.row.totalPrice || 0).toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="总尾款(元)" prop="totalFinalPayment" align="center" min-width="140">
              <template #default="scope">{{ Number(scope.row.totalFinalPayment || 0).toFixed(2) }}</template>
            </el-table-column>
          </el-table>
        </el-skeleton>
      </el-card>
    </el-col>
  </el-row>

  <el-row :gutter="16">
    <!-- 折线图 -->
    <el-col :xl="12" :lg="12" :md="24" :sm="24" :xs="24" class="mb-16px">
      <el-card shadow="never">
        <template #header>
          <div class="h-3 flex justify-between">
            <span>报价单月度趋势</span>
          </div>
        </template>
        <el-skeleton :loading="loading" animated>
          <Echart :options="lineChartOptions" :height="400" />
        </el-skeleton>
      </el-card>
    </el-col>

    <!-- 柱状图 -->
    <el-col :xl="12" :lg="12" :md="24" :sm="24" :xs="24" class="mb-16px">
      <el-card shadow="never">
        <template #header>
          <div class="h-3 flex justify-between">
            <span>报价单月度统计</span>
          </div>
        </template>
        <el-skeleton :loading="loading" animated>
          <Echart :options="barChartOptions" :height="400" />
        </el-skeleton>
      </el-card>
    </el-col>
  </el-row>
</template>
<script lang="ts" setup>
import { EChartsOption } from 'echarts'
import { QuotedPriceOrderApi } from '@/api/workorder/quotedPriceOrder'

defineOptions({ name: 'Index' })

const loading = ref(true)
const dateRange = ref<string[]>([])
const statsTableData = ref<any[]>([])
const totalQuantityAll = computed(() => {
  return statsTableData.value.reduce((sum: number, cur: any) => sum + (Number(cur.totalQuantity) || 0), 0)
})
const unitCost = 3
const totalCost = computed(() => totalQuantityAll.value * unitCost)

// 折线图配置 - 展示总数量和总价款
const lineChartOptions = reactive<EChartsOption>({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross'
    },
    padding: [5, 10],
    formatter: (params: any) => {
      let result = params[0].name + '<br/>'
      params.forEach((item: any) => {
        if (item.seriesName === '总数量') {
          result += `${item.marker}${item.seriesName}: ${item.value}<br/>`
        } else {
          result += `${item.marker}${item.seriesName}: ${item.value.toFixed(2)}元<br/>`
        }
      })
      return result
    }
  },
  legend: {
    data: ['总数量', '总价款'],
    top: 10
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: [],
    axisTick: {
      show: false
    }
  },
  yAxis: [
    {
      type: 'value',
      name: '数量',
      position: 'left',
      axisTick: {
        show: false
      }
    },
    {
      type: 'value',
      name: '金额(元)',
      position: 'right',
      axisTick: {
        show: false
      }
    }
  ],
  series: [
    {
      name: '总数量',
      type: 'line',
      smooth: true,
      data: [],
      itemStyle: {
        color: '#409EFF'
      }
    },
    {
      name: '总价款',
      type: 'line',
      smooth: true,
      yAxisIndex: 1,
      data: [],
      itemStyle: {
        color: '#67C23A'
      }
    }
  ]
}) as EChartsOption

// 柱状图配置 - 展示总价款和总尾款（同一金额轴）
const barChartOptions = reactive<EChartsOption>({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    },
    padding: [5, 10],
    formatter: (params: any) => {
      let result = params[0].name + '<br/>'
      params.forEach((item: any) => {
        result += `${item.marker}${item.seriesName}: ${item.value.toFixed(2)}元<br/>`
      })
      return result
    }
  },
  legend: {
    data: ['总价款', '总尾款'],
    top: 10
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: [],
    axisTick: {
      show: false
    }
  },
  yAxis: [
    {
      type: 'value',
      name: '金额(元)',
      position: 'left',
      axisTick: {
        show: false
      }
    }
  ],
  series: [
    {
      name: '总价款',
      type: 'bar',
      data: [],
      itemStyle: {
        color: '#409EFF'
      }
    },
    {
      name: '总尾款',
      type: 'bar',
      data: [],
      itemStyle: {
        color: '#E6A23C'
      }
    }
  ]
}) as EChartsOption

/** 获取月度统计数据 */
const getMonthlyStatistics = async () => {
  loading.value = true
  try {
    const params =
      Array.isArray(dateRange.value) && dateRange.value.length === 2
        ? { beginTime: dateRange.value[0], endTime: dateRange.value[1] }
        : undefined
    const response = await QuotedPriceOrderApi.getMonthlyStatistics(params)
    console.log('报价单统计数据:', response)

    // 根据接口文档，返回格式为 { code, msg, data: [...] }
    // data 数组中的每个元素包含：month, totalCount, totalQuantity, totalPrice, totalFinalPayment
    let statisticsData: any[] = []
    
    if (response && response.data && Array.isArray(response.data)) {
      statisticsData = response.data
    } else if (Array.isArray(response)) {
      statisticsData = response
    }

    // 如果数据为空，使用空数组
    if (!statisticsData || statisticsData.length === 0) {
      console.warn('统计数据为空')
      statisticsData = []
    }

    // 保存到表格数据
    statsTableData.value = statisticsData

    // 按月份排序（假设month格式为 "YYYY-MM" 或类似格式）
    statisticsData.sort((a, b) => {
      if (a.month && b.month) {
        return a.month.localeCompare(b.month)
      }
      return 0
    })

    // 提取数据
    const months: string[] = []
    const quantities: number[] = [] // 总数量
    const totalPrices: number[] = [] // 总价款
    const totalFinalPayments: number[] = [] // 总尾款

    statisticsData.forEach((item: any) => {
      const month = item.month || ''
      // 格式化月份显示（如果是 "2024-01" 格式，显示为 "2024-01"，也可以根据需要自定义格式）
      months.push(month)
      quantities.push(Number(item.totalQuantity) || 0)
      const price = Number(item.totalPrice) || 0
      const finalPaymentRaw = Number(item.totalFinalPayment) || 0
      totalPrices.push(price)
      totalFinalPayments.push(Math.min(finalPaymentRaw, price))
    })

    console.log('处理后的数据 - 月份:', months)
    console.log('总数量:', quantities)
    console.log('总价款:', totalPrices)
    console.log('总尾款:', totalFinalPayments)

    // 更新折线图数据 - 展示总数量和总价款
    if (lineChartOptions.xAxis && typeof lineChartOptions.xAxis === 'object') {
      if (Array.isArray(lineChartOptions.xAxis)) {
        if (lineChartOptions.xAxis[0]) {
          lineChartOptions.xAxis[0]['data'] = months
        }
      } else {
        lineChartOptions.xAxis['data'] = months
      }
    }
    if (lineChartOptions.series && Array.isArray(lineChartOptions.series)) {
      if (lineChartOptions.series[0]) {
        lineChartOptions.series[0]['data'] = quantities // 总数量
      }
      if (lineChartOptions.series[1]) {
        lineChartOptions.series[1]['data'] = totalPrices // 总价款
      }
    }

    // 更新柱状图数据 - 展示总价款和总尾款
    if (barChartOptions.xAxis && typeof barChartOptions.xAxis === 'object') {
      if (Array.isArray(barChartOptions.xAxis)) {
        if (barChartOptions.xAxis[0]) {
          barChartOptions.xAxis[0]['data'] = months
        }
      } else {
        barChartOptions.xAxis['data'] = months
      }
    }
    if (barChartOptions.series && Array.isArray(barChartOptions.series)) {
      if (barChartOptions.series[0]) {
        barChartOptions.series[0]['data'] = totalPrices // 总价款
      }
      if (barChartOptions.series[1]) {
        barChartOptions.series[1]['data'] = totalFinalPayments // 总尾款
      }
    }
  } catch (error) {
    console.error('获取报价单统计数据失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  getMonthlyStatistics()
})

/** 查询与重置 */
const handleSearch = () => {
  getMonthlyStatistics()
}
const handleReset = () => {
  dateRange.value = []
  getMonthlyStatistics()
}
</script>
