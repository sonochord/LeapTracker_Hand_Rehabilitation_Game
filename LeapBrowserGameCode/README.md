# Hand Rehabilitation Game

## Overview

This browser-based game is designed to work in conjunction with the LeapTracker package for hand rehabilitation exercises using the Leap Motion Controller. The game provides an interactive environment for patients to perform various hand exercises while receiving real-time visual and auditory feedback.

## Features

- Real-time hand tracking integration with LeapTracker
- Multiple exercise modes:
  - Thumb-index pinch
  - Make a fist
  - Pronation-supination
  - Wrist Active Range of Motion (AROM)
- Adjustable difficulty levels
- Visual and auditory feedback
- Score tracking and health system
- Data collection for progress monitoring

## Prerequisites

Before running the game, ensure you have the following:

1. A modern web browser (Chrome, Firefox, or Edge recommended)
2. Node.js and npm installed
3. LeapTracker package set up and running
4. Leap Motion Controller connected to your computer

## Installation

1. Clone the game repository:
   ```
   git clone [game_repository_url]
   cd hand-rehabilitation-game
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the local development server:
   ```
   npm start
   ```

## Usage

1. Ensure the LeapTracker application is running with the correct parameters:
   ```
   ./LeapTrackerFullHand <client_name> <session_number> <exercise_name> <osc_ip> <osc_port> 8080
   ```
   Note: The WebSocket port should be set to 8080 to match the game's default configuration.

2. Open your web browser and navigate to `http://localhost:3000` (or the port specified by your development server).

3. You should see the game interface with a canvas and control buttons.

4. Use the dropdown menu to select the desired exercise:
   - Thumb-index pinch
   - Make a fist
   - Pronation-supination
   - Wrist AROM

5. Adjust the difficulty using the range slider.

6. Click the "Start" button to begin the game.

7. Perform the selected hand exercise using the Leap Motion Controller. The game will respond to your hand movements in real-time.

8. Avoid red obstacles and collect green ones to increase your score.

9. The game ends when your health reaches zero or you click the "Stop" button.

## Game Controls

- Start Button: Begins the game session
- Stop Button: Ends the current game session
- Exercise Select: Choose the type of exercise to perform
- Range Slider: Adjust the difficulty level (movement range)
- Game Mode: Select between "Regular" and "Endless" modes

## Gameplay

- The player character is represented by a blue circle.
- Move the player up and down by performing the selected hand exercise.
- Green obstacles increase your score when collected.
- Red obstacles decrease your health when hit.
- The game speed increases as you progress.
- In "Endless" mode, you respawn with full health after losing all health points, but your score is reduced.

## Troubleshooting

1. Ensure the LeapTracker application is running and the WebSocket server is active on port 8080.
2. Check that the Leap Motion Controller is properly connected and recognised by your system.
3. Verify that your browser supports WebSocket connections.
4. If you experience lag or stuttering, try closing other applications to free up system resources.
5. For audio issues, ensure your browser has permission to play audio and your system volume is unmuted.

## Customisation

You can customise various aspects of the game by modifying the `game.js` file:

- Adjust game speed, obstacle frequency, or player size
- Modify scoring system or health mechanics
- Change visual elements like colours or shapes
- Alter audio feedback frequencies or durations

## Contributing

Contributions to improve the game are welcome. Please fork the repository and submit a pull request with your proposed changes.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Ultraleap for the Leap Motion SDK
- Tone.js for the Web Audio framework
- WebSocket API for real-time communication
- Node.js and npm for project management



