<div align="center">

# 🛡️ SysGuard IDS  
### System Call–Based Intrusion Detection System

A lightweight, behavior-based Intrusion Detection System (IDS) that detects malicious activity by analyzing deviations in Linux system call patterns.

</div>

---

## 📌 Overview

**SysGuard IDS** is a system call–level intrusion detection system designed to identify abnormal program behavior using **statistical anomaly detection**.

Instead of relying on predefined attack signatures, this system builds a **baseline profile** of normal system call behavior and flags deviations that may indicate:
- Unauthorized access
- Privilege escalation
- Malware execution
- Suspicious file or memory activity

The project focuses on **explainability, visualization, and practical security analysis**, making it suitable for academic, research, and resume-worthy use cases.

---

## 🚀 Features

- 📊 System call frequency analysis  
- 📈 Deviation-based anomaly detection  
- ⚠️ Risk classification (Low / Medium / High / Critical)  
- 📉 Interactive visualizations (charts & timelines)  
- 🧠 Explainable decision logic (non-black-box)  
- 🗂️ History & alert management  
- 🌐 Fully client-side web application  

---

## 🧠 Detection Methodology

1. **Baseline Profile Creation**
   - Collect system call frequency data during normal execution
2. **Test Capture Analysis**
   - Analyze system calls from suspicious execution traces
3. **Deviation Computation**
   - Compare baseline vs test profiles
4. **Threshold-Based Decision**
   - Flag anomalies when deviation exceeds sensitivity threshold
5. **Risk Assessment**
   - Assign severity level based on deviation magnitude

---

## 🧰 Tech Stack

| Layer | Technology |
|-----|-----------|
| Frontend | React + TypeScript |
| Styling | Tailwind CSS |
| Charts | Custom D3 / chart components |
| Logic | Statistical analysis (frequency deviation) |
| Storage | Browser LocalStorage |
| Deployment | Vercel |

---

## 📂 Project Structure

System-Call-Intrution-Detection/
├── src/
│ ├── components/ # UI components
│ ├── services/ # Data processing & analysis logic
│ ├── types/ # Type definitions
│ ├── constants/ # Static config & helpers
│ ├── App.tsx # Main application logic
│ └── main.tsx
├── public/
├── package.json
├── vite.config.ts
└── README.md


---

## ▶️ Run Locally

### Prerequisites
- Node.js (v18 or v20 recommended)

### Steps

```bash
# Install dependencies
npm install

# Run development server
npm run dev
🔮 Future Enhancements

Real system call capture integration

Machine learning–based anomaly scoring

Multi-process correlation

Exportable forensic reports

Kernel-level data ingestion

👤 Author

Yarragunta Chandrakala 
Computer Science & Engineering (Data Science)
Intrusion Detection | Operating Systems | Security Analytics
