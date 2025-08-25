// Avatar utility functions for consistent avatar generation across the app

/**
 * Get initials from first name only
 * @param {Object} user - User object with name fields
 * @returns {string} - Initials (1-2 characters from first name)
 */
export const getFirstNameInitials = (user) => {
    // Try to get first name from various possible fields
    let firstName = user?.first_name || '';
    
    // If no first_name field, try to extract from display_name or username
    if (!firstName && user?.display_name) {
        firstName = user.display_name.split(' ')[0];
    } else if (!firstName && user?.username) {
        firstName = user.username;
    }
    
    // Clean the name and get initials
    firstName = firstName.trim();
    
    if (!firstName) {
        return 'U'; // Default for User
    }
    
    // For names like "Hrutik", return first two letters "HR"
    // If the name is only 1 character, return just that character
    return firstName.slice(0, 2).toUpperCase();
};

/**
 * Generate avatar URL with initials
 * @param {Object} user - User object
 * @param {number} size - Avatar size in pixels
 * @returns {string} - Avatar URL
 */
export const getAvatarUrl = (user, size = 48) => {
    // Debug logging to see what user data we're getting
    console.log('getAvatarUrl called with user:', user);
    
    // If user has a valid avatar URL, return it
    if (user?.avatar_url && user.avatar_url !== 'null' && user.avatar_url !== 'undefined' && user.avatar_url.trim() !== '') {
        console.log('Using existing avatar_url:', user.avatar_url);
        return user.avatar_url;
    }
    
    if (user?.profile_picture && user.profile_picture !== 'null' && user.profile_picture !== 'undefined' && user.profile_picture.trim() !== '') {
        console.log('Using existing profile_picture:', user.profile_picture);
        return user.profile_picture;
    }
    
    if (user?.avatar && user.avatar !== 'null' && user.avatar !== 'undefined' && user.avatar.trim() !== '') {
        console.log('Using existing avatar:', user.avatar);
        return user.avatar;
    }
    
    // Generate initials from first name only
    const initials = getFirstNameInitials(user);
    
    // Generate consistent color based on the user's name
    const colors = [
        '3b82f6', // blue
        '8b5cf6', // purple
        'ef4444', // red
        '10b981', // green
        'f59e0b', // yellow
        '06b6d4', // cyan
        'ec4899', // pink
        '84cc16', // lime
        'f97316', // orange
        '6366f1'  // indigo
    ];
    
    // Use first name for color consistency
    const nameForColor = user?.first_name || user?.display_name || user?.username || 'User';
    const colorIndex = nameForColor.length % colors.length;
    const backgroundColor = colors[colorIndex];
    
    const generatedUrl = `https://ui-avatars.com/?name=${encodeURIComponent(initials)}&background=${backgroundColor}&color=fff&size=${size}&bold=true`;
    console.log('Generated avatar URL with initials:', initials, 'URL:', generatedUrl);
    
    return generatedUrl;
};

/**
 * Get display name for a user
 * @param {Object} user - User object
 * @returns {string} - Display name
 */
export const getUserDisplayName = (user) => {
    return user?.display_name || 
           (user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : '') ||
           user?.first_name || 
           user?.username || 
           'User';
};