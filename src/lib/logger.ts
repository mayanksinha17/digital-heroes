/**
 * Digital Heroes - Structured Logger
 */

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, context ? JSON.stringify(context) : "");
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, context ? JSON.stringify(context) : "");
  },
  error: (message: string, error?: unknown, context?: Record<string, unknown>) => {
    console.error(
      `[ERROR] ${new Date().toISOString()} - ${message}`,
      error,
      context ? JSON.stringify(context) : ""
    );
  },
};
