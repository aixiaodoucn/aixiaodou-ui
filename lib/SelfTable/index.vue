<template>
  <Card style="margin: 8px" v-if="$slots['form']">
    <slot name="form" :loading="loading"></slot>
  </Card>
  <component :is="isDiv ? 'div' : 'Card'" style="margin: 8px">
    <!--  可放操作按钮  -->
    <div class="table-head" v-if="$slots['tableHead']">
      <slot name="tableHead"></slot>
    </div>
    <!--  可放合计数据  -->
    <div class="table-head" v-if="$slots['tableTitle']">
      <slot name="tableTitle"></slot>
    </div>
    <Alert class="a-alert-cont" type="info" show-icon v-if="hasCheckbox">
      <template #message>
        <span>{{ checkedAlertMessage }}</span>
        <template v-if="checkedList.length">
          <Divider type="vertical" />
          <a href="javascript:" @click="resetCheckbox">清空</a>
        </template>
      </template>
    </Alert>
    <Table
      :columns="columns"
      :loading="loading"
      :data-source="tableData"
      :scroll="{ x: '100%' }"
      :pagination="false"
      :sticky="sticky"
      size="small"
      @change="pageChange"
      bordered
      v-bind="$attrs.tableProps"
      class="self-table"
    >
      <template #summary v-if="$slots['summary']">
        <slot name="summary"></slot>
      </template>
      <!--   编辑列显示编辑ICON   -->
      <template #headerCell="{ column, title }">
        <template v-if="column.isEdit === true">
          <div class="head-edit-cont"> <EditOutlined /> {{ title }} </div>
        </template>
        <!--    选择    -->
        <template v-else-if="column.dataIndex === 'rowSelection'">
          <Checkbox :indeterminate="indeterminate" v-model:checked="checkAll" @change="onCheckAllChange" />
        </template>
      </template>
      <template #bodyCell="{ column, index, record, text }">
        <!--   序号  非通行时显示序号   -->
        <template v-if="index % 2 === unFullRowIndex && column.dataIndex === 'selfIndex'">
          {{ tableIndex(index) }}
        </template>
        <!--如果是通行则展示full-row插槽，如果不是通行并且传入了插槽则展示  -->
        <template v-if="column.fullFirst">
          <div class="full-row-cont" v-if="index % 2 === fullRowIndex">
            <slot name="full-row" :row="record" :index="index"></slot>
          </div>
          <!--   选择列   -->
          <template v-else-if="column.dataIndex === 'rowSelection'">
            <div class="slot-wrap" :style="{ background: computedColor(record.markColor) }">
              <Checkbox
                name="tableCheckbox"
                class="my-checkbox"
                v-model:checked="record._checked"
                :key="record.id"
                :value="record.id"
                :disabled="setCheckBoxDisable(record)"
                @change="onCheckBoxChange(record)"
              />
            </div>
          </template>
          <template v-else-if="column.slot">
            <slot :name="column.slot" :row="record" :rowIndex="index"></slot>
          </template>
          <template v-else>{{ text }}</template>
        </template>
        <!--   如果不是通行、并且传入了插槽，则展示     -->
        <template v-else-if="index % 2 === unFullRowIndex && column.slot">
          <slot :name="column.slot" :row="record" :rowIndex="index" :column="column"></slot>
        </template>
        <!--   操作     -->
        <template v-if="column.key === 'action'">
          <template v-if="index % 2 === unFullRowIndex">
            <slot name="action" :row="record"></slot>
          </template>
        </template>
      </template>
    </Table>
    <!--   页码：传入dataSource时不显示页码     -->
    <div class="my-footer" v-if="hasPagination">
      <Pagination
        size="small"
        :total="total"
        :current="pageNo"
        :page-size="pageSize"
        show-size-changer
        show-quick-jumper
        :show-total="(total) => `共 ${total} 条数据`"
        @change="pageChange"
      />
    </div>
  </component>
