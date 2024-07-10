
### rrsBiz

|requestTypeName|responsesTypeName|url|methodType|describe|version|
| --------- | --------- | --------- | --------- | --------- | --------- |
|`GetMainResourcesReqType`|`GetMainResourcesResType`|`/api/MainResources`|get|按条件查询主资源|v1|
|`AddMainResourcesReqType`|`AddMainResourcesResType`|`/api/MainResources`|post|创建主资源|v1|
|`GetMainResByIdReqType`|`GetMainResByIdResType`|`/api/MainResources/{id}`|get|通过主资源ID获取主资源|v1|
|`UpdateMainResByIdReqType`|``|`/api/MainResources/{id}`|put|更新主资源|v1|
|`DeleteMainResByIdReqType`|``|`/api/MainResources/{id}`|delete|删除主资源|v1|
|`SearchAllResourceReqType`|`SearchAllResourceResType`|`/api/ResourceRelationships/resource`|post|获取主体下所有资源|v1|
|`UpdateAllResourceReqType`|`UpdateAllResourceResType`|`/api/ResourceRelationships/resource`|put|更新主体下资源关系|v1|
|`SearchSingleResourceReqType`|`SearchSingleResourceResType`|`/api/ResourceRelationships/resource/single`|post|资源查询|v1|
|`GetResourceDetailsReqType`|`GetResourceDetailsResType`|`/api/ResourceRelationships/resource/details`|post|批量获取资源详情（带关联主体）|v1|
|`BatchMainDetailsReqType`|`BatchMainDetailsResType`|`/api/ResourceRelationships/main/details`|post|批量获取主体资源详情（带关联下资源）|v1|
|`BatchResRelationshipsReqType`|``|`/api/ResourceRelationships`|put|绑定资源关系|v1|
|`UntieResRelationshipsReqType`|``|`/api/ResourceRelationships`|post|解绑资源关系|v1|
|`GetResourcesReqType`|`GetResourcesResType`|`/api/Resources`|get|按条件查询资源|v1|
|`AddResourcesReqType`|`AddResourcesResType`|`/api/Resources`|post|创建资源|v1|
|`GetResourcesByIdReqType`|`GetResourcesByIdResType`|`/api/Resources/{id}`|get|通过资源ID获取资源|v1|
|`UpdateResourcesByIdReqType`|``|`/api/Resources/{id}`|put|更新资源|v1|
|`DeleteResourcesByIdReqType`|``|`/api/Resources/{id}`|delete|删除资源|v1|
|`GetResourceTypesReqType`|`GetResourceTypesResType`|`/api/ResourceTypes`|get|按条件查询资源类型|v1|
|`AddResourceTypesReqType`|`AddResourceTypesReqType`|`/api/ResourceTypes`|post|创建资源类型|v1|
|`GetResourceTypesByIdReqType`|`GetResourceTypesByIdResType`|`/api/ResourceTypes/{id}`|get|通过资源类型ID获取资源类型|v1|
