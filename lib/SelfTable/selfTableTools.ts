/**
 * 遍历表格数据 为 SelfTable数据类型
 * @param data 表格源数据
 * @param keys 要放到通行里使用的数据
 * @param fullRowIndex 通行索引
 * @param unFullRowIndex 非通行索引
 */
export const filterSelfTableData = (data: any[], keys: any[], fullRowIndex: number, unFullRowIndex: number): any[] => {
  if (keys.length === 0) {
    const arr: any[] = [];
    data.map((item) => {
      arr.push(item);
      arr.push(item);
    });
    return arr;
  }
  const arr: any[] = [];
  data.map((d) => {
    const d2 = {};
    keys.map((k) => {
      d2[k] = d[k];
    });
    fullRowIndex && arr.push(d);
    d2['id'] = d.id;
    arr.push(d2);
    unFullRowIndex && arr.push(d);
  });
  return arr;
};

// 过滤表单列
export const filterSelfTableColumns = (columns) => {
  return columns.filter((item) => item.ifShow === undefined || item.ifShow() === true);
};

// 通行类型 'prev' 前一行 | 'last' 后一行
export type FullRowType = 'prev' | 'last';
export const useFullRowIndex = (type: FullRowType) => {
  const fullRowIndex = type === 'prev' ? 0 : 1;
  const unFullRowIndex = type === 'prev' ? 1 : 0;
  return { fullRowIndex, unFullRowIndex };
};

// 除第一列外的普通列
export const sharedOnCell = (index, type: FullRowType) => {
  // 设置为0时不渲染
  return { colSpan: index % 2 === useFullRowIndex(type).fullRowIndex ? 0 : 1 };
};

/**
 * 首位列
 * @param type 通行位置 prev | last
 * @param columnsNum 要合并的行数，也就是总列数，包括操作，不含序号和选择
 * @param index 索引
 */
export const firstSharedOnCell = (type: FullRowType, columnsNum: number, index) => ({
  colSpan: index % 2 === useFullRowIndex(type).fullRowIndex ? columnsNum : 1,
});

import { TableColumnType } from 'ant-design-vue';
// 表格column类型
export interface SelfTableColumnType extends TableColumnType {
  slot?: string;
  isEdit?: boolean;
  ifShow?: () => boolean;
}

export function checkColumnsHasExist(arr, key): boolean {
  return arr.findIndex((item) => item.dataIndex === key) !== -1;
}

/**
 * 全选操作时，将所选数据加入到已选择列表中
 * @param currentPageData 当前页选中数据
 * @param checkedData 已选择的数据
 */
export function getAllCheckedListData(currentPageData: any[], checkedData: any[]) {
  const result: any[] = checkedData;
  currentPageData.forEach((item) => {
    const index = result.findIndex((c) => c.id === item.id);
    // 不存在 && 添加
    index === -1 && result.push(item);
  });
  return result;
}

interface CheckAllStatus {
  indeterminateStatus: boolean;
  checkAllStatus: boolean;
}
/**
 * 获取半选状态及全选状态
 * @param checkedList 已选列表
 * @param currentPageData 当前页数据
 */
export function getIndeterminateAndCheckAllStatus(checkedList, currentPageData): CheckAllStatus {
  // 已选数据为空 或者 当前页数据为空
  if (!checkedList.length || !currentPageData.length) {
    return {
      indeterminateStatus: false,
      checkAllStatus: false,
    };
  }
  // 筛选当前页面数据未再已选列表的数据
  const notCheckedData = currentPageData.filter((item) => {
    const index = checkedList.findIndex((c) => c.id === item.id);
    return index === -1;
  });
  return {
    indeterminateStatus: notCheckedData.length > 0 && notCheckedData.length < currentPageData.length,
    checkAllStatus: notCheckedData.length === 0,
  };
}


export default {
  filterSelfTableColumns,
  filterSelfTableData,
  sharedOnCell,
  firstSharedOnCell,
  getAllCheckedListData,
  getIndeterminateAndCheckAllStatus,
}