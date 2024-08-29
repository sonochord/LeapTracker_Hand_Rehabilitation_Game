# LeapTracker: Hand Tracking and Data Collection System

## Overview

LeapTracker is a C++ application designed to interface with the Leap Motion Controller for advanced hand tracking and data collection. It's primarily used for hand rehabilitation exercises, providing real-time data processing, logging, and transmission capabilities.

Key features include:
- Real-time hand tracking using the Leap Motion Controller
- Data logging to CSV files
- OSC (Open Sound Control) message transmission
- WebSocket server for real-time data broadcasting
- Calculation of various hand metrics and exercise-specific data

## Prerequisites

Before compiling and running LeapTracker, ensure you have the following:

1. Leap Motion Controller and Ultraleap Hand Tracking software
2. C++17 compatible compiler (e.g., Clang)
3. CMake (version 3.14 or higher)
4. vcpkg package manager
5. The following libraries (installable via vcpkg):
   - nlohmann_json
   - OpenSSL
   - asio
   - websocketpp

## Installation

1. Clone the LeapTracker repository:
   ```
   git clone [repository_url]
   cd LeapTracker
   ```

2. Set up vcpkg and install required packages:
   ```
   vcpkg install nlohmann-json openssl asio websocketpp
   ```

3. Create a build directory and navigate to it:
   ```
   mkdir build
   cd build
   ```

4. Configure the project with CMake:
   ```
   cmake .. -DCMAKE_TOOLCHAIN_FILE=[path_to_vcpkg]/scripts/buildsystems/vcpkg.cmake
   ```

5. Build the project:
   ```
   cmake --build .
   ```

## Usage

To run LeapTracker, use the following command:
```
./LeapTrackerFullHand <client_name> <session_number> <exercise_name> <osc_ip> <osc_port> <websocket_port>
```

Parameters:
- `<client_name>`: Name or identifier for the client
- `<session_number>`: Integer representing the session number
- `<exercise_name>`: Name of the exercise being performed
- `<osc_ip>`: IP address for OSC message transmission
- `<osc_port>`: Port number for OSC message transmission
- `<websocket_port>`: Port number for the WebSocket server

Example:
```
./LeapTrackerFullHand John_Doe 1 MakeAFist 127.0.0.1 7400 8080
```

## Features

1. Hand Tracking: Uses the Leap Motion SDK to capture detailed hand movement data.

2. Data Logging: Records hand tracking data to CSV files. Each file is named using the format:
   `<client_name>_session<session_number>_<exercise_name>.csv`

3. OSC Communication: Sends real-time hand data via OSC messages, including:
   - Finger positions (thumb, index, middle, ring, pinky)
   - Distances between thumb and other fingers
   - Exercise-specific metrics (e.g., make a fist, pronation/supination, wrist AROM)

4. WebSocket Server: Broadcasts hand tracking data in real-time using JSON format.

5. Exercise Metrics: Calculates specific metrics for various exercises:
   - Make a Fist
   - Pronation/Supination
   - Wrist Active Range of Motion (AROM)

6. Comprehensive Data Collection: Captures a wide range of hand data including:
   - Individual finger positions and joint angles
   - Wrist position and angles
   - Palm position, roll, pitch, and yaw
   - Hand roll, pitch, and yaw

## Data Output

### CSV File Structure

The CSV file contains the following columns:
- Client Name, Session Number, Exercise Name, Timestamp, Hand
- Finger positions (X, Y, Z for each finger)
- Joint angles (MCP, PIP, DIP for each finger)
- Wrist data (position, flexion/extension, radial/ulnar deviation)
- Palm data (position, roll, pitch, yaw)
- Hand orientation (roll, pitch, yaw)
- Inter-finger distances

### WebSocket Data

Real-time data is sent as JSON objects containing:
- Timestamp
- Hand presence
- Finger positions
- Joint angles
- Wrist and palm data
- Exercise-specific metrics

### OSC Messages

OSC messages are sent for various data points, including:
- Individual finger positions
- Inter-finger distances
- Exercise-specific metrics (e.g., make a fist, pronation/supination, wrist AROM)

## Troubleshooting

1. Ensure the Leap Motion Controller is properly connected and recognised by your system.
2. Verify that the Ultraleap Hand Tracking software is installed and running.
3. Check that all required libraries are correctly installed via vcpkg.
4. If compilation fails, ensure your C++ compiler supports C++17 features.
5. For OSC or WebSocket issues, check firewall settings and ensure the specified ports are open.

## Contributing

Contributions to LeapTracker are welcome. Please fork the repository and submit a pull request with your proposed changes.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Ultraleap for the Leap Motion SDK
- Contributors to the nlohmann_json, OpenSSL, asio, and websocketpp libraries
