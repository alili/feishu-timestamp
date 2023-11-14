<template lang='pug'>
a-form.form(layout="vertical" auto-label-width :model="fields")
  a-form-item(field="source")
    a-select(v-model="fields.source" :placeholder="$t('source.placeholder')")
      template(#prefix)
        icon-export
      a-option(v-for="item in timestampFields" :key="item.id" :value="item.id") {{ item.name }}

  a-form-item(field="target")
    a-select(
      v-model="fields.target"
      allow-clear
      allow-create
      :placeholder="$t('target.placeholder')")
      template(#prefix)
        icon-import
      a-option(v-for="item in targetFields" :key="item.id" :value="item.id") {{ item.name }}

  a-form-item(field="timezone")
    a-select(v-model="fields.timezone" allow-search :options="timezoneOptions")
      template(#prefix)
        icon-schedule

  a-form-item(field="force")
    a-checkbox(v-model="fields.force")
      | {{ $t('label.force') }}
      a-tooltip
        icon-question-circle
        template(#content) {{ $t('note.forceMode') }}
  a-button(
    type="primary"
    :disabled="!fields.source"
    :loading="loading"
    @click="transform") {{ $t('button.transform') }}
</template>
<script setup name='Transform'>
  import { bitable, FieldType, DateFormatter } from '@lark-base-open/js-sdk'
  import dayjs from 'dayjs'
  import timezoneOptions from '@/store/timezone'
  import { Message } from '@arco-design/web-vue'

  const { updateFieldMetaList, getTable, getFieldsByType, fetchRecords } = useBitable()
  const { table, records, fieldMetaList } = storeToRefs(useBitable())
  // data
  const currentTimezone = new Date().getTimezoneOffset()
  const loading = ref(false)
  const fields = reactive({
    source: '',
    target: '',
    timezone: currentTimezone,
  })
  const timestampFields = ref([])
  const targetFields = ref([])

  const todo = computed(() => records.value.filter(record => record.fields[fields.source] && (fields.force || !record.fields[fields.target])))
  // methods
  const transform = async () => {
    loading.value = true
    let targetFieldId = fieldMetaList.value.find(field => field.id === fields.target)?.id
    if (!targetFieldId) {
      targetFieldId = await table.value.addField({
        type: FieldType.DateTime,
        name: `${fields.target} ${timezoneOptions.find(option => option.value === fields.timezone).label}`,
      })
      const targetField = await table.value.getField(targetFieldId)
      await targetField.setDateFormat(DateFormatter.DATE_TIME_WITH_HYPHEN)
    }

    const updateRecords = todo.value.map(record => {
      let timestamp = record.fields[fields.source][0]?.text || record.fields[fields.source]
      if (!/\d{10,13}/.test(timestamp)) {
        Message.error(t('error.wrong_ype'))
        return
      }
      if (timestamp.length < 11) timestamp *= 1000
      return {
        recordId: record.recordId,
        fields: {
          [targetFieldId]: +dayjs(+timestamp).add(currentTimezone - fields.timezone, 'm'),
        },
      }
    })

    const res = await table.value.setRecords(updateRecords)
    loading.value = false
    refresh()
  }

  const refresh = async () => {
    await updateFieldMetaList()
    await fetchRecords()
    timestampFields.value = getFieldsByType([FieldType.Text, FieldType.DateTime])
    targetFields.value = getFieldsByType([FieldType.DateTime])
  }
  // lifecycle
  onMounted(async () => {
    await getTable()
    refresh()
  })
</script>
<style lang='stylus' rel='stylesheet/stylus' scoped>
  .arco-form-item {
    margin-bottom: 10px;
  }
</style>