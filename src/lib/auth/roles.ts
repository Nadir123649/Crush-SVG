export function isAdminEmail(email: string | null | undefined): boolean {
    if (!email)
        return false;
    const admins = (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    const normalized = email.toLowerCase().trim();
    return admins.includes(normalized);
}
