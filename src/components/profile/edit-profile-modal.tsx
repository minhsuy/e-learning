'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Loader2,
  User,
  Mail,
  Phone,
  FileText,
  AlertCircle,
  ExternalLink,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { UserProfile, UpdateProfileRequest } from '@/types/auth';
import { userService } from '@/services/user.service';
import { AppApiError } from '@/types/api';
import { toast } from '@/lib/toast';
import { useUploadThing } from '@/lib/uploadthing';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSuccess: (updatedProfile: UserProfile) => void;
}

function getInitials(name?: string): string {
  if (!name) return 'TM';
  const clean = name.trim();
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

export function EditProfileModal({
  isOpen,
  onClose,
  profile,
  onSuccess,
}: EditProfileModalProps) {
  if (!isOpen) return null;

  return (
    <EditProfileDialogContent
      key={`${profile.id}-${profile.updatedAt || profile.username}`}
      onClose={onClose}
      profile={profile}
      onSuccess={onSuccess}
    />
  );
}

function EditProfileDialogContent({
  onClose,
  profile,
  onSuccess,
}: Omit<EditProfileModalProps, 'isOpen'>) {
  // Form State initialized from profile props
  const [username, setUsername] = useState(profile.username || '');
  const [avatar, setAvatar] = useState(profile.avatar || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [facebook, setFacebook] = useState(profile.socialLinks?.facebook || '');
  const [instagram, setInstagram] = useState(profile.socialLinks?.instagram || '');
  const [github, setGithub] = useState(profile.socialLinks?.github || '');

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [avatarPreviewError, setAvatarPreviewError] = useState(false);

  // UploadThing State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { startUpload } = useUploadThing('avatarUploader', {
    onUploadProgress: (progress) => {
      setUploadProgress(progress);
    },
    onClientUploadComplete: (res) => {
      setIsUploadingAvatar(false);
      setUploadProgress(100);
      if (res && res[0]) {
        const remoteUrl = res[0].url || res[0].ufsUrl;
        setAvatar(remoteUrl);
        setAvatarPreviewError(false);
        toast.success('Đã tải ảnh lên UploadThing thành công!');
      }
    },
    onUploadError: (error: Error) => {
      setIsUploadingAvatar(false);
      toast.error(`Lỗi tải ảnh UploadThing: ${error.message}`);
    },
  });

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting && !isUploadingAvatar) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSubmitting, isUploadingAvatar, onClose]);

  // Handle direct file upload via UploadThing
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate MIME type
    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ chấp nhận các tệp hình ảnh (JPEG, PNG, WebP, GIF).');
      return;
    }

    // Validate file size (max 4MB)
    if (file.size > 4 * 1024 * 1024) {
      toast.error('Dung lượng hình ảnh không được vượt quá 4MB.');
      return;
    }

    // Immediate local preview
    const localPreviewUrl = URL.createObjectURL(file);
    setAvatar(localPreviewUrl);
    setAvatarPreviewError(false);

    setIsUploadingAvatar(true);
    setUploadProgress(0);

    try {
      await startUpload([file]);
    } catch (err: unknown) {
      setIsUploadingAvatar(false);
      const msg = err instanceof Error ? err.message : 'Tải ảnh thất bại.';
      toast.error(`Tải ảnh thất bại: ${msg}`);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Client Validation
  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      errors.username = 'Tên tài khoản không được để trống.';
    } else if (cleanUsername.length < 3) {
      errors.username = 'Tên tài khoản phải có ít nhất 3 ký tự.';
    } else if (cleanUsername.length > 30) {
      errors.username = 'Tên tài khoản không được vượt quá 30 ký tự.';
    }

    if (phone.trim()) {
      const cleanPhone = phone.trim();
      const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
      if (!phoneRegex.test(cleanPhone)) {
        errors.phone = 'Số điện thoại Việt Nam không hợp lệ (VD: 0987654321).';
      }
    }

    if (bio.length > 200) {
      errors.bio = 'Giới thiệu bản thân không được vượt quá 200 ký tự.';
    }

    if (avatar.trim()) {
      try {
        new URL(avatar.trim());
      } catch {
        // Blob URLs for local previews are valid URLs
        if (!avatar.startsWith('blob:')) {
          errors.avatar = 'URL ảnh đại diện không hợp lệ (phải bắt đầu bằng http:// hoặc https://).';
        }
      }
    }

    if (facebook.trim()) {
      try {
        new URL(facebook.trim());
      } catch {
        errors.facebook = 'URL Facebook không hợp lệ.';
      }
    }

    if (instagram.trim()) {
      try {
        new URL(instagram.trim());
      } catch {
        errors.instagram = 'URL Instagram không hợp lệ.';
      }
    }

    if (github.trim()) {
      try {
        new URL(github.trim());
      } catch {
        errors.github = 'URL GitHub không hợp lệ.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isUploadingAvatar) return;

    if (!validate()) {
      setFormError('Vui lòng kiểm tra lại các trường thông tin bên dưới.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    const payload: UpdateProfileRequest = {
      username: username.trim(),
      phone: phone.trim() || undefined,
      bio: bio.trim() || undefined,
      avatar: avatar.trim() || undefined,
      socialLinks: {
        facebook: facebook.trim() || undefined,
        instagram: instagram.trim() || undefined,
        github: github.trim() || undefined,
      },
    };

    try {
      const updated = await userService.updateMe(payload);
      toast.success('Cập nhật hồ sơ cá nhân thành công!');
      onSuccess(updated);
      onClose();
    } catch (err: unknown) {
      if (err instanceof AppApiError) {
        if (err.validationErrors) {
          setFieldErrors(err.validationErrors);
        }
        setFormError(err.message || 'Không thể cập nhật hồ sơ.');
      } else if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Đã xảy ra lỗi không xác định. Vui lòng thử lại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#312e42]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#1d1926] rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col gap-6 border border-[#f1ebff] dark:border-[#2f2742]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#f7f1ff] dark:border-[#2b2438] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#eddcff] dark:bg-[#342747] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-[#1c192c] dark:text-[#f4eeff]">
                Chỉnh sửa hồ sơ cá nhân
              </h2>
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
                Cập nhật thông tin nhận diện, liên hệ và ảnh đại diện của bạn tại TMdemy
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting || isUploadingAvatar}
            aria-label="Đóng cửa sổ"
            className="p-1.5 rounded-lg text-[#635a72] dark:text-[#a9a0b2] hover:bg-[#f7f1ff] dark:hover:bg-[#252030] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Error Banner */}
        {formError && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2.5 text-xs text-rose-800 dark:text-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* SECTION 1: AVATAR MANAGEMENT WITH UPLOADTHING & LIVE PREVIEW */}
          <div className="p-4 rounded-xl bg-[#f7f1ff] dark:bg-[#252030] flex flex-col gap-3 border border-[#ebe5ff] dark:border-[#332b40]">
            <span className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff]">
              Ảnh đại diện (Avatar)
            </span>

            {/* Hidden native file input for UploadThing */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploadingAvatar || isSubmitting}
            />

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Avatar Preview Box */}
              <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden ring-2 ring-[#7240b8] dark:ring-[#a87ffb] shadow-md bg-white dark:bg-[#1d1926] shrink-0">
                {avatar.trim() && !avatarPreviewError ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={avatar.trim()}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={() => setAvatarPreviewError(true)}
                    onLoad={() => setAvatarPreviewError(false)}
                  />
                ) : (
                  <div className="w-full h-full rounded-xl bg-[#7240b8] dark:bg-[#8b5ad3] text-white flex items-center justify-center text-2xl font-bold">
                    {getInitials(username || profile.username)}
                  </div>
                )}

                {/* Uploading Progress Overlay */}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-2xs flex flex-col items-center justify-center text-white">
                    <Loader2 className="w-5 h-5 animate-spin text-[#6ffbbe]" />
                    <span className="text-[10px] font-bold mt-1">{uploadProgress}%</span>
                  </div>
                )}
              </div>

              {/* Avatar Actions & URL input */}
              <div className="flex-1 w-full flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={avatar}
                    onChange={(e) => {
                      setAvatar(e.target.value);
                      setAvatarPreviewError(false);
                      if (fieldErrors.avatar) {
                        setFieldErrors((prev) => ({ ...prev, avatar: '' }));
                      }
                    }}
                    placeholder="Dán link ảnh (https://...) hoặc tải ảnh từ máy"
                    disabled={isSubmitting || isUploadingAvatar}
                    className="flex-1 h-9 px-3 rounded-lg bg-white dark:bg-[#1d1926] border border-[#d8d0e5] dark:border-[#3d344d] text-xs text-[#1c192c] dark:text-[#f4eeff] placeholder:text-[#968e9e] focus:outline-none focus:ring-2 focus:ring-[#7240b8]"
                  />
                  {avatar.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        setAvatar('');
                        setAvatarPreviewError(false);
                      }}
                      disabled={isSubmitting || isUploadingAvatar}
                      className="p-2 rounded-lg text-[#ba1a1a] dark:text-[#ffb4ab] hover:bg-white dark:hover:bg-[#1d1926] transition-colors cursor-pointer"
                      title="Xóa đường dẫn avatar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {fieldErrors.avatar && (
                  <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                    {fieldErrors.avatar}
                  </span>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar || isSubmitting}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#1d1926] hover:bg-[#ebe5ff] dark:hover:bg-[#332b40] text-[#7240b8] dark:text-[#a87ffb] text-[11px] font-semibold transition-colors border border-[#d8d0e5] dark:border-[#3d344d] cursor-pointer disabled:opacity-50"
                  >
                    {isUploadingAvatar ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Đang tải lên ({uploadProgress}%)...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-3.5 h-3.5" />
                        Tải ảnh từ máy tính (UploadThing)
                      </>
                    )}
                  </button>
                  <span className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
                    (Hỗ trợ PNG, JPEG, WebP tối đa 4MB)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: BASIC INFORMATION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff] flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
                Tên tài khoản (Username) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (fieldErrors.username) {
                    setFieldErrors((prev) => ({ ...prev, username: '' }));
                  }
                }}
                disabled={isSubmitting}
                className="h-10 px-3 rounded-xl bg-[#f7f1ff] dark:bg-[#252030] border border-[#ebe5ff] dark:border-[#332b40] text-sm text-[#1c192c] dark:text-[#f4eeff] focus:outline-none focus:ring-2 focus:ring-[#7240b8]"
              />
              {fieldErrors.username && (
                <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                  {fieldErrors.username}
                </span>
              )}
            </div>

            {/* Email (Read Only) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff] flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-[#7c7483]" />
                Địa chỉ Email (Định danh hệ thống)
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="h-10 px-3 rounded-xl bg-gray-100 dark:bg-[#16131c] border border-gray-200 dark:border-[#2a2436] text-sm text-[#7c7483] cursor-not-allowed"
                title="Email không thể thay đổi"
              />
              <span className="text-[10px] text-[#7c7483]">
                Không thể thay đổi vì email là định danh tài khoản đăng nhập.
              </span>
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff] flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
                Số điện thoại liên hệ
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (fieldErrors.phone) {
                    setFieldErrors((prev) => ({ ...prev, phone: '' }));
                  }
                }}
                placeholder="VD: 0987654321"
                disabled={isSubmitting}
                className="h-10 px-3 rounded-xl bg-[#f7f1ff] dark:bg-[#252030] border border-[#ebe5ff] dark:border-[#332b40] text-sm text-[#1c192c] dark:text-[#f4eeff] focus:outline-none focus:ring-2 focus:ring-[#7240b8]"
              />
              {fieldErrors.phone && (
                <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                  {fieldErrors.phone}
                </span>
              )}
            </div>

            {/* Bio */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff] flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
                  Giới thiệu bản thân (Bio)
                </label>
                <span
                  className={`text-[11px] font-medium ${
                    bio.length > 200
                      ? 'text-rose-600 dark:text-rose-400 font-bold'
                      : 'text-[#635a72] dark:text-[#a9a0b2]'
                  }`}
                >
                  {bio.length}/200
                </span>
              </div>
              <textarea
                value={bio}
                onChange={(e) => {
                  setBio(e.target.value);
                  if (fieldErrors.bio) {
                    setFieldErrors((prev) => ({ ...prev, bio: '' }));
                  }
                }}
                rows={3}
                placeholder="Mô tả ngắn gọn về kinh nghiệm, mục tiêu học tập hoặc đam mê của bạn..."
                disabled={isSubmitting}
                className="p-3 rounded-xl bg-[#f7f1ff] dark:bg-[#252030] border border-[#ebe5ff] dark:border-[#332b40] text-sm text-[#1c192c] dark:text-[#f4eeff] focus:outline-none focus:ring-2 focus:ring-[#7240b8] resize-none"
              />
              {fieldErrors.bio && (
                <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                  {fieldErrors.bio}
                </span>
              )}
            </div>
          </div>

          {/* SECTION 3: SOCIAL LINKS */}
          <div className="flex flex-col gap-3 pt-2 border-t border-[#f7f1ff] dark:border-[#2b2438]">
            <span className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff] flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
              Kênh mạng xã hội &amp; Hồ sơ cá nhân
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* GitHub */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-[#635a72] dark:text-[#a9a0b2]">
                  GitHub URL
                </label>
                <input
                  type="url"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="https://github.com/..."
                  disabled={isSubmitting}
                  className="h-9 px-3 rounded-lg bg-[#f7f1ff] dark:bg-[#252030] border border-[#ebe5ff] dark:border-[#332b40] text-xs text-[#1c192c] dark:text-[#f4eeff] focus:outline-none focus:ring-2 focus:ring-[#7240b8]"
                />
                {fieldErrors.github && (
                  <span className="text-[10px] text-rose-600 dark:text-rose-400">
                    {fieldErrors.github}
                  </span>
                )}
              </div>

              {/* Facebook */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-[#635a72] dark:text-[#a9a0b2]">
                  Facebook URL
                </label>
                <input
                  type="url"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="https://facebook.com/..."
                  disabled={isSubmitting}
                  className="h-9 px-3 rounded-lg bg-[#f7f1ff] dark:bg-[#252030] border border-[#ebe5ff] dark:border-[#332b40] text-xs text-[#1c192c] dark:text-[#f4eeff] focus:outline-none focus:ring-2 focus:ring-[#7240b8]"
                />
                {fieldErrors.facebook && (
                  <span className="text-[10px] text-rose-600 dark:text-rose-400">
                    {fieldErrors.facebook}
                  </span>
                )}
              </div>

              {/* Instagram */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-[#635a72] dark:text-[#a9a0b2]">
                  Instagram URL
                </label>
                <input
                  type="url"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="https://instagram.com/..."
                  disabled={isSubmitting}
                  className="h-9 px-3 rounded-lg bg-[#f7f1ff] dark:bg-[#252030] border border-[#ebe5ff] dark:border-[#332b40] text-xs text-[#1c192c] dark:text-[#f4eeff] focus:outline-none focus:ring-2 focus:ring-[#7240b8]"
                />
                {fieldErrors.instagram && (
                  <span className="text-[10px] text-rose-600 dark:text-rose-400">
                    {fieldErrors.instagram}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#f7f1ff] dark:border-[#2b2438]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || isUploadingAvatar}
              className="px-4 h-10 rounded-xl bg-[#f7f1ff] dark:bg-[#252030] hover:bg-[#ebe5ff] dark:hover:bg-[#2d273a] text-[#1c192c] dark:text-[#f4eeff] text-xs font-semibold transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingAvatar}
              className="inline-flex items-center justify-center gap-2 px-5 h-10 rounded-xl bg-[#7240b8] hover:bg-[#8b5ad3] disabled:opacity-50 text-white text-xs font-semibold transition-colors shadow-md shadow-[#7240b8]/20 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang lưu...
                </>
              ) : isUploadingAvatar ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang tải ảnh lên...
                </>
              ) : (
                'Lưu thay đổi'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
