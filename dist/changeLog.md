
### quartzBiz

|requestTypeName|responsesTypeName|url|methodType|describe|version|
| --------- | --------- | --------- | --------- | --------- | --------- |
|`GetJobsReqType`|`GetJobsResType`|`/api/Jobs`|get|查询所有定时任务|v1|
|`AddJobsReqType`|`AddJobsResType`|`/api/Jobs`|post|添加一个定时任务|v1|
|`GetJobsByIdReqType`|`GetJobsByIdResType`|`/api/Jobs/{id}`|get|查询指定定时任务|v1|
|`UpdateJobsByIdReqType`|``|`/api/Jobs/{id}`|put|修改一个定时任务|v1|
|`DeleteJobsByIdReqType`|``|`/api/Jobs/{id}`|delete|删除定时任务|v1|
|`ExecuteJobsByIdReqType`|``|`/api/Jobs/{id}/immediate_execute`|put|立刻执行任务一次|v1|
|`PauseJobsByIdReqType`|``|`/api/Jobs/{id}/pause`|put|停止指定任务|v1|
|`ResumeJobsByIdReqType`|``|`/api/Jobs/{id}/resume`|put|恢复指定任务|v1|
|`AddMultipleReqType`|`AddMultipleResType`|`/api/Jobs/multiple`|post|添加作业，包含子作业|v1|
|`GetMultipleReqType`|`GetMultipleResType`|`/api/Jobs/multiple`|get|搜索作业，包含子作业|v1|
|`GetMultipleByIdReqType`|`GetMultipleByIdResType`|`/api/Jobs/multiple/{id}`|get|获取作业，包含子作业|v1|
|`UpdateMultipleByIdReqType`|``|`/api/Jobs/multiple/{id}`|put|更新作业，包含子作业|v1|
|`DeleteMultipleByIdReqType`|``|`/api/Jobs/multiple/{id}`|delete|删除作业，包含子作业|v1|
