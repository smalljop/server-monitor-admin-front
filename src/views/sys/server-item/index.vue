<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input
        v-model="listQuery.projectName"
        placeholder="项目名"
        style="width: 200px;"
        class="filter-item"
        @keyup.enter.native="handleFilter"
      />
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">
        搜索
      </el-button>
      <el-button
        class="filter-item"
        style="margin-left: 10px;"
        type="primary"
        icon="el-icon-edit"
        @click="handleCreate"
      >
        添加
      </el-button>
    </div>
    <el-table
      :key="tableKey"
      v-loading="listLoading"
      :data="list"
      border
      fit
      highlight-current-row
      style="width: 100%;"
    >
      <el-table-column
        label="Ip地址"
        prop="ipAddr"
        align="center"
      >
        <template slot-scope="{row}">
          <span>{{ row.ipAddr }}</span>
        </template>
      </el-table-column>
      <el-table-column label="hostName" align="center">
        <template slot-scope="{row}">
          <el-tag>{{ row.hostName }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="cpuName" align="center">
        <template slot-scope="{row}">
          <span>{{ row.cpuName }}</span>
        </template>
      </el-table-column>
      <el-table-column label="CPU使用率" align="center">
        <template slot-scope="{row}">
          <el-progress
            type="circle"
            :width="50"
            :percentage="Math.ceil( row.cpuRate) "
          />
        </template>
      </el-table-column>
      <el-table-column label="CPU核心" align="center">
        <template slot-scope="{row}">
          <span>{{ row.cpuCore }}</span>
        </template>
      </el-table-column>
      <el-table-column label="硬盘使用率" align="center">
        <template slot-scope="{row}">
          <el-progress
            type="circle"
            :width="50"
            :percentage="Math.ceil( row.diskRate) "
          />
        </template>
      </el-table-column>
      <el-table-column label="diskRead" align="center">
        <template slot-scope="{row}">
          <span>{{ row.diskRead }}</span>
        </template>
      </el-table-column>
      <el-table-column label="diskWrite" align="center">
        <template slot-scope="{row}">
          <span>{{ row.diskWrite }}</span>
        </template>
      </el-table-column>
      <el-table-column label="内存使用率" align="center">
        <template slot-scope="{row}">
          <el-progress
            type="circle"
            :width="50"
            :percentage="Math.ceil( row.ramRate) "
          />
        </template>
      </el-table-column>
      <el-table-column label="虚拟内存使用率" align="center">
        <template slot-scope="{row}">
          <el-progress
            type="circle"
            :width="50"
            :percentage="Math.ceil( row.swapRate) "
          />
        </template>
      </el-table-column>
      <el-table-column label="平台版本" align="center">
        <template slot-scope="{row}">
          <span>{{ row.platformVersion }}</span>
        </template>
      </el-table-column>
      <el-table-column label="netWrite" align="center">
        <template slot-scope="{row}">
          <span>{{ row.netRead }}/{{ row.netWrite }}</span>
        </template>
      </el-table-column>
      <el-table-column label="负载" align="center">
        <template slot-scope="{row}">
          <span>{{ row.load }}</span>
        </template>
      </el-table-column>
      <el-table-column label="启动时间" align="center">
        <template slot-scope="{row}">
          <span>{{ formatBootTime(row.uptime,"") }}</span>
        </template>
      </el-table-column>
      <el-table-column label="更新时间" align="center">
        <template slot-scope="{row}">
          <span>{{ row.timeStamp | parseTime('{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="listQuery.page"
      :limit.sync="listQuery.limit"
      @pagination="getList"
    />

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form
        ref="dataForm"
        :rules="rules"
        :model="temp"
        label-position="left"
        label-width="70px"
        style="width: 400px; margin-left:50px;"
      >
        <el-form-item label="名称" prop="projectName">
          <el-input v-model="temp.projectName" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="temp.description" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">
          取消
        </el-button>
        <el-button type="primary" @click="dialogStatus==='create'?createData():updateData()">
          保存
        </el-button>
      </div>
    </el-dialog>

    <el-dialog :visible.sync="dialogPvVisible" title="Reading statistics">
      <el-table :data="pvData" border fit highlight-current-row style="width: 100%">
        <el-table-column prop="key" label="Channel" />
        <el-table-column prop="pv" label="Pv" />
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="dialogPvVisible = false">Confirm</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { fetchList, deleteProject, createProject, updateProject } from '@/api/server-item'
import waves from '@/directive/waves' // waves directive
import { parseTime, formatTime } from '@/utils'
import Pagination from '@/components/Pagination' // secondary package based on el-pagination

export default {
  name: 'ServerItem',
  components: { Pagination },
  directives: { waves },
  data() {
    return {
      tableKey: 0,
      list: null,
      total: 0,
      listLoading: true,
      listQuery: {
        page: 1,
        limit: 20,
        projectName: undefined
      },
      temp: {
        id: undefined,
        projectName: '',
        description: ''
      },
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: '编辑项目',
        create: '新增项目'
      },
      dialogPvVisible: false,
      pvData: [],
      rules: {
        projectName: [{ required: true, message: '名称不能为空', trigger: 'blur' }]
      }
    }
  },
  created() {
    setInterval(() => {
      this.getList()
    }, 5000)
    this.getList()
  },
  methods: {
    getList() {
      fetchList(this.listQuery).then(response => {
        this.list = response.data
        this.listLoading = false
      })
    },
    handleFilter() {
      this.listQuery.page = 1

      this.getList()
    },
    handleModifyStatus(row, status) {
      this.$message({
        message: '操作Success',
        type: 'success'
      })
      row.status = status
    },
    handleCreate() {
      this.dialogStatus = 'create'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].resetFields()
        this.$refs['dataForm'].clearValidate()
      })
    },
    createData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          createProject(this.temp).then(() => {
            this.dialogFormVisible = false
            this.$notify({
              title: 'Success',
              message: '保存成功',
              type: 'success',
              duration: 2000
            })
            this.getList()
          })
        }
      })
    },
    handleUpdate(row) {
      this.temp = Object.assign({}, row) // copy obj
      this.temp.timestamp = new Date(this.temp.timestamp)
      this.dialogStatus = 'update'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    updateData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          const tempData = Object.assign({}, this.temp)
          tempData.timestamp = +new Date(tempData.timestamp) // change Thu Nov 30 2017 16:41:05 GMT+0800 (CST) to 1512031311464
          updateProject(tempData).then(() => {
            this.getList()
            this.dialogFormVisible = false
            this.$notify({
              title: 'Success',
              message: '保存成功',
              type: 'success',
              duration: 2000
            })
          })
        }
      })
    },
    handleDelete(row, index) {
      deleteProject(row.id).then(() => {
        this.getList()
        this.dialogFormVisible = false
        this.$notify({
          title: 'Success',
          message: '删除成功',
          type: 'success',
          duration: 2000
        })
      })
    },
    formatBootTime(time) {
      return formatTime(time)
    }, formatJson(filterVal) {
      return this.list.map(v => filterVal.map(j => {
        if (j === 'timestamp') {
          return parseTime(v[j])
        } else {
          return v[j]
        }
      }))
    }
  }
}
</script>
