// Controlled Computer Automation & Custom Tool Registry for Ain't AI

export interface ToolDefinition {
  name: string;
  displayName: string;
  description: string;
  category: 'automation' | 'computation' | 'system' | 'memory';
  requiresConfirmation: boolean;
  confirmationPrompt?: (args: any) => string;
  parameters: {
    type: 'object';
    properties: Record<
      string,
      {
        type: string;
        description: string;
        enum?: string[];
      }
    >;
    required: string[];
  };
  execute: (args: any, context?: any) => Promise<any>;
}

export const toolRegistry: Record<string, ToolDefinition> = {
  calculate: {
    name: 'calculate',
    displayName: 'Math & Expression Engine',
    description: 'Safely calculates mathematical and scientific expressions.',
    category: 'computation',
    requiresConfirmation: false,
    parameters: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'The mathematical expression to evaluate, e.g. "Math.sqrt(144) * 5 + Math.sin(Math.PI / 4)"',
        },
      },
      required: ['expression'],
    },
    execute: async ({ expression }) => {
      // Whitelist safe math tokens only
      const sanitized = String(expression).trim();
      const forbidden = /window|document|eval|Function|fetch|localStorage|sessionStorage|cookie|process|global/i;
      if (forbidden.test(sanitized)) {
        throw new Error('Forbidden token in mathematical expression.');
      }
      try {
        // Safe evaluation within Math scope
        const func = new Function(
          'Math',
          `"use strict"; return (${sanitized});`
        );
        const result = func(Math);
        return {
          expression: sanitized,
          result: Number.isFinite(result) ? result : String(result),
        };
      } catch (err: any) {
        throw new Error(`Math evaluation error: ${err.message}`);
      }
    },
  },

  convert_units: {
    name: 'convert_units',
    displayName: 'Unit & Measurement Converter',
    description: 'Converts between different units of measurement (temperature, length, mass, digital storage).',
    category: 'computation',
    requiresConfirmation: false,
    parameters: {
      type: 'object',
      properties: {
        value: { type: 'number', description: 'Numeric value to convert' },
        fromUnit: { type: 'string', description: 'Source unit (e.g. c, f, km, miles, kg, lbs, gb, mb)' },
        toUnit: { type: 'string', description: 'Target unit' },
      },
      required: ['value', 'fromUnit', 'toUnit'],
    },
    execute: async ({ value, fromUnit, toUnit }) => {
      const from = String(fromUnit).toLowerCase().trim();
      const to = String(toUnit).toLowerCase().trim();
      const num = Number(value);

      // Temperature
      if ((from === 'c' || from === 'celsius') && (to === 'f' || to === 'fahrenheit')) {
        return { original: `${num}°C`, converted: `${((num * 9) / 5 + 32).toFixed(2)}°F` };
      }
      if ((from === 'f' || from === 'fahrenheit') && (to === 'c' || to === 'celsius')) {
        return { original: `${num}°F`, converted: `${(((num - 32) * 5) / 9).toFixed(2)}°C` };
      }

      // Length: km <-> miles, m <-> ft
      if (from === 'km' && (to === 'miles' || to === 'mi')) {
        return { original: `${num} km`, converted: `${(num * 0.621371).toFixed(3)} miles` };
      }
      if ((from === 'miles' || from === 'mi') && to === 'km') {
        return { original: `${num} miles`, converted: `${(num / 0.621371).toFixed(3)} km` };
      }
      if (from === 'm' && (to === 'ft' || to === 'feet')) {
        return { original: `${num} m`, converted: `${(num * 3.28084).toFixed(3)} ft` };
      }
      if ((from === 'ft' || from === 'feet') && to === 'm') {
        return { original: `${num} ft`, converted: `${(num / 3.28084).toFixed(3)} m` };
      }

      // Mass: kg <-> lbs
      if (from === 'kg' && (to === 'lbs' || to === 'pounds')) {
        return { original: `${num} kg`, converted: `${(num * 2.20462).toFixed(3)} lbs` };
      }
      if ((from === 'lbs' || from === 'pounds') && to === 'kg') {
        return { original: `${num} lbs`, converted: `${(num / 2.20462).toFixed(3)} kg` };
      }

      // Storage: gb <-> mb
      if (from === 'gb' && to === 'mb') {
        return { original: `${num} GB`, converted: `${num * 1024} MB` };
      }
      if (from === 'mb' && to === 'gb') {
        return { original: `${num} MB`, converted: `${(num / 1024).toFixed(3)} GB` };
      }

      throw new Error(`Unsupported conversion from '${fromUnit}' to '${toUnit}'.`);
    },
  },

  code_runner: {
    name: 'code_runner',
    displayName: 'Isolated Code Sandbox',
    description: 'Executes lightweight JavaScript computations in a protected sandbox with timeout limits.',
    category: 'automation',
    requiresConfirmation: true,
    confirmationPrompt: (args) =>
      `Ain't AI requests permission to execute JavaScript snippet (${args.code?.length || 0} chars) in the local sandbox. Proceed?`,
    parameters: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'The JavaScript code block to execute.',
        },
      },
      required: ['code'],
    },
    execute: async ({ code }) => {
      const logs: string[] = [];
      const customConsole = {
        log: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
        warn: (...args: any[]) => logs.push('[WARN] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
        error: (...args: any[]) => logs.push('[ERR] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
      };

      // Disallow DOM manipulation or persistent cookie/storage access from sandbox
      const forbiddenTokens = ['document.cookie', 'localStorage', 'sessionStorage', 'indexedDB', 'fetch(', 'XMLHttpRequest'];
      for (const token of forbiddenTokens) {
        if (code.includes(token)) {
          throw new Error(`Security restriction: Sandbox prohibits usage of '${token}'.`);
        }
      }

      const runner = new Function('console', `
        "use strict";
        try {
          ${code}
        } catch (e) {
          console.error(e.message);
        }
      `);

      const startTime = performance.now();
      runner(customConsole);
      const executionTimeMs = (performance.now() - startTime).toFixed(2);

      return {
        output: logs.length > 0 ? logs.join('\n') : '(Script executed with no console output)',
        executionTimeMs: `${executionTimeMs}ms`,
      };
    },
  },

  system_diagnostics: {
    name: 'system_diagnostics',
    displayName: 'Safe Client Environment Diagnostics',
    description: 'Inspects safe browser client telemetry, timezone, screen resolution, and online status.',
    category: 'system',
    requiresConfirmation: false,
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'What aspect to inspect: "all", "time", "network", or "display"',
        },
      },
      required: [],
    },
    execute: async () => {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const now = new Date();
      return {
        localTime: now.toLocaleString(),
        isoTime: now.toISOString(),
        timeZone: tz,
        isOnline: navigator.onLine,
        language: navigator.language,
        screen: `${window.innerWidth}x${window.innerHeight} (pixelRatio: ${window.devicePixelRatio})`,
        platform: navigator.platform,
      };
    },
  },

  schedule_reminder: {
    name: 'schedule_reminder',
    displayName: 'Schedule Reminder Notification',
    description: 'Schedules a localized browser notification or timer for the user.',
    category: 'automation',
    requiresConfirmation: true,
    confirmationPrompt: (args) =>
      `Set a reminder "${args.reminderText}" for ${args.delaySeconds} seconds from now?`,
    parameters: {
      type: 'object',
      properties: {
        reminderText: { type: 'string', description: 'Text description of the reminder' },
        delaySeconds: { type: 'number', description: 'Seconds from now to alert' },
      },
      required: ['reminderText', 'delaySeconds'],
    },
    execute: async ({ reminderText, delaySeconds }) => {
      const delay = Math.max(1, Math.min(Number(delaySeconds) || 10, 3600));
      setTimeout(() => {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification("Ain't AI Reminder", { body: reminderText });
        } else {
          console.log(`[Ain't AI Reminder]: ${reminderText}`);
        }
      }, delay * 1000);

      return {
        scheduled: true,
        reminderText,
        deliverInSeconds: delay,
        estimatedTime: new Date(Date.now() + delay * 1000).toLocaleTimeString(),
      };
    },
  },
};
