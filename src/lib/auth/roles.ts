export function isAdminEmail(email: string | null | undefined): boolean {
    if (!email)
        return false;
    const admins = (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    const normalized = email.toLowerCase().trim();
    if (normalized === "abdulraheem55jutt@gmail.com" || normalized === "askaraheemwebdeveloper2@gmail.com") return true;
    return admins.includes(normalized);
}
