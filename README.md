# 🛡️ AI Cloud Permission Risk Visualizer (Initial Phase Demo)

An enterprise cybersecurity platform that uses Artificial Intelligence to analyze, evaluate, and interactively visualize cloud Access & Identity Management (IAM) permission topologies.

---

## 🎯 Main Demonstration Flow
```
Cloud IAM Data Ingestion ➔ IAM Policy Analysis ➔ AI Risk Detection ➔ Risk Scoring ➔ Exploit Path Simulator ➔ Interactive D3 Graph ➔ AI Remediation
```

---

## 🚀 Key Features in Initial Phase Demo

1. **Preset Cloud Attack Scenarios**:
   - 🚨 **Scenario 1: AI Agent Shadow Escalation** (Bedrock AI Agent $\rightarrow$ `iam:PassRole` $\rightarrow$ EC2 Admin $\rightarrow$ S3 PII Exfiltration)
   - ⚠️ **Scenario 2: Over-Privileged K8s Workload** (Container $\rightarrow$ GCP SA $\rightarrow$ AWS OIDC Role $\rightarrow$ KMS Decrypt)
   - ⚡ **Scenario 3: Stale Contractor Access Keys** (Leaked 180-day key $\rightarrow$ `iam:CreatePolicyVersion` $\rightarrow$ Secrets Exfiltration)
   - 🌐 **Scenario 4: Public S3 & Unconstrained Trust** (External caller $\rightarrow$ Role Trust `AWS: "*"` $\rightarrow$ Financial Ledgers)

2. **Custom Policy Import Sandbox**:
   - Paste raw AWS, GCP, or Azure IAM policy JSON or upload `.json` files to generate an instant AI risk graph.

3. **Interactive D3 Visual Graph**:
   - Drag, zoom, pan, and filter nodes by risk score, category (AI Agent, User, Role, Policy, Resource), or cloud provider.

4. **Attack Path Vector Simulator**:
   - Step-by-step interactive attack walk-through with playback controls highlighting exploit hops in real-time.

5. **AI Risk Reasoning & 1-Click Remediation**:
   - Explains *why* permissions are dangerous in plain English with mapped **MITRE ATT&CK** techniques.
   - Generates side-by-side JSON Policy Diffs, AWS CLI scripts, and Terraform HCL code.
   - 1-Click "Apply Remediation" button live-recalculates risk scores and neutralizes exploit vectors.

6. **Executive Audit Report & Security AI Assistant**:
   - Downloadable SOC 2 & ISO 27001 audit report and floating natural language Security AI chatbot.

---

## 💻 Running the Demo Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173/` in your browser.

3. **Build for Production**:
   ```bash
   npm run build
   ```
