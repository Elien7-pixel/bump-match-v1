import { useAuth } from '../context/AuthContext';

/**
 * Surname appended to a baby name on cards ("Precious Matanda").
 *
 * Resolved in AuthContext so every card sees the same value on the same frame.
 * Reading `user?.surname` directly used to drop the surname whenever `user` was
 * momentarily null, and on a FlatList that stranded already-mounted cells.
 */
export const useAccountSurname = (): string => useAuth().surname;
