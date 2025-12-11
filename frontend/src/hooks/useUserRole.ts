import { useUser } from '@clerk/clerk-react';
import { UserRole } from '../types';

export function useUserRole() {
  const { user, isLoaded } = useUser();
  
  // Access role stored in Clerk's unsafeMetadata (set during signup)
  const role = user?.unsafeMetadata?.role as UserRole | undefined;
  
  return {
    role,
    isVolunteer: role === UserRole.VOLUNTEER,
    isOrganizer: role === UserRole.ORGANIZER,
    isLoaded,
    user
  };
}