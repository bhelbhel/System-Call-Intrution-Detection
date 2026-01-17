
import { SyscallData, TimelinePoint } from './types';

export const COMMON_SYSCALLS = [
  'read', 'write', 'openat', 'close', 'fstat', 'mmap', 'mprotect', 'munmap',
  'brk', 'rt_sigaction', 'rt_sigprocmask', 'ioctl', 'pread64', 'pwrite64',
  'access', 'pipe', 'select', 'sched_yield', 'mremap', 'msync', 'mincore',
  'madvise', 'shmget', 'shmat', 'shmctl', 'dup', 'dup2', 'pause', 'nanosleep',
  'getitimer', 'alarm', 'setitimer', 'getpid', 'sendfile', 'socket', 'connect',
  'accept', 'bind', 'listen', 'getsockname', 'getpeername', 'socketpair',
  'setsockopt', 'getsockopt', 'clone', 'fork', 'vfork', 'execve', 'exit',
  'wait4', 'kill', 'uname', 'semget', 'semop', 'semctl', 'shmdt', 'msgget',
  'msgsnd', 'msgrcv', 'msgctl', 'fcntl', 'flock', 'fsync', 'fdatasync',
  'truncate', 'ftruncate', 'getdents', 'getcwd', 'chdir', 'fchdir', 'rename',
  'mkdir', 'rmdir', 'creat', 'link', 'unlink', 'symlink', 'readlink', 'chmod'
];

export const generateMockData = (isIntrusion: boolean): SyscallData[] => {
  return COMMON_SYSCALLS.slice(0, 15).map(name => {
    const baseline = Math.floor(Math.random() * 500) + 100;
    let test = isIntrusion 
      ? Math.floor(baseline * (0.5 + Math.random() * 2.5)) 
      : Math.floor(baseline * (0.9 + Math.random() * 0.2));
    
    if (isIntrusion && ['execve', 'mprotect', 'clone', 'socket'].includes(name)) {
      test = baseline * (5 + Math.random() * 10);
    }

    const deviation = Math.abs((test - baseline) / (baseline || 1)) * 100;
    
    return { name, baseline, test, deviation };
  });
};

export const generateTimelineData = (isIntrusion: boolean): TimelinePoint[] => {
  const points: TimelinePoint[] = [];
  const now = Date.now();
  for (let i = 0; i < 20; i++) {
    const time = new Date(now - (20 - i) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let freq = 1000 + Math.random() * 500;
    let score = Math.random() * 10;
    
    if (isIntrusion && i > 14) {
      freq *= 2 + Math.random();
      score = 70 + Math.random() * 30;
    }
    
    points.push({ time, frequency: Math.floor(freq), anomalyScore: Math.floor(score) });
  }
  return points;
};
