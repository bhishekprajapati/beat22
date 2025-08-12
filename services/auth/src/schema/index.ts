import z from "zod";

export const email = z.email();
export const password = z.string().trim().min(16).max(20);
