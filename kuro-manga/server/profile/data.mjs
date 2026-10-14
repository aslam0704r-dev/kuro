import { fail } from '../managed/http.mjs';
export const BUCKET = 'kuro-avatars';
export function validateName(value) {
  if (typeof value !== 'string') fail('Enter a display name of 2–60 characters.');
  const name = value.normalize('NFC').trim();
  if ([...name].length < 2 || [...name].length > 60 || /[\p{Cc}\p{Cf}]/u.test(name)) fail('Use 2–60 visible characters without control characters.');
  return name;
}
export function displayName(user) {
  const meta = user.user_metadata || {};
  const value = [meta.display_name, meta.full_name].find(v => typeof v === 'string' && v.trim()) || 'Reader';
  return [...value.normalize('NFC').replace(/[\p{Cc}\p{Cf}]/gu, '').trim()].slice(0, 60).join('') || 'Reader';
}
export function avatarPath(user) {
  const value = user.user_metadata?.avatar_path;
  if (typeof value !== 'string' || !/^[a-f0-9-]{36}\/[a-f0-9]{48}\.webp$/.test(value) || value.split('/')[0] !== user.id) return '';
  return value;
}
export const profileView = user => ({ id: user.id, name: displayName(user), hasAvatar: !!avatarPath(user) });
