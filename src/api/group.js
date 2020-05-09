import request from '@/utils/request'

export function fetchList(query) {
  return request({
    url: '/server/group/list',
    method: 'get',
    params: query
  })
}

export function createProject(data) {
  return request({
    url: '/server/group/save',
    method: 'post',
    data
  })
}

export function updateProject(data) {
  return request({
    url: '/server/group/update',
    method: 'post',
    data
  })
}

export function deleteProject(id) {
  return request({
    url: '/server/group/delete',
    method: 'post',
    data: { 'id': id }
  })
}