</template>
<script lang="ts" setup name="SelfTable">
  import type { TableColumnType } from 'ant-design-vue';
  import {Table, Card, Alert, Pagination, Divider, Checkbox} from 'ant-design-vue'
  import {
    checkColumnsHasExist,
    filterSelfTableColumns,
    filterSelfTableData,
    FullRowType,
    getAllCheckedListData,
    getIndeterminateAndCheckAllStatus,
    SelfTableColumnType,
    useFullRowIndex,
  } from './selfTableTools';
  import { computed, onMounted, reactive, ref, toRaw, watch } from 'vue';
  import { isEmpty } from '../utils/is';
  import {EditOutlined} from '@ant-design/icons-vue'

  const emits = defineEmits(['getSourceData', 'setCheckBoxDisableStatus', 'checkChange']);

  const sticky = ref<any>({ getContainer: () => document.body as HTMLElement });
  interface Props {
    dataSource?: any[]; // 数据,
    fullRowType: FullRowType; // 同行类型
    fullRowKeyList?: any[]; // 展示在同行的数据，组件内自动转换数据
    api?: any; // 接口
    hasCheckbox?: boolean; // 是否显示选择框
    hasPagination?: boolean; // 是否显示页码
    columns: TableColumnType[]; // 表格列
    isDiv?: boolean;
    searchData?: any; // 搜索数据,searchInfo会覆盖searchData
    searchInfo?: any; // 搜索数据,与上面功能一样，searchInfo、searchData有一个有值就行
    isSticky?: boolean;
    pageSize?: any;
  }
  const props = withDefaults(defineProps<Props>(), { hasPagination: true });

  // fullRowType 通行索引  0代表偶数行为通行，即行下展示描述信息
  const { fullRowIndex, unFullRowIndex } = useFullRowIndex(props.fullRowType);

  // 表格基础数据
  let pageNo = ref<number>(1); // 页码
  let pageSize = ref<number>(10); // 页条数
  let total = ref<number>(0); // 总条数
  let sourceData = ref<any[]>([]); // 接口返回原始数据
  let tableSourceData = ref<any[]>([]); // 接口返回原始数据中的表格数据
  let tableData = ref<any[]>([]); // 表格数据
  const hasPagination = ref<boolean>(true); // 是否显示页码

  let loading = ref(false);

  // 添加空行
  const emptyFixedLeftColumn: SelfTableColumnType = {
    dataIndex: 'empty',
    fixed: 'left',
    width: 0,
    customCell: (_, index: number) => ({
      colSpan: index % 2 === fullRowIndex ? columns.value.length : 1,
    }),
    fullFirst: true,
  };
  const checkColumn: SelfTableColumnType = {
    title: ' ',
    dataIndex: 'rowSelection',
    key: Math.random(),
    fixed: 'left',
    align: 'center',
    width: 40,
    customCell: (_, index: number) => ({
      colSpan: index % 2 === fullRowIndex ? 0 : 1,
    }),
    fullFirst: props.hasCheckbox,
  };
  const indexColumn: SelfTableColumnType = {
    title: '序号',
    key: Math.random(),
    dataIndex: 'selfIndex',
    fixed: 'left',
    align: 'center',
    width: 40,
    customCell: (_, index: number) => ({
      colSpan: index % 2 === fullRowIndex ? 0 : 1,
    }),
    fullFirst: false,
  };
  let columns = ref<TableColumnType[]>([]);
  columns.value = filterSelfTableColumns(toRaw(props.columns));
  !checkColumnsHasExist(props.columns, 'selfIndex') && columns.value.unshift(indexColumn);
  props.hasCheckbox && !checkColumnsHasExist(props.columns, 'rowSelection') && columns.value.unshift(checkColumn);
  !checkColumnsHasExist(props.columns, 'empty') && columns.value.unshift(emptyFixedLeftColumn);
  /********* 选择 相关 start ***********/
  let checkAll = ref(false);
  let indeterminate = ref(false);
  let checkedList = ref<any[]>([]);
  // 全选
  function onCheckAllChange(e: any) {
    const checked = e.target.checked;
    tableData.value.map((item) => {
      if (!setCheckBoxDisable(item) || setCheckBoxDisable(item) == undefined) {
        item._checked = checked;
      }
    });
    checkedList.value = checked ? getAllCheckedListData(tableSourceData.value, checkedList.value) : [];
    indeterminate.value = false;
    nextTick(() => {
      emits('checkChange');
    });
  }
  function onCheckBoxChange(record) {
    const index = checkedList.value.findIndex((item) => item.id === record.id);
    if (index > -1) {
      checkedList.value.splice(index, 1);
    } else {
      checkedList.value.push(record);
    }
    nextTick(() => {
      emits('checkChange');
    });
  }
  const checkedAlertMessage = computed(() => {
    return checkedList.value.length === 0 ? '未选中任何数据' : `已选中 ${checkedList.value.length} 条记录(可跨页)`;
  });
  // 监听 选择改变
  watch(() => checkedList.value, reloadCheckStatus, {
    immediate: true,
    deep: true,
  });
  const computedColor = computed(() => (markColor) => {
    // 计算颜色
    if (!markColor) return;
    if (markColor == 'yello') {
      return '#ffffbf';
    } else if (markColor == 'red') {
      return '#ffdada';
    } else if (markColor == 'green') {
      return '#caffca';
    } else if (markColor == 'blue') {
      return '#bdbdff';
    }
  });
  function reloadCheckStatus() {
    if (!props.hasCheckbox) return;
    const { indeterminateStatus, checkAllStatus } = getIndeterminateAndCheckAllStatus(checkedList.value, tableSourceData.value);
    indeterminate.value = indeterminateStatus;
    checkAll.value = checkAllStatus;
  }
  // 重置选择
  function resetCheckbox() {
    onCheckAllChange({ target: { checked: false } });
  }
  // 给数据添加选项字段
  function addCheckedParam<T>(data: T[]): T[] {
    if (!props.hasCheckbox) {
      return data;
    }
    let nData = data;
    nData.map((item: any) => {
      const index = checkedList.value.findIndex((check) => item.id === check.id);
      item['_checked'] = index !== -1;
    });
    return nData;
  }
  /********* 选择 相关  end ***********/

  // index序号计算
  const tableIndex = computed(() => (index) => (index + unFullRowIndex) / 2 + fullRowIndex + (pageNo.value - 1) * pageSize.value);

  let searchData = reactive({});
  searchData = props.searchData || {};
  // 搜索 - 传入搜索数据
  function search(sd, reset = true) {
    searchData = sd;
    reload(reset);
    resetCheckbox();
  }

  const setCheckBoxDisable = (record) => {
    const status = ref(false);
    emits('setCheckBoxDisableStatus', record, (val: boolean) => {
      status.value = val;
    });
    return status.value;
  };

  // 重载表格
  async function reload(reset = false) {
    // if (reset) pageNo.value = 1;
    if (reset) {
      pageNo.value = 1;
      sourceData.value = [];
      tableSourceData.value = [];
      total.value = 0;
      tableData.value = [];
    }
    loading.value = true;
    const res = await props
      .api({
        ...searchData,
        ...props.searchInfo,
        pageNo: pageNo.value,
        pageSize: pageSize.value,
        // goodsOrderType: 1,
      })
      .finally(() => {
        loading.value = false;
      });
    // 保存接口数据
    sourceData.value = res || [];
    tableSourceData.value = addCheckedParam(res.records);
    total.value = res.total || 0;
    tableData.value = addCheckedParam(filterData(res.records));
    setTimeout(() => {
      reloadCheckStatus();
    }, 100);
    emits('getSourceData', res);
  }

  function reloadNoApi(data) {
    tableData.value = addCheckedParam(filterData(data));
    sourceData.value = data;
    tableSourceData.value = addCheckedParam(data);
  }

  /**
   * 修改表格数据
   * @param {number} rowIndex 行索引
   * @param {string} changeKey 改变的字段
   * @param value  要改变的值
   * @param {number} childrenIndex
   * @param {string} childrenKey
   */
  function setTableData(rowIndex: number, changeKey: string, value: any, childrenIndex?: number, childrenKey?: string) {
    if (tableData.value[rowIndex] === undefined) return;
    const rowData: any = tableData.value[rowIndex];
    let changeKeyData: any = rowData[changeKey];

    if (changeKeyData === undefined) return;
    try {
      // 如果是数组
      if (Array.isArray(rowData[changeKey])) {
        if (isEmpty(childrenIndex)) {
          throw new Error('childrenIndex is not allow empty');
        }
        if (isEmpty(childrenKey)) {
          throw new Error('childrenKey is not allow empty');
        }
        changeKeyData[childrenIndex][childrenKey] = value;
      } else {
        // 非数组
        rowData[changeKey] = value;
      }
    } catch (e) {
      throw new Error('更新数值失败');
    }
  }

  /**
   * 批量修改表格数据
   * @param rowIndex 行索引
   * @param dataToUpdate 改变的数组[key,value]
   */
  function setTableDataList(rowIndex: number, dataToUpdate: Array<{ key: string; value: any }>) {
    if (tableData.value[rowIndex] === undefined) return;
    const rowData: any = tableData.value[rowIndex];
    dataToUpdate.forEach(({ key, value }) => {
      if (rowData[key] !== undefined) {
        rowData[key] = value;
      }
    });
  }

  function filterData(records) {
    return filterSelfTableData(records, props.fullRowKeyList || [], fullRowIndex, unFullRowIndex);
  }

  onMounted(() => {
    if (props.pageSize != undefined) {
      pageSize.value = props.pageSize;
    }
    hasPagination.value = props.hasPagination;
    if (props.dataSource) {
      // hasPagination.value = false;
      sourceData.value = props.dataSource;
      tableSourceData.value = addCheckedParam(props.dataSource);
      tableData.value = addCheckedParam(filterData(props.dataSource));
    } else {
      reload(true);
    }
  });

  // 页码改变事件
  function pageChange(pNo, pSize) {
    pageNo.value = pNo;
    // 页数改变时，页码设置1
    const reset = pageSize.value !== pSize;
    pageSize.value = pSize;
    reload(reset);
  }

  /**
   * 获取选中数据 - id
   * @return [string | number] 选中数据
   */
  function getChecked(): (string | number)[] {
    let checkArr: (string | number)[] = reactive([]);
    let checkDom: any[] = document.querySelectorAll('input[name="tableCheckbox"]:checked') || [];
    checkDom.forEach((check) => {
      checkArr.push(check.value);
    });
    return toRaw(checkArr);
  }
  /**
   * 获取选中数据 - row
   * @return [string | number] 选中数据
   */
  function getCheckedRows(): (string | number)[] {
    // let checkArr: [] = reactive([]);
    // let checkDom: any[] = document.querySelectorAll('input[name="tableCheckbox"]:checked') || [];
    // let getData = getTableData();
    // checkDom.forEach((check) => {
    //   let checkDataRows = getData.find((item) => item.id == check.value);
    //   checkArr.push(checkDataRows ? checkDataRows : {});
    // });
    return toRaw(checkedList.value);
  }
  // 获取当前表格的数据
  function getTableData() {
    const tData = tableData.value;
    let realData: any[] = [];
    // 之前的遍历获取数据有问题
    tData.forEach((item, index) => {
      if (index % 2 === unFullRowIndex) return;
      realData.push({ ...item, ...tData[index + 1] });
    });
    return realData;
  }
  /**
   * 暴露属性方法
   * @param {function} search 搜索方法
   * @param {function} getChecked 获取已选中数据方法 - id
   * @param {function} getCheckedRows  获取已选中数据方法 - row
   * @param {Array} sourceData 获取接口返回的数据
   * @param {Array} tableSourceData 获取接口返回的数据中表格的数据
   * @param {function} getTableData 获取表格数据
   * @param {function} setTableData 设置表格某行的某个单元格数据
   * @param {function} reload 重载表格数据
   * @param {function} resetCheckbox 重置选中状态
   */
  defineExpose({
    search,
    getChecked,
    getCheckedRows,
    sourceData,
    tableSourceData,
    getTableData,
    setTableData,
    setTableDataList,
    reloadNoApi,
    reload,
    resetCheckbox,
  });
</script>
<style scoped>
  .a-alert-cont {
    margin-bottom: 8px;
  }
  .ant-table-striped :deep(.table-striped) td {
    background-color: #fafafa;
  }
  :deep(.ant-table-content) {
    border-right: 1px solid #f0f0f0;
  }
  :deep(.ant-table-thead) > tr > th,
  :deep(.ant-table-tbody) > tr > td,
  :deep(.ant-table tfoot) > tr > th,
  :deep(.ant-table) tfoot > tr > td {
    padding: 4px 8px;
  }
  .my-footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 8px;
  }
  .my-checkbox {
    cursor: pointer;
    width: 16px;
    height: 16px;
  }
  .table-head {
    margin-bottom: 8px;
    :deep(.ant-btn) {
      margin-right: 8px;
    }
    margin-right: 8px;
  }

  .head-edit-cont {
    display: flex;
    align-items: center;

  }
  .head-edit-cont :deep(.vxe-cell--edit-icon) {
    border-color: #606266 !important;
    margin-right: 3px;
  }
  .full-row-cont {
    text-align: left;
  }
  .slot-wrap {
    width: calc(100% + 6px);
    height: calc(100% + 16px);
    padding-left: 10px;
    transform: translateX(-3px);
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
  }
</style>
