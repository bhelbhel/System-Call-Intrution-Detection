
export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface SyscallData {
  name: string;
  baseline: number;
  test: number;
  deviation: number;
}

export interface TimelinePoint {
  time: string;
  frequency: number;
  anomalyScore: number;
}

export interface SecurityAlert {
  id: string;
  severity: RiskLevel;
  title: string;
  message: string;
  timestamp: string;
  analysisId: string;
  read: boolean;
}

export interface AnalysisResult {
  id: string; // Unique identifier for history retrieval
  status: 'NORMAL' | 'INTRUSION';
  deviationScore: number;
  riskLevel: RiskLevel;
  syscalls: SyscallData[];
  timeline: TimelinePoint[];
  timestamp: string;
  explanation?: string;
  metadata?: {
    baselineFile: string;
    testFile: string;
  };
}

export type ViewState = 'UPLOAD' | 'DASHBOARD' | 'HISTORY' | 'SETTINGS' | 'ALERTS';
