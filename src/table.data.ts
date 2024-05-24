import {SelfTableTools} from '../lib/main.ts'
// export const tableColumns: SelfTableTools.SelfTableColumnType[] = [
export const tableColumns: any[] = [
    {
        title: 'id',
        dataIndex: 'id',
        width: 150,
        customCell: (_, index) => SelfTableTools.sharedOnCell(index, 'prev'),
    },
    {
        title: '姓名',
        dataIndex: 'username',
        width: 150,
        customCell: (_, index) => SelfTableTools.sharedOnCell(index, 'prev'),
    },
    {
        title: '年龄',
        dataIndex: 'age',
        width: 150,
        customCell: (_, index) => SelfTableTools.sharedOnCell(index, 'prev'),
        isEdit: true,
    }
]



export const datasource = [
    {id: 1, username: '李四', age: 20},
    {id: 2, username: '李四', age: 20},
    {id: 3, username: '李四', age: 30},
    {id: 4, username: '李四', age: 30}
]