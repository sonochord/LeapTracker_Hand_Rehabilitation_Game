//
//  main.cpp
//  LeapTracker_cmd
//
//  Created by Fergal Davis on 29/07/2024.
//
#include <iostream>
#include <string>
#include "LeapTracker.hpp"

int main(int argc, char* argv[]) {
    if (argc < 7) {
        std::cerr << "Usage: " << argv[0] << " <client_name> <session_number> <exercise_name> <osc_ip> <osc_port> <websocket_port>" << std::endl;
        return 1;
    }

    std::string clientName = argv[1];
    int sessionNumber = std::stoi(argv[2]);
    std::string exerciseName = argv[3];
    const char* oscIP = argv[4];
    int oscPort = std::stoi(argv[5]);
    int wsPort = std::stoi(argv[6]);

    LeapTracker tracker(clientName, sessionNumber, exerciseName, oscIP, oscPort, wsPort);

    tracker.startTracking();
    std::cout << "Tracking started. Type 'quit' to stop." << std::endl;

    std::string command;
    while (true) {
        std::cin >> command;
        if (command == "quit") {
            break;
        }
    }

    tracker.stopTracking();
    std::cout << "Tracking stopped." << std::endl;

    return 0;
}

//end of main.cpp //
