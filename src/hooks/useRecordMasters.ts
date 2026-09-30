import { processStagesApi, propertyCategoriesApi, propertyTypesApi } from '../services/api'
import type { ProcessStage, PropertyCategory, PropertyType } from '../types'
import { useApi } from './useApi'

/** Active property types + process stages used by record forms and filters. */
export function useRecordMasters() {
  return useApi<{ types: PropertyType[]; categories: PropertyCategory[]; stages: ProcessStage[] }>(async (signal) => {
    const [types, categories, stages] = await Promise.all([propertyTypesApi.list(false, signal), propertyCategoriesApi.list(signal), processStagesApi.list(signal)])
    return { types: types.items, categories: categories.items, stages: stages.items }
  })
}
