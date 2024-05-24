<script setup lang="ts">
import {SelfTable} from '../lib/main'
import {datasource, tableColumns} from "./table.data.ts";

</script>

<template>
  <SelfTable ref="selfTableRef" :columns="tableColumns" :data-source="datasource" fullRowType="prev">
    <template #full-row="{ row }">
      当前行的ID：{{row.id}}
    </template>
  </SelfTable>
</template>

<style scoped>
</style>
