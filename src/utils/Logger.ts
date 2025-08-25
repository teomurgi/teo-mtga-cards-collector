type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

export class Logger {
  private static level: LogLevel = 'info';

  static setLevel(level: LogLevel): void {
    this.level = level;
  }

  static debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.log(`🔍 [DEBUG] ${message}`, ...args);
    }
  }

  static info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.log(`ℹ️  [INFO] ${message}`, ...args);
    }
  }

  static warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(`⚠️  [WARN] ${message}`, ...args);
    }
  }

  static error(message: string, error?: unknown): void {
    if (this.shouldLog('error')) {
      console.error(`❌ [ERROR] ${message}`, error);
    }
  }

  static success(message: string, ...args: unknown[]): void {
    if (this.shouldLog('success')) {
      console.log(`✅ [SUCCESS] ${message}`, ...args);
    }
  }

  private static shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      success: 1
    };
    return levels[level] >= levels[this.level];
  }
}
