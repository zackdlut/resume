<!--
  Heng Zhang · Embedded-focused resume (16 yrs)
  node build.js resume.embedding.en.md --pdf   → resume.embedding.en.pdf
  General English resume: resume.en.md
-->

# Heng Zhang

![Photo](avatar.jpg)
Target Role: Embedded Software Engineer, Senior C/C++ Software Engineer
Experience: 16 years
Date of Birth: 1987.12.14
Location: Qingdao, China
Phone: +86-151-9248-5800
Email: 354379271@qq.com

## Education

- Dalian University of Technology ｜ Software Engineering (Embedded Systems) ｜ B.S. ｜ 2006.09 – 2010.06 ｜ CET-6 (557)

## Summary

- 16 years C/C++: 5 years ARM/VxWorks/FreeRTOS embedded, 11 years Linux server networking
- UART, I2C, SPI, USB, TCP/IP; led AirPrint and IPP over USB through Apple certification
- Linux multithreading; FreeRTOS exposure; system design, concurrency, and performance tuning
- Production debugging from application layer through Linux network stack and NIC drivers
- Cross-team technical lead; fluent professional English
- LLM inference and AI agent side projects

## Technical Skills

- **Languages**: C/C++ (C++11 at work, C++20 in personal projects); Python, Shell; familiar with Go
- **Embedded**: 5 years ARM/VxWorks/FreeRTOS; task scheduling/sync; WindView for RTOS profiling; UART/I2C/SPI/TCP/IP; USB 2.0 device (printer class, descriptors, bulk endpoints), IPP over USB; ARM Cortex-M basics
- **Networking**: TCP/IP and SCTP retransmission/congestion; RFC-based HTTP/UPnP/SNMP on embedded; IPP, Bonjour, Diameter, 3GPP core
- **Systems**: Linux threads, non-blocking I/O, high-concurrency servers; kernel stack and multi-queue NICs; perf, Valgrind, Wireshark
- **Cloud**: Docker, Kubernetes, OpenShift, Helm; C++ service containerization and hitless upgrades
- **AI**: ReAct agents; from-scratch C++ Transformer inference (SIMD, KV cache)

## Work Experience

### Nokia (China) Qingdao ｜ Senior Software Engineer ｜ 2015.06 – Present

- **Modules**: Owner of three core modules—4G/5G networking, DB cache, middleware; design and quality gate
- **Leadership**: Led 5–6 engineer squads; onboarding and tech sharing
- **Cloud Native**: Core user-database C++ services to Docker/Kubernetes; hitless upgrade (2020 – Present)
- **Production**: NA/EU operator support; T-Mobile incident; Linux stack and virtio multi-queue SCTP issues (2017 – 2020)
- **Core Network**: 4G subscriber DB and IMS in C/C++ per 3GPP (2015 – 2017)

### Hitachi Information (Dalian) Co., Ltd. ｜ Embedded Software Engineer ｜ 2009.09 – 2015.05

- **Protocol Stacks**: HTTP, UPnP, SNMP, CIFS on ARM/VxWorks/FreeRTOS per RFCs
- **Print Protocols**: AirPrint and IPP over USB; AirPrint 1.1–1.5 certification; Google Cloud Print and scan protocols
- **Performance**: WindView task/sync analysis; Wireshark TCP window and retransmit tuning for scan/transfer throughput
- **IPv6**: IPv6 Ready Logo lab; stack passed Phase-1/Phase-2
- **Internship**: Embedded printer management web UI and automation tests (2009 – 2010)

## Project Experience

### Apple AirPrint Development & Certification (ARM/VxWorks/FreeRTOS) ｜ Protocol Engineer ｜ 2013.11 – 2015.05

- **Background**: Driverless wireless print from phones/tablets/PCs with Apple certification on constrained ARM/VxWorks/FreeRTOS
- **Contributions**:
  - Discovery: Bonjour (mDNS/DNS-SD) on LAN
  - Jobs: IPP submit/status/errors; multi-format print pipeline
  - RTOS: C/C++ on VxWorks/FreeRTOS with stack and drivers
  - Certification: harness for 1.1–1.5 functional, interop, regression
- **Results**: Multiple products certified 1.1–1.5; wireless print shipped

### IPP over USB for Printers (ARM/VxWorks/FreeRTOS) ｜ Lead Developer ｜ 2013.11 – 2015.05

- **Background**: USB printing needed host drivers; IPP over USB runs network print protocols on USB printer class for driverless print
- **Contributions**:
  - USB device: printer class interface and bulk endpoints; HTTP over bulk with framing
  - Integration: USB path into existing embedded HTTP server and IPP stack shared with network path
  - RTOS: C on VxWorks/FreeRTOS; concurrency between USB I/O and protocol tasks
  - Test: host interoperability and compatibility fixes
- **Results**: Driverless IPP print and job status over USB matching network behavior

### T-Mobile Core Signaling Latency (Linux Network Stack) ｜ Root-Cause Lead ｜ 2019.06 – 2019.09

- **Background**: Rerouted traffic; signaling RTT >140 ms; ~2.29M LTE users; voice call volume −25%
- **Contributions**:
  - App: packet compare on SCTP; send buffer pile-up; one slow connection blocked peers on same thread
  - Kernel: lab replay; NIC queue count, buffers, PM/VM matrix; virtio multi-queue not flow-steering → SCTP reorder/fast retransmit; CWND recovery at high RTT
  - Fix: C++ per-connection isolation; buffer/timeout tuning; single-queue, OS upgrade, spreading
- **Results**: Restore in 12 h; patch in 72 h; ~10× throughput per connection on single-queue

### User-DB C++ Services on Kubernetes ｜ Lead Developer ｜ 2020.06 – Present

- **Background**: User-database C++ services on VMs → Kubernetes with hitless upgrades
- **Contributions**:
  - Refactor: three core C++ services—single-container multi-process, config inject, hot reload
  - Graceful exit: signal handling, link drain, probes; mixed-version rollout
- **Results**: 99.9% success during upgrades; 2,500 QPS per instance; T-Mobile, Verizon, Vodafone

### AI Ops Terminal ｜ Solo Developer ｜ 2026.06 – 2026.09

- **Background**: Ops needs SSH context; generic AI is blind to terminals
- **Contributions**:
  - Electron multi-tab SSH with terminal-context AI sidebar
  - Function-calling ReAct agent, 30+ tools, three-tier approval
- **Results**: Nokia internal AI contest 2nd place; internal rollout

### GPT-2 CPU Inference Engine (C++) ｜ Personal Project ｜ 2026.04 – Present

- **Background**: Learn LLM inference via from-scratch C++ Transformer on laptop CPU
- **Contributions**:
  - AVX2 ops; compute graph; GPT-2 load, KV cache, prefill/decode
- **Results**: ~111 tokens/s on 14-thread laptop CPU

## Patents, Honors & Certifications

- **Patent**: First inventor, PCT [WO2025175539A1](https://patents.google.com/patent/WO2025175539A1) (*AKMA Authentication Based on Device Information*)
- **Award**: Oct 2021 Nokia equity grant (1,000 shares)
- **China**: Software Designer (Intermediate)
- **Red Hat**: OpenShift Application Developer ([240-240-408](https://rhtapps.redhat.com/verify?certId=240-240-408))
