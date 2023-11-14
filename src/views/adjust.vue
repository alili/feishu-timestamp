<template lang='pug'>
template(v-if="showDatetime")
  a-form(v-model="form" layout="vertical" auto-label-width)
    a-card(size="mini")
      a-form-item(:label="$t('label.timePreview')")
        a-date-picker(
          v-model="form.date"
          format="YYYY-MM-DD HH:mm:ss"
          readonly
          show-time)

      a-space(size="large")
        a-statistic(:value="dayjs(form.date).week()")
          template(#suffix) {{ $t('label.weeks') }}
        a-statistic(:value="dayjs(form.date).dayOfYear()")
          template(#suffix) {{ $t('label.day') }}
        a-statistic(:value="dayjs(form.date).day() || 7")
          template(#prefix) {{ $t('label.week') }}
    a-form-item(:label="$t('label.adjust')")
      a-select(
        v-model="form.adjust"
        allow-search
        :filter-option="false"
        :options="filteredAdjustMap"
        :search-delay="10"
        @change="handleAdjust"
        @search="handleSearch")
        template(#header)
          span(v-if="!changeMode") {{ $t('change.notice') }}
          template(v-else)
            div {{ $t('change.support') }}
            code {{ $t('change.units') }}
a-empty(v-else)
  template(#image)
    icon-exclamation-circle-fill
  span {{ $t('note.onlyDataTime') }}
</template>
<script setup name='Change'>
  import { FieldType } from '@lark-base-open/js-sdk'
  import dayjs from 'dayjs'
  import weekOfYear from 'dayjs/plugin/weekOfYear'
  import dayOfYear from 'dayjs/plugin/dayOfYear'

  import { reactive, watch } from 'vue'
  import { useI18n } from '@arco-design/web-vue/es/locale'

  dayjs.extend(weekOfYear)
  dayjs.extend(dayOfYear)
  // data
  const { t } = useI18n()
  const { table, currentCell, fieldMetaList } = storeToRefs(useBitable())
  const form = reactive({
    date: 0,
    adjust: '',
  })
  const changeMode = ref(false)
  const showDatetime = ref(false)
  // methods

  watch(currentCell, async ({ fieldId, recordId }, oldVal) => {
    const record = await table.value.getRecordById(recordId)
    if (fieldMetaList.value.find(field => field.id === fieldId)?.type !== FieldType.DateTime) {
      showDatetime.value = false
      return
    }
    showDatetime.value = true
    const cell = record.fields[fieldId]?.[0]?.text || record.fields[fieldId]
    form.date = cell.length < 11 ? cell * 1000 : cell
  })

  const handleAdjust = () => {
    const { fieldId, recordId } = currentCell.value

    switch (form.adjust) {
      case 'today':
      case 'now':
        form.date = dayjs().valueOf()
        break
      default:
        const [_, operation, num, unit] = form.adjust.replace(/\s/g, '').match(/([+-])(\d*)(\w+)/)

        switch (operation) {
          case '+':
            if (num) {
              form.date = dayjs(form.date).add(+num, unit).valueOf()
            } else {
              form.date = dayjs(form.date).endOf(unit).valueOf()
            }
            break
          case '-':
            if (num) {
              form.date = dayjs(form.date).subtract(+num, unit).valueOf()
            } else {
              form.date = dayjs(form.date).startOf(unit).valueOf()
            }
            break

          default:
            break
        }
    }

    table.value.setCellValue(fieldId, recordId, +dayjs(form.date))
    form.adjust = ''
    filteredAdjustMap.value = adjustMap
  }

  const handleSearch = e => {
    if (/^[+-]/.test(e)) {
      changeMode.value = true
      const [_, operation, num = '?', unit = '{unit}'] = e.replace(/\s/g, '').match(/([+-])(\d*)([a-z]*)/)
      const label = `${operation === '+' ? 'Add' : 'Subtract'} ${num} ${unit}`

      filteredAdjustMap.value = [
        {
          label,
          value: e,
        },
      ]
      return
    }
    changeMode.value = false
    const reg = new RegExp(e.split('').join('.*'))
    filteredAdjustMap.value = adjustMap.filter(item => reg.test(item.label))
  }
  // lifecycle

  const special = ['now', 'today']
  const units = ['year', 'quarter', 'month', 'week', 'date', 'day', 'hour', 'minute']
  const adjustMap = [
    ...special.map(unit => ({
      label: unit,
      value: unit,
    })),
    ...units.map(unit => ({
      label: `start of ${unit}`,
      value: `-${unit}`,
    })),
    ...units.map(unit => ({
      label: `end of ${unit}`,
      value: `+${unit}`,
    })),
  ]
  const filteredAdjustMap = ref(adjustMap)
</script>
<style lang='stylus' rel='stylesheet/stylus' scoped>
  .arco-date-picker {
    width: 100%;
  }

  :deep(.arco-picker-size-medium) {
    width: 100%;
  }

  .arco-card {
    margin-bottom: 20px;
  }
</style>