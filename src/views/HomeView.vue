<template lang='pug'>
a-tabs(:active-key="activeKey" @tab-click="changeTabs")
  a-tab-pane(key="1" :title="$t('tabs.transform')")
    Transform
  a-tab-pane(key="2" :title="$t('tabs.operation')")
    Change
</template>
<script setup name='Home'>
  import { bitable } from '@lark-base-open/js-sdk'
  const { currentCell } = storeToRefs(useBitable())
  // data
  const activeKey = ref('1')
  // methods
  const changeTabs = tab => {
    activeKey.value = tab
  }
  onMounted(async () => {
    bitable.base.onSelectionChange(e => {
      activeKey.value = '2'
      currentCell.value = e.data
    })
  })
  // lifecycle
</script>
<style lang='stylus' rel='stylesheet/stylus' scoped></style>
