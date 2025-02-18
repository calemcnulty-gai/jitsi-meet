# Project PRD: Real-Time Meeting Engagement Analytics for Jitsi Meet

## Overview
**Objective**: Enhance Jitsi Meet with AI-powered engagement analytics to provide hosts with real-time sentiment, gaze tracking, and post-meeting summaries.  
**Timeline**: 1 week (proof-of-concept demo).  
**Key Tools**:  
- **Replicate Models**: Emotion classification, face detection.  
- **OpenAI**: Summarization of engagement trends.  
- **Pinecone**: Time-series storage of engagement data.  
- **Jitsi Plugin System**: Extend UI/UX natively.  

---

## 1. Goals & Non-Goals
### Goals ✅
- Add real-time engagement scoring (sentiment + gaze) visible to hosts during meetings.  
- Generate post-meeting summaries highlighting engagement peaks/drops.  
- Demo-ready visualizations (charts, emoji overlays).  

### Non-Goals 🚫
- Production-grade accuracy or privacy compliance.  
- Full gaze tracking (approximate via head position).  
- Long-term data storage.  

---

## 2. User Stories
- **Host Real-Time Monitoring:**  
  *As a meeting host, I want to see live engagement data (e.g., sentiment scores and gaze metrics) displayed on a dashboard so that I can adapt my presentation in real time if I sense the audience is disengaging.*

- **Engagement Alerts:**  
  *As a meeting host, I want to receive alerts when overall engagement drops below a certain threshold so that I can take immediate action (e.g., ask questions or switch topics) to re-engage the participants.*

- **Post-Meeting Summary Report:**  
  *As a meeting host, I want a post-meeting report summarizing engagement trends, highlighting periods of high and low participation, so that I can review and improve future presentations.*

- **Participant Insight Sharing:**  
  *As an attendee, I want to see anonymized feedback on my engagement level compared to the meeting average so that I can reflect on my participation and improve my involvement in future sessions.*

- **Trend Analysis Over Time:**  
  *As a product manager, I want aggregated engagement data across multiple meetings to analyze long-term trends and identify potential areas for improvement in the conferencing experience.*

- **Diagnostic Feedback for Support:**  
  *As a technical support engineer, I want access to detailed logs and metrics regarding frame capture and processing so that I can quickly diagnose any issues impacting user engagement data collection.*

---

## 3. Technical Approach
### Architecture
1. **Jitsi Plugin (React)**  
   - Captures video frames (1 FPS per participant).  
   - Displays live engagement dashboard.  
2. **Backend Service (FastAPI/Node.js)**  
   - Processes frames via Replicate models.  
   - Stores aggregated data in Pinecone.  
3. **AI Services**  
   - **Replicate Models**:  
     - `cjwbw/vit-base-patch16-224`: Emotion classification (angry, happy, neutral).  
     - `tencentarc/gfpgan`: Face detection and bounding box extraction (for gaze approximation).  
   - **OpenAI**: `gpt-4-turbo` for generating summary insights.  

### Key Dependencies
| Tool          | Use Case                          | Docs Link                               |  
|---------------|-----------------------------------|-----------------------------------------|  
| Jitsi Meet    | Video conferencing base           | [Jitsi Handbook](https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-start) |  
| Replicate     | Emotion/gaze analysis             | [Replicate Docs](https://replicate.com/docs) |  
| Pinecone      | Engagement time-series storage    | [Pinecone Docs](https://docs.pinecone.io) |  

---

## 4. Setup & Integration
### Jitsi-Specific Setup
1. **Local Development**:  
   - Clone the Jitsi Meet repository and start the Docker environment.  
   - Follow the Jitsi Handbook for initial plugin scaffolding.  
2. **Plugin Structure**:  
   - Use the Jitsi Plugin API to inject React components and access video streams.  
3. **Frame Capture**:  
   - Extract frames from participant video streams via canvas.  

---

## 5. Implementation Phases
### Phase 1: Frame Processing (Days 1-3)
1. **Replicate Model Integration**:  
   - Use `cjwbw/vit-base-patch16-224` to classify emotions from frames.  
   - Use `tencentarc/gfpgan` to detect faces and approximate gaze via bounding box position.  
2. **Gaze Approximation**:  
   - Calculate gaze score based on face position relative to screen center.  

### Phase 2: Real-Time UI (Days 4-5)
1. **Jitsi Plugin Components**:  
   - Add a collapsible sidebar showing live engagement charts and emoji overlays.  
   - Use WebSockets or polling to update data every 5 seconds.  

### Phase 3: Post-Meeting Report (Days 6-7)
1. **OpenAI Summary**:  
   - Generate natural-language summaries of engagement trends using aggregated Pinecone data.  

---

## 6. Risks & Mitigations
| Risk                          | Mitigation                                                                 |  
|-------------------------------|---------------------------------------------------------------------------|  
| Replicate model latency       | Process frames asynchronously; show placeholder data while waiting.       |  
| Low camera quality            | Use mock data for demo; add brightness/contrast filters to frames.        |  
| Jitsi plugin API limitations  | Use iframe embeds as fallback for UI components.                          |  

---

## 7. Demo Plan
**Scenario**: Pre-recorded meeting with 3 participants demonstrating varying engagement levels.  

**Demo Flow**:  
1. Start meeting and display live dashboard with emojis/charts.  
2. Highlight OpenAI-generated summary of engagement trends.  
3. Show heatmap overlay (stretch goal).  

---

## 8. Appendices
### Replicate Model Details
| Model                        | Task                     | Cost/Inference |  
|------------------------------|--------------------------|----------------|  
| `cjwbw/vit-base-patch16-224` | Emotion classification   | ~$0.002/image  |  
| `tencentarc/gfpgan`          | Face detection           | ~$0.005/image  |  

### Jitsi Customization Checklist
- [ ] Fork `jitsi-meet` repository.  
- [ ] Test Docker setup locally.  
- [ ] Build plugin boilerplate.  
- [ ] Integrate frame capture and backend API.  