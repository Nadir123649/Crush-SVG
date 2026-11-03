// Next.js route segment loading file.
// The admin layout already renders AdminLoader while auth status is loading;
// returning null here prevents a duplicate loader on initial navigation.
export default function AdminLoading() {
  return null;
}
