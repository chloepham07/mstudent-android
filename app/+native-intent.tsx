// iOS Share Extension mở app bằng link "mstudent://dataUrl=..." — chuyển sang màn hình /share
// thay vì để Expo Router báo "không tìm thấy trang".
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    if (path.includes('dataUrl=')) return '/share';
    return path;
  } catch {
    return '/';
  }
}
