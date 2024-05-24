# SelfTable通行表格组件使用文档

实现效果
<table>
	<tr> <td>序号</td> <td>姓名</td> <td>年龄</td> <td>性别</td> </tr>
	<tr> <td colspan="4">我是自定义表格通行展示 我的id是10001</td> </tr>
	<tr> <td>1</td> <td>张三</td> <td>20</td> <td>男</td> </tr>
	<tr> <td colspan="4">我是自定义表格通行展示 我的id是10002</td> </tr>
	<tr> <td>2</td> <td>李四</td> <td>22</td> <td>女</td> </tr>
	<tr> <td colspan="4">我是自定义表格通行展示 我的id是10003</td> </tr>
	<tr> <td>3</td> <td>王五</td> <td>26</td> <td>男</td> </tr>
</table>

组件基于antd table组件实现此功能。

安装
```shell
npm install aixiaodou-ui
```





## 参数

| 字段       | 类型      | 描述                                       |
|----------|---------|------------------------------------------|
| api      | Promise | 表格数据api                                  |
| dataSource | array   | 表格数据                                     |
| columns  | array   | 表格column数据,列数据一定要指定width                 |
| has-checkbox | boolean | 是否可选，默认false                             |
| full-row-type | string  | 通行类型 'prev' 前一行，'last' 后一行 ，FullRowType类型 |
| tableProps | Object  | 传给antd table组件的数据                        |

### api和dataSource

api和dataSource可以同时传，优先使用dataSource。

api为异步请求接口，返回的数据格式为{ result: {records: [{...}, {...}], total: number} }，records为表格数据，total为数据总数。

dataSource为静态数据，格式为[{...}, {...}]。


### FullRowType类型

FullRowType类型，用于指定通行在前一行或者后一行。
```ts
type FullRowType = 'prev' | 'last';
```
### columns类型

SelfTableColumnType类型，在antd表格columns基础上增加了

- slot?: string;   插槽
- isEdit?: boolean; 是否是编辑列，头部显示编辑图标，编辑需要自定义插槽实现
- ifShow?: () => boolean；显示隐藏列，默认true



## 方法
| 方法名 | 描述| 类型 |
|-----------------|-------------------|---------------|
| search(params, reset)| 搜索方法，用于表单按钮搜索<br>params为Object，用于接口发送请求传参<br>reset：是否重置页码为1，再加载数据 |function|
| getChecked()| 获取当前页面选中数据|function|
| getTableData()| 获取表格当前数据          | function      |
| setTableData()| 设置表格某行的某个单元格数据    | function      |
| sourceData| 获取接口返回的数据         | Array          |
| tableSourceData| 获取接口返回的数据中表格的数据   | Array          |

示例：
```js
const myTableRef = ref(null);
myTableRef.value.search({ name: 'xxx', age: 20 }); // 传入搜索字段

const check = myTableRef.value.getChecked(); // 选中数据
console.log('check', check);
```

## 事件

| 事件名 | 描述           |
|-----------------|--------------|
| getSourceData| 表格api请求成功后触发 |
| checkChange| 表格选中变化时触发    |

## 插槽

- `form`： 搜索表单区域
- `tableHead`： 表格和form中间，放按钮
- `tableTitle`： 表头上面，放合计数据


## 可编辑单元格
表格内使用插槽
指定isEdit为true，自定义插槽实现编辑功能
```html
<script setup lang='ts'>
  import { SelfTable } from 'aixiaodou-ui'
  import { datasource, tableColumns } from '@/views/data/tableData'
  import { ref } from 'vue'

  const selfTableRef = ref(null)
  function getData() {
    const data = selfTableRef.value.getTableData()
    console.log('✨表格当前数据：✨', data)
  }
</script>

<template>
  <button @click='getData'>获取表格数据</button>
  <SelfTable ref='selfTableRef' :data-source='datasource' :columns='tableColumns' fullRowType='prev'>
    <template #full-row='{ row }'>
      我是自定义的通行，当前行的ID：{{ row.id }}
    </template>
    <template #editAge='scope'>
      <div class='slot-cont'>
        <input
                v-model='scope.row.age'
                @change="(e) => selfTableRef.setTableData(scope.rowIndex, 'age', e.target.value)"
        />
      </div>
    </template>
  </SelfTable>
</template>

</template>
```


columns中单元格使用定义插槽
```json
{
  title: '重量',
  dataIndex: 'weight',
  width: 100,
  customCell: (_, index) => sharedOnCell(index, fullRowType),
  slot: 'customSlot'
}
```


## 完整使用示例

```vue
<script setup lang="ts">
  import { SelfTable } from 'aixiaodou-ui';
  import { datasource, tableColumns } from '@/views/data/tableData'
</script>

<template>
  <SelfTable  ref="selfTableRef" :data-source="datasource" :columns="tableColumns" fullRowType="prev">
    <template #full-row="{ row }">
      我是自定义的通行，当前行的ID：{{row.id}}
    </template>
  </SelfTable>
</template>
```
views/data/tableData.ts
```ts
import { SelfTableTools } from 'aixiaodou-ui'
// 表格列数据
export const tableColumns: SelfTableTools.SelfTableColumnType[] = [
  {
    title: 'id',
    dataIndex: 'id',
    width: 150,
    customCell: (_, index) => SelfTableTools.sharedOnCell(index, 'prev')
  },
  {
    title: '姓名',
    dataIndex: 'username',
    width: 150,
    customCell: (_, index) => SelfTableTools.sharedOnCell(index, 'prev')
  },
  {
    title: '年龄',
    dataIndex: 'age',
    width: 150,
    customCell: (_, index) => SelfTableTools.sharedOnCell(index, 'prev')
  }
]
// 模拟数据
export const datasource = [
  { id: 100001, username: '李四', age: 20 },
  { id: 100002, username: '李四', age: 20 },
  { id: 100003, username: '李四', age: 30 },
  { id: 100004, username: '李四', age: 30 }
]
```