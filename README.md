# Domus Smart Home

## Edge-Controlled Smart Home Ecosystem Integrating Energy Management, Security, and Privacy-Focused Automation

---

## Project Overview

**Domus** is a unified smart home control and security system, designed to overcome the fragmentation in traditional home automation solutions. Built on the Raspberry Pi platform and supported by a network of ESP32-based sensor nodes, Domus integrates:

- Environmental Monitoring (Air Quality, Temperature, Humidity, Pressure)
- Motion Detection with automatic camera activation
- Vision-Based Surveillance (Object Detection & Face Recognition)
- Energy Monitoring and Smart Plug Control
- Edge-Deployed LLM Integration for natural language queries and interaction

The system operates entirely without cloud dependency, ensuring local data ownership, enhanced privacy, and low-latency control. Domus leverages a hardware-software co-design approach, combining industrial IoT components, machine learning models, and robust system architecture for a responsive, secure, and modular smart home experience.

---

## Problem Statement

Current smart home solutions often rely on fragmented, cloud-dependent ecosystems with limited interoperability between security, environmental sensing, and energy control. Domus addresses this gap by offering an all-encompassing, modular smart home ecosystem deployed at the edge. It harnesses state-of-the-art technologies like on-device Large Language Models (LLMs), lightweight computer vision frameworks (MobileNet SSD, dlib), and real-time data processing to ensure:

- Robust Security: Theft detection through face recognition and motion-triggered camera surveillance.
- Energy Awareness: Live and historical energy consumption monitoring with anomaly alerts.
- Seamless Control: A centralized, app-based interface for device management and status queries.
- Privacy and Data Ownership: No cloud dependency; all computation happens locally.

---

## System Architecture

The architecture consists of a central Raspberry Pi 5 node, which communicates with distributed ESP32-based Domus sensor units, a Raspberry Pi 4 vision module, and the Domus iOS mobile application.

**System Diagram Placeholder:**  
*(Insert system architecture diagram here: ./assets/system_architecture.png)*

---

## Current Status


The Domus Smart Home System is fully developed, tested, and available for installation. All hardware and software components are complete. User manual, test plans, and setup guides are provided within the repository to ensure easy deployment by future users or developers.

---

## Future Work / Recommendations

While the Domus Smart Home System is fully functional, several areas offer opportunities for future improvement or extension:

- **Cloud-Optional Remote Access:** Implement an optional secure cloud relay for remote access when away from the local network, while maintaining local-first architecture.
- **Custom Alert Configuration:** Allow users to define custom alert rules and thresholds directly through the mobile app interface.
- **Multi-User Role Management:** Extend app functionality to support multiple user roles (admin, guest, etc.) with customizable permissions.
- **Enhanced LLM Query Handling:** Improve natural language query robustness by expanding prompt engineering techniques and fine-tuning on home automation-specific datasets.
- **Automatic Sensor Calibration:** Integrate a calibration routine for environmental and motion sensors during initial setup or periodic operation.
- **Additional Smart Appliance Integration:** Extend support to other smart plugs, lights, and appliances through MQTT or Home Assistant-compatible APIs.
- **Battery Backup Option for Sensor Nodes:** Add battery backup to ESP32 sensor nodes for continued operation during power outages.

These enhancements would increase flexibility, scalability, and robustness for long-term deployments and broader user scenarios.

---

## Things to Watch Out For

- Device Pairing Requires Manual Wi-Fi Setup: Ensure ESP32 devices are properly configured with Wi-Fi credentials via AP mode before pairing.
- Startup Sequence: Always power on the Raspberry Pi 5 central node before powering up peripheral ESP32 devices to ensure successful check-in.
- Surveillance Module Dependency: The Raspberry Pi 4 must be active for facial recognition and object detection features to work properly.
- Energy Monitoring Limitations: Ensure appliances connected to the Domus Power Plug do not exceed rated load (15A/1800W).
- Wi-Fi Reliability: The system assumes stable Wi-Fi coverage across all device locations.
- AI Camera Positioning: Place the camera near the main entrance or high-traffic zones for effective motion-triggered surveillance.
- LLM Query Limitations: GPT-based natural language queries require structured prompts; misuse or malformed queries may lead to irrelevant responses.
- Sensor Calibration: Initial placement and testing are recommended to avoid false positives from motion or environmental sensors.

---

## Getting Started (Quick-Start Checklist)

1. Hardware Setup:
   - Power on the Raspberry Pi 5 (central node) and Raspberry Pi 4 (vision module).
   - Connect ESP32 sensors (motion, BME688) to wall sockets and ensure they are within Wi-Fi range.
   - Place the AI camera near desired surveillance areas.
   - Connect the Kasa Smart Plug to a power source and the local network.
   - Refer to `README_HARDWARE.md` for detailed instructions.

2. Software Setup:
   - Clone this repository to your local machine or Raspberry Pi:
     ```bash
     git clone https://github.com/AkBongu1219/SeniorDesignProject
     ```
   - For Domus device users: Directly deploy the Domus iOS app by following setup instructions on `README_SOFTWARE.md`.
   - For manual setup, refer to `README_SOFTWARE.md`to setup backend.  
   - Log into the app using Google login.
   - Pair sensors via the "Devices" screen in the app.

3. First Test Run:
   - Confirm device check-ins on the backend dashboard or through the app.
   - Verify live data streams on the app's Home, Energy, and Surveillance screens.
   - Test LLM integration by querying system status via the app's assistant interface.

4. Need Help?
   - Refer to the User Manual (`User_Manual.pdf`) in this repository.
   - For common errors and troubleshooting, see the "Getting Help" section of the User Manual.
   - Contact Team 27 (emails listed below).

---

## Contributors (Team 27)

| Name                         | Role                               | Email                |
|------------------------------|-------------------------------------|----------------------|
| Venkata Sai Sreeram Andra    | System Integration, ML Pipelines    | vssa8989@bu.edu      |
| Anirudh Singh                | Backend Development, API Integration| ansingh@bu.edu       |
| Vansh Bhatia                 | Hardware Design, Sensor Integration | vansh@bu.edu         |
| Akhil Bongu                  | Vision Module, Object Detection     | akbongu@bu.edu       |

---

*End of README.md*

