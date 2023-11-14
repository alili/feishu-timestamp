import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { bitable, FieldType, IOpenSegmentType } from '@lark-base-open/js-sdk'

const useBitableStore = defineStore('bitabel', () => {
  const pageSize = 5000
  const table = shallowRef({})
  const records = ref([])
  const fieldMetaList = ref([])
  const currentCell = ref({})
  const init = ref(false)

  const getTable = async () => {
    init.value = true
    table.value = await bitable.base.getActiveTable()
    init.value = false
  }

  const updateFieldMetaList = async () => {
    init.value = true
    const view = await table.value.getActiveView()
    fieldMetaList.value = await view.getFieldMetaList()
    init.value = false
  }

  const fetchRecords = async () => {
    init.value = true
    let hasMore = true
    let pageToken = ''
    let tempRecords = []

    while (hasMore) {
      const res = await table.value.getRecords({ pageToken, pageSize })

      hasMore = res.hasMore
      pageToken = res.pageToken
      tempRecords = tempRecords.concat(res.records)
    }
    records.value = tempRecords
    init.value = false
  }

  const getFieldsByType = type => {
    if (!Array.isArray(type)) type = [type]
    return fieldMetaList.value.filter(field => type.includes(field.type))
  }

  return {
    table,
    records,
    fieldMetaList,
    getTable,
    fetchRecords,
    getFieldsByType,
    updateFieldMetaList,
    currentCell,
    init,
  }
})

export default useBitableStore
