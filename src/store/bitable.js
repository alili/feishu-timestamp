import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { bitable, FieldType, IOpenSegmentType } from '@lark-base-open/js-sdk'

const useBitableStore = defineStore('bitabel', () => {
  const pageSize = 5000
  const table = shallowRef({})
  const records = ref([])
  const fieldMetaList = ref([])
  const currentCell = ref({})

  const getTable = async () => {
    table.value = await bitable.base.getActiveTable()
  }

  const updateFieldMetaList = async () => {
    const { viewId } = await bitable.base.getSelection()
    const view = await table.value.getViewById(viewId)
    fieldMetaList.value = await view.getFieldMetaList()
  }

  const fetchRecords = async () => {
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
  }
})

export default useBitableStore
