import { AREA_BY_ROLE } from '../routes/navigation'
import { useAuth } from './useAuth'

/** URL prefix of the current user's area, e.g. "/admin". */
export function useArea() {
  const { user } = useAuth()
  return user ? AREA_BY_ROLE[user.role] : ''
}
