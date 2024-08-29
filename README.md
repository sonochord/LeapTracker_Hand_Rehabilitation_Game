# LeapTracker Hand Rehabilitation Game

## Project Overview

This project is a hand rehabilitation system using the Leap Motion Controller 2. It consists of three main components:

1. [LeapTracker](LeapTracker/README.md): A C++ application for hand tracking and data collection.
2. [Leap Browser Hand Rehabilitation Game](LeapBrowserGameCode/README.md): A browser-based game for interactive hand rehabilitation exercises.
3. [LeapTracker Data Analysis](LeapTrackerDataAnalysis/README.md): Python scripts for analysing patient progress data.

## System Description

The LeapTracker Hand Rehabilitation Game is a browser-based system designed for hand rehabilitation exercises. It uses the Leap Motion Controller 2 for tracking hand movements, providing an interactive and engaging environment for patients to perform various exercises while receiving real-time feedback.

### Key Features

- Real-time hand tracking using Leap Motion Controller
- Interactive browser-based game for multiple hand exercises
- Comprehensive data collection and logging
- Real-time data transmission via WebSocket and OSC
- Post-session data analysis and visualisation

## Components

### [LeapTracker](LeapTracker/README.md)

The C++ application that interfaces with the Leap Motion Controller. It handles:
- Real-time hand tracking
- Data logging to CSV files
- OSC and WebSocket data transmission

### [Leap Browser Hand Rehabilitation Game](LeapBrowserGameCode/README.md)

A browser-based game that provides:
- Multiple exercise modes (e.g., thumb-index pinch, make a fist)
- Adjustable difficulty levels
- Visual and auditory feedback
- Score tracking and health system

### [LeapTracker Data Analysis](LeapTrackerDataAnalysis/README.md)

Python scripts for post-session analysis, including:
- Processing of CSV files from LeapTracker sessions
- Generation of box plots and statistical summaries
- Exportation of analysis results

## Getting Started

To set up and run the complete system:

1. Set up the LeapTracker C++ application (see [LeapTracker README](LeapTracker/README.md))
2. Install and configure the browser game (see [Game README](LeapBrowserGameCode/README.md))
3. Prepare the data analysis environment (see [Analysis README](LeapTrackerDataAnalysis/README.md))

## Usage Workflow

1. Start the LeapTracker application to begin hand tracking and data collection
2. Launch the browser game and perform rehabilitation exercises
3. After the session, use the data analysis scripts to process and visualise the collected data

## Contributing

Contributions to any part of this project are welcome. Please refer to the individual component READMEs for specific contribution guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Ultraleap for the Leap Motion SDK
- Contributors to various open-source libraries used in this project
