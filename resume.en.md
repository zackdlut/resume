<!--
  Heng Zhang · Resume (16 yrs · Telecom / Embedded)
  node build.js resume.en.md --pdf   → resume.en.pdf
-->

# Heng Zhang

![Photo](avatar.jpg)
Target Role: Senior C/C++ Software Engineer, Embedded Software Engineer
Experience: 16 years
Date of Birth: 1987.12
Location: Qingdao, China
Phone: +86-151-9248-5800
Email: 354379271@qq.com

## Education

- Dalian University of Technology ｜ Software Engineering (Embedded Systems) ｜ B.S. ｜ 2006.09 – 2010.06 ｜ CET-6 (557)

## Summary

- 16 years in telecom software: 11 years Linux server networking, 5 years ARM/VxWorks RTOS protocol stacks
- Strong C/C++ on Linux, networking, and multithreading; system design, high concurrency, and performance tuning
- Docker/Kubernetes cloud-native migration and hitless upgrades for carrier-grade products
- Production troubleshooting for North American and European operators; rapid root-cause analysis on complex incidents
- Cross-team technical lead on multiple feature deliveries; fluent professional English
- Hands-on LLM inference and AI agent development

## Technical Skills

- **Languages**: C/C++ (C++11 at work, C++20 in personal projects), Python, Shell; familiar with Go
- **Networking**: TCP/IP, SCTP, HTTP/2, Diameter; 3GPP 4G/5G core specifications
- **Systems**: Linux multithreading and high-concurrency networking; perf, Valgrind, Wireshark
- **Cloud**: Docker, Kubernetes, OpenShift, Helm; hitless rolling upgrades
- **Embedded**: ARM Cortex-M; VxWorks RTOS embedded network stacks
- **AI**: RAG, function calling, ReAct agents; Transformer inference, KV cache, quantization basics

## Work Experience

### Nokia (China) Qingdao ｜ Senior Software Engineer ｜ 2015.06 – Present

- **Modules**: Owner of three core modules—4G/5G networking, DB cache, and common middleware; design reviews and quality gate
- **Leadership**: Led 5–6 engineer squads on new features end to end; onboarding and internal tech talks
- **Cloud Native**: Led container migration of core user-database C++ services; hitless upgrade design (2020 – Present)
- **Production**: Field support for NA/EU operators; led T-Mobile major incident root-cause analysis (2017 – 2020)
- **Core Network**: 4G subscriber DB and IMS features in C/C++ per 3GPP (2015 – 2017)

### Hitachi Information (Dalian) Co., Ltd. ｜ Embedded Software Engineer ｜ 2009.09 – 2015.05

- **Protocol Stacks**: HTTP, UPnP/WSD, CIFS, SNMP on ARM/VxWorks per RFCs in C/C++
- **Print Protocols**: Led AirPrint and Google Cloud Print; products passed AirPrint 1.1–1.5 certification
- **IPv6**: Built IPv6 Ready Logo test lab; stack passed Phase-1/Phase-2
- **Internship**: Embedded printer web UI (HTML/JS/CSS) and Selenium automation (2009 – 2010)

## Project Experience

### T-Mobile Core Signaling Latency Incident ｜ Root-Cause Lead ｜ 2019.06 – 2019.09

- **Background**: Fiber cut caused rerouting; Diameter/SCTP RTT exceeded 140 ms; ~2.29M LTE subscribers affected; VoLTE call volume down 25%
- **Contributions**:
  - Mitigation: log/packet analysis with customer, isolated high-latency paths, traffic shift for fast recovery
  - App layer: Wireshark compared healthy vs failing SCTP; send-side backlog and EAGAIN; single-threaded blocking send starved peers on same thread
  - Root cause: lab replay at same RTT; controlled tests on NIC queues, socket buffers, bare metal vs VM; CentOS virtio multi-queue lacked true RSS → SCTP reordering and fast retransmit; CWND slow recovery at high RTT
  - Fix: connection-level auto-isolation patch, buffer/timeout tuning; roadmap for single-queue, OS upgrade, and connection spreading
