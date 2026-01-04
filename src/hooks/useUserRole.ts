import { useUser } from '@clerk/clerk-react';
import { UserRole } from '../types';

export function useUserRole() {
  const { user, isLoaded } = useUser();
  
  // FIX 5: Validate that the metadata role is actually a valid UserRole.
  // This prevents UI issues if a user manually spoofs 'unsafeMetadata' 
  // with an invalid string in their browser console.
  const rawRole = user?.unsafeMetadata?.role as string | undefined;
  
  // Check if rawRole exists in the UserRole enum values
  const isValidRole = Object.values(UserRole).includes(rawRole as UserRole);
  
  // Default to VOLUNTEER if the role is missing or invalid
  const role = isValidRole ? (rawRole as UserRole) : UserRole.VOLUNTEER;
  
  return {
    role,
    isVolunteer: role === UserRole.VOLUNTEER,
    isOrganizer: role === UserRole.ORGANIZER,
    isLoaded,
    user
  };
}
