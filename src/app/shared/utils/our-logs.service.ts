/**
 * OurLogs - Custom logging utility for Tenmiye
 *
 * Provides styled console logging with customizable colors, fonts, and prefixes.
 * Can be used throughout the application instead of console.log().
 *
 * @example
 * ```typescript
 * import { OurLogs } from '@shared/utils/our-logs.service';
 *
 * OurLogs.info('User logged in', { userId: 123 });
 * OurLogs.error('Failed to fetch data', error);
 * OurLogs.debug('Component initialized');
 * OurLogs.custom('Custom message', { color: '#ff00ff', prefix: '[CUSTOM]' });
 * ```
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'success' | 'custom';

export interface LogStyle {
  color?: string;
  backgroundColor?: string;
  fontSize?: string;
  fontWeight?: string;
  fontFamily?: string;
  padding?: string;
  borderRadius?: string;
  border?: string;
}

export interface LogOptions {
  prefix?: string;
  style?: LogStyle;
  showTimestamp?: boolean;
  showLevel?: boolean;
  color?: string;
  backgroundColor?: string;
}

export class OurLogs {
  private static readonly DEFAULT_PREFIX = '[tenmiye]';
  private static readonly DEFAULT_FONT_FAMILY = 'Monaco, Menlo, Consolas, monospace';

  private static enabled = true;
  private static globalPrefix = OurLogs.DEFAULT_PREFIX;

  /**
   * Predefined color schemes for different log levels
   */
  private static readonly LEVEL_STYLES: Record<LogLevel, LogStyle> = {
    info: {
      color: '#2196F3',
      backgroundColor: '#E3F2FD',
      fontWeight: 'normal',
    },
    warn: {
      color: '#FF9800',
      backgroundColor: '#FFF3E0',
      fontWeight: 'bold',
    },
    error: {
      color: '#F44336',
      backgroundColor: '#FFEBEE',
      fontWeight: 'bold',
    },
    debug: {
      color: '#9C27B0',
      backgroundColor: '#F3E5F5',
      fontWeight: 'normal',
    },
    success: {
      color: '#4CAF50',
      backgroundColor: '#E8F5E9',
      fontWeight: 'bold',
    },
    custom: {
      color: '#607D8B',
      backgroundColor: '#ECEFF1',
      fontWeight: 'normal',
    },
  };

  /**
   * Enable or disable all logging
   */
  static setEnabled(enabled: boolean): void {
    OurLogs.enabled = enabled;
  }

  /**
   * Set global prefix for all logs
   */
  static setGlobalPrefix(prefix: string): void {
    OurLogs.globalPrefix = prefix;
  }

  /**
   * Info level log - for general information
   */
  static info(message: string, ...args: any[]): void {
    OurLogs.log('info', message, {}, ...args);
  }

  /**
   * Warning level log - for warnings
   */
  static warn(message: string, ...args: any[]): void {
    OurLogs.log('warn', message, {}, ...args);
  }

  /**
   * Error level log - for errors
   */
  static error(message: string, ...args: any[]): void {
    OurLogs.log('error', message, {}, ...args);
  }

  /**
   * Debug level log - for debugging information
   */
  static debug(message: string, ...args: any[]): void {
    OurLogs.log('debug', message, {}, ...args);
  }

  /**
   * Success level log - for success messages
   */
  static success(message: string, ...args: any[]): void {
    OurLogs.log('success', message, {}, ...args);
  }

  /**
   * Custom styled log with full control
   */
  static custom(message: string, options: LogOptions, ...args: any[]): void {
    OurLogs.log('custom', message, options, ...args);
  }

  /**
   * Group multiple logs together
   */
  static group(label: string, collapsed: boolean = false): void {
    if (!OurLogs.enabled) return;

    if (collapsed) {
      console.groupCollapsed(`${OurLogs.globalPrefix} ${label}`);
    } else {
      console.group(`${OurLogs.globalPrefix} ${label}`);
    }
  }

  /**
   * End a log group
   */
  static groupEnd(): void {
    if (!OurLogs.enabled) return;
    console.groupEnd();
  }

  /**
   * Log a table (useful for arrays of objects)
   */
  static table(data: any, columns?: string[]): void {
    if (!OurLogs.enabled) return;

    console.log(`%c${OurLogs.globalPrefix} Table`, OurLogs.buildStyle('info'));
    if (columns) {
      console.table(data, columns);
    } else {
      console.table(data);
    }
  }

  /**
   * Clear the console
   */
  static clear(): void {
    console.clear();
  }

  /**
   * Core logging method
   * Note: Not truly private to allow LoggerInstance to use it
   */
  static log(
    level: LogLevel,
    message: string,
    options: LogOptions = {},
    ...args: any[]
  ): void {
    if (!OurLogs.enabled) return;

    const {
      prefix = OurLogs.globalPrefix,
      style = {},
      showTimestamp = false,
      showLevel = true,
    } = options;

    // Build the prefix parts
    const parts: string[] = [];

    if (prefix) {
      parts.push(prefix);
    }

    if (showLevel) {
      parts.push(`[${level.toUpperCase()}]`);
    }

    if (showTimestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }

    const fullPrefix = parts.join(' ');
    const finalStyle = { ...OurLogs.LEVEL_STYLES[level], ...style };
    const cssStyle = OurLogs.buildStyle(level, finalStyle, options);

    // Capture source location for expandable console entries
    const sourceInfo = OurLogs.getSourceLocation();

    // Use console.groupCollapsed to make each log expandable with source info
    console.groupCollapsed(`%c${fullPrefix}%c ${message}`, cssStyle, '');

    // Log the arguments if any
    if (args.length > 0) {
      args.forEach((arg, index) => {
        console.log(arg);
      });
    }

    // Always show source file location
    if (sourceInfo) {
      console.log(`%c${sourceInfo}`, 'color: #666; font-size: 11px;');
    }

    console.groupEnd();
  }

  /**
   * Get source file location from stack trace
   */
  private static getSourceLocation(): string | null {
    try {
      const stack = new Error().stack;
      if (!stack) return null;

      const lines = stack.split('\n');

      // Find the first line that's not from our-logs.service.ts
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Skip lines from our-logs.service.ts
        if (line.includes('our-logs.service.ts')) continue;

        // Skip lines from Error constructor
        if (line.includes('Error')) continue;

        // Extract file path and line number
        // Format: "at ClassName.methodName (filepath:line:column)"
        const match = line.match(/\((.*):(\d+):(\d+)\)/) || line.match(/at (.*):(\d+):(\d+)/);

        if (match) {
          const filePath = match[1];
          const lineNum = match[2];

          // Clean up the file path to show relative path
          const cleanPath = filePath.replace(/.*\/(src\/.*)/, '$1');

          return `${cleanPath}:${lineNum}`;
        }
      }

      return null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Build CSS style string from LogStyle object
   */
  private static buildStyle(
    level: LogLevel,
    customStyle?: LogStyle,
    options?: LogOptions
  ): string {
    const baseStyle = OurLogs.LEVEL_STYLES[level];
    const mergedStyle = { ...baseStyle, ...customStyle };

    // Allow direct color override from options
    if (options?.color) {
      mergedStyle.color = options.color;
    }
    if (options?.backgroundColor) {
      mergedStyle.backgroundColor = options.backgroundColor;
    }

    const styles: string[] = [];

    if (mergedStyle.color) {
      styles.push(`color: ${mergedStyle.color}`);
    }
    if (mergedStyle.backgroundColor) {
      styles.push(`background-color: ${mergedStyle.backgroundColor}`);
    }
    if (mergedStyle.fontSize) {
      styles.push(`font-size: ${mergedStyle.fontSize}`);
    }
    if (mergedStyle.fontWeight) {
      styles.push(`font-weight: ${mergedStyle.fontWeight}`);
    }
    if (mergedStyle.fontFamily) {
      styles.push(`font-family: ${mergedStyle.fontFamily}`);
    } else {
      styles.push(`font-family: ${OurLogs.DEFAULT_FONT_FAMILY}`);
    }
    if (mergedStyle.padding) {
      styles.push(`padding: ${mergedStyle.padding}`);
    } else {
      styles.push('padding: 2px 6px');
    }
    if (mergedStyle.borderRadius) {
      styles.push(`border-radius: ${mergedStyle.borderRadius}`);
    } else {
      styles.push('border-radius: 3px');
    }
    if (mergedStyle.border) {
      styles.push(`border: ${mergedStyle.border}`);
    }

    return styles.join('; ');
  }

  /**
   * Create a logger instance with a specific prefix
   */
  static createLogger(prefix: string): LoggerInstance {
    return new LoggerInstance(prefix);
  }
}

/**
 * Logger instance with a specific prefix
 */
export class LoggerInstance {
  constructor(private prefix: string) {}

  info(message: string, ...args: any[]): void {
    OurLogs.custom(message, { prefix: this.prefix }, ...args);
  }

  warn(message: string, ...args: any[]): void {
    OurLogs.log('warn', message, { prefix: this.prefix }, ...args);
  }

  error(message: string, ...args: any[]): void {
    OurLogs.log('error', message, { prefix: this.prefix }, ...args);
  }

  debug(message: string, ...args: any[]): void {
    OurLogs.log('debug', message, { prefix: this.prefix }, ...args);
  }

  success(message: string, ...args: any[]): void {
    OurLogs.log('success', message, { prefix: this.prefix }, ...args);
  }

  custom(message: string, options: LogOptions, ...args: any[]): void {
    OurLogs.custom(message, { ...options, prefix: this.prefix }, ...args);
  }
}
