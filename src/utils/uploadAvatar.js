import { supabase } from '../lib/supabase';

export const uploadAvatar = async (file, userId) => {
  if (!file) throw new Error('No file selected');
  
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only JPEG, PNG, and WebP images are supported.');
  }

  // Validate size (5MB limit)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('Image size must be less than 5MB.');
  }

  try {
    let fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!fileExt || fileExt === file.name.toLowerCase()) {
      fileExt = file.type.split('/')[1] || 'jpg';
    }
    if (fileExt === 'jpeg') fileExt = 'jpg';

    const filePath = `${userId}/avatar-${Date.now()}.${fileExt}`;

    // Upload to 'avatars' bucket
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Upload error details:", uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: publicData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    if (!publicData || !publicData.publicUrl) {
      throw new Error('Failed to retrieve public URL for avatar');
    }

    return publicData.publicUrl;

  } catch (error) {
    console.error('Avatar upload failed:', error);
    throw new Error(error.message || 'Avatar upload failed');
  }
};