- **Results**: Service restored within 12 h; patch accepted in 72 h; ~10× single-connection throughput on single-queue setup; drove WAN latency lab and link-level monitoring

### Core User-DB C++ Services on Kubernetes ｜ Lead Developer ｜ 2020.06 – Present

- **Background**: Multi-process Linux C++ user-database plane moved from VM/VNF to Kubernetes/OpenShift with hitless upgrades
- **Contributions**:
  - Refactor: cloud-native rework of three C++ services—single-container multi-process, ConfigMap injection, hot reload
  - Graceful shutdown: SIGTERM handling, Diameter/HTTP/2 drain, readiness/liveness probes for rolling upgrades
  - Compatibility: mixed old/new Pod versions during rollout
  - Release: Helm charts; Go CRD-based K8s operator; full-product rolling upgrade design
- **Results**: 99.9% success rate during upgrades; 2,500 QPS per Pod; production at T-Mobile, Verizon, Vodafone

### RAG-Based Support & Ticket Q&A ｜ Core Developer ｜ 2025.10 – 2026.03

- **Background**: Manual ticket handling; duplicate issues; docs and past fixes hard to reuse
- **Contributions**:
  - Ingestion pipeline: chunking, embedding, Chroma-backed retrieval; multi-format docs and site crawl
  - RAG chain: query rewrite, retrieval, rerank/reject, cited generation
  - Integration: SSE streaming; Jira REST sync and reconciliation
- **Results**: Resolved tickets as case cards; unified “docs + tickets” search; self-service for customers, faster first response internally

### AI Ops Terminal ｜ Solo Developer ｜ 2026.06 – 2026.09

- **Background**: Ops work jumps across SSH sessions; generic AI lacks terminal context; unsafe autonomous commands
- **Contributions**:
  - Electron + TypeScript multi-tab SSH with context-aware AI sidebar (F12 AI mode)
  - ReAct agent with 30+ tools (shell, files, Git, planning); Plan/Agent/Execute modes
  - Three-tier approval: read-only allowlist + dangerous-command detection; loop guard and step budget
  - Context engineering: tool-scoped prompts, prefix-cache friendly; compression; sub-agents for multi-host read-only probes
- **Results**: Nokia internal AI innovation contest—2nd place; adopted inside the company

### GPT-2 CPU Inference Engine (C++) ｜ Personal Project ｜ 2026.04 – Present

- **Background**: From-scratch Transformer inference on laptop CPU to learn LLM internals
- **Contributions**:
  - Tensor ops with AVX2 SIMD (attention, GELU, LayerNorm, RMSNorm)
  - Compute graph: topo execution, shape inference, buffer reuse, timing
  - GPT-2 124M load, per-head KV cache, prefill/decode; manual forward + graph paths
  - Sampling: temperature, Top-K/Top-P, presence/frequency penalties
- **Results**: ~111 tokens/s decode on Intel Core Ultra 5 135U (14 threads)

### Apple AirPrint Development & Certification (ARM/VxWorks) ｜ Protocol Engineer ｜ 2013.11 – 2015.05

- **Background**: Driverless printing for iPhone/iPad/macOS with Apple certification on resource-constrained ARM/VxWorks
- **Contributions**:
  - Discovery: Bonjour (mDNS/DNS-SD) print service advertisement
  - Jobs: IPP submit/status/error handling; PDF, JPEG, TIFF, URF pipelines
  - RTOS integration: C/C++ on VxWorks alongside stack and drivers
  - Certification: test harness; functional, interop, regression; AirPrint 1.1–1.5 deltas
- **Results**: Multiple printers certified 1.1–1.5; wireless print shipped on product lines

## Patents, Honors & Certifications

- **Patent**: First inventor, PCT [WO2025175539A1](https://patents.google.com/patent/WO2025175539A1) (*AKMA Authentication Based on Device Information*)
- **Award**: Oct 2021 Nokia equity grant (1,000 shares) for outstanding performance
- **China**: Software Designer (Intermediate), National Computer Technology Examination
- **Red Hat**: Certified OpenShift Application Developer ([240-240-408](https://rhtapps.redhat.com/verify?certId=240-240-408))
