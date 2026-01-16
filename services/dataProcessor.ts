
// Fixed import for SyscallData to come from types.ts as it is not exported from constants.ts
import { SyscallData } from '../types';

export interface ParsedData {
  [key: string]: number;
}

/**
 * Parses raw file content into a frequency map of syscalls.
 * Supports: 
 * 1. "syscall,count" (CSV)
 * 2. Raw list of syscalls (one per line)
 */
export const parseSyscallFile = (content: string): ParsedData => {
  const lines = content.split(/\r?\n/);
  const data: ParsedData = {};

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Check if it's CSV format: syscall,count
    if (trimmed.includes(',')) {
      const [name, countStr] = trimmed.split(',');
      const count = parseInt(countStr.trim(), 10);
      if (name && !isNaN(count)) {
        data[name.trim()] = (data[name.trim()] || 0) + count;
      }
    } else {
      // It's a raw trace: syscall
      const name = trimmed.toLowerCase();
      data[name] = (data[name] || 0) + 1;
    }
  });

  return data;
};

/**
 * Compares two datasets and generates SyscallData for the UI.
 */
export const analyzeDeviations = (
  baseline: ParsedData, 
  test: ParsedData
): { syscalls: SyscallData[], avgDeviation: number } => {
  const allKeys = Array.from(new Set([...Object.keys(baseline), ...Object.keys(test)]));
  
  const syscalls: SyscallData[] = allKeys.map(name => {
    const bCount = baseline[name] || 0;
    const tCount = test[name] || 0;
    
    // Deviation calculation: |test - baseline| / baseline * 100
    // If baseline is 0 but test exists, it's a 100% deviation (new behavior)
    let deviation = 0;
    if (bCount === 0 && tCount > 0) {
      deviation = 100; 
    } else if (bCount > 0) {
      deviation = Math.abs((tCount - bCount) / bCount) * 100;
    }

    return {
      name,
      baseline: bCount,
      test: tCount,
      deviation
    };
  });

  // Sort by highest deviation for visibility
  syscalls.sort((a, b) => b.deviation - a.deviation);

  const avgDeviation = syscalls.reduce((acc, curr) => acc + curr.deviation, 0) / (syscalls.length || 1);

  return { syscalls, avgDeviation };
};

/**
 * Generates a string representation of a sample CSV for templates.
 */
export const getSampleCSV = (type: 'normal' | 'intrusion'): string => {
  if (type === 'normal') {
    return `read,450\nwrite,380\nopenat,120\nclose,115\nmmap,90\nmprotect,40\nrt_sigaction,30\nioctl,25`;
  }
  return `read,850\nwrite,900\nopenat,450\nclose,430\nmmap,120\nmprotect,850\nexecve,15\nsocket,22\nconnect,18`;
};
